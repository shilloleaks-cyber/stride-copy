import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Settings, Plus, Send, Trophy, Target, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/feed/PostCard';
import GroupRankTab from '@/components/group/GroupRankTab';
import CreateGroupChallengeDialog from '@/components/group/CreateGroupChallengeDialog';
import CreateEventDialog from '@/components/group/CreateEventDialog';
import CommentsSheet from '@/components/feed/CommentsSheet';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GroupDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => base44.entities.Group.filter({ id: groupId }).then(g => g[0]),
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const postsKey = ['groupPosts', groupId];

  const { data: posts = [] } = useQuery({
    queryKey: postsKey,
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date', 30),
    enabled: !!groupId,
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
    staleTime: 1500,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['groupChallenges', groupId],
    queryFn: () => base44.entities.GroupChallenge.filter({ group_id: groupId }, '-created_date'),
    enabled: !!groupId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: groupId }, 'event_date'),
    enabled: !!groupId,
  });

  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date());

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.GroupPost.delete(postId);
      return postId;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: postsKey });
      const prev = queryClient.getQueryData(postsKey) || [];
      queryClient.setQueryData(postsKey, prev.filter(p => p.id !== postId));
      return { prev };
    },
    onError: (_err, _postId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(postsKey, ctx.prev);
      toast.error('Delete failed');
    },
    onSuccess: () => {
      toast.success('Deleted');
    },
    onSettled: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: postsKey }), 500);
    },
  });

  const handleDeletePost = (postId) => {
    showConfirm('Delete this post?', () => deletePostMutation.mutate(postId));
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const content = postContent.trim();

      let imageUrl = null;
      let videoUrl = null;

      if (mediaFile) {
        const uploaded = await base44.integrations.Core.UploadFile({ file: mediaFile });
        const url = uploaded?.file_url ?? null;
        if (!url) throw new Error('Upload failed');
        if (mediaFile.type.startsWith('video/')) videoUrl = url;
        else imageUrl = url;
      }

      return await base44.entities.GroupPost.create({
        group_id: groupId,
        author_email: user?.email || '',
        author_name: user?.full_name || 'Runner',
        author_image: user?.profile_image || '',
        content: content || '',
        image_url: imageUrl,
        video_url: videoUrl,
        likes: [],
        comments_count: 0,
      });
    },
    onSuccess: () => {
      toast.success('Posted! +15 coins');
      setPostContent('');
      clearMedia();
      setTimeout(() => queryClient.invalidateQueries({ queryKey: postsKey }), 800);
      base44.functions.invoke('awardActivityCoins', { activityType: 'group_post' });
      queryClient.invalidateQueries(['currentUser']);
    },
    onError: (e) => {
      console.error(e);
      toast.error('Post failed');
    },
  });

  const myMembership = members.find(m => m.user_email === user?.email && m.status === 'active');
  const isOwner = myMembership?.role === 'owner';
  const isAdmin = isOwner || myMembership?.role === 'admin';
  const isMember = !!myMembership;
  const [tab, setTab] = useState('feed');
  const [gearOpen, setGearOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const handleLikePost = async (postId, isLiked) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !user?.email) return;
    const newLikes = isLiked
      ? (post.likes || []).filter(e => e !== user.email)
      : [...(post.likes || []), user.email];
    queryClient.setQueryData(postsKey, (curr = []) =>
      curr.map(p => p.id === postId ? { ...p, likes: newLikes } : p)
    );
    await base44.entities.GroupPost.update(postId, { likes: newLikes });
  };

  const onPickMedia = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxMB = f.type.startsWith('video/') ? 60 : 10;
    if (f.size > maxMB * 1024 * 1024) {
      toast.error(`File too large (max ${maxMB}MB)`);
      return;
    }
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setMediaFile(null);
  };

  const handleDeleteGroup = () => {
    if (!group?.id) return;
    if (myMembership?.role !== 'owner') {
      toast.error("Only owner can delete the group.");
      return;
    }
    showConfirm("Delete this group permanently?", async () => {
      try {
        setBusy(true);
        const postsRes = await base44.entities.GroupPost.filter({ group_id: group.id });
        const allPosts = postsRes?.items || postsRes || [];
        for (const p of allPosts) await base44.entities.GroupPost.delete(p.id);
        const memRes = await base44.entities.GroupMember.filter({ group_id: group.id });
        const allMembers = memRes?.items || memRes || [];
        for (const m of allMembers) await base44.entities.GroupMember.delete(m.id);
        await base44.entities.Group.delete(group.id);
        toast.success("Group deleted");
        queryClient.invalidateQueries(['groups']);
        queryClient.invalidateQueries(['myGroupMemberships']);
        navigate(createPageUrl('Groups'));
      } catch (e) {
        toast.error(e?.message || "Delete group failed");
      } finally {
        setBusy(false);
        setGearOpen(false);
      }
    });
  };

  const handleLeaveGroup = () => {
    if (!group?.id || !myMembership?.id) return;
    if (myMembership.role === 'owner' && (group.member_count || 1) <= 1) {
      toast.error("Owner can't leave when you're the only member. Delete group instead.");
      return;
    }
    showConfirm("Leave this group?", async () => {
      try {
        setBusy(true);
        await base44.entities.GroupMember.update(myMembership.id, {
          status: 'left',
          left_date: new Date().toISOString(),
        });
        await base44.entities.Group.update(group.id, {
          member_count: Math.max(0, (group.member_count || 1) - 1),
        });
        toast.success("Left group");
        queryClient.invalidateQueries(['myGroupMemberships']);
        queryClient.invalidateQueries(['groups']);
        navigate(createPageUrl('Groups'));
      } catch (e) {
        toast.error(e?.message || "Leave group failed");
      } finally {
        setBusy(false);
        setGearOpen(false);
      }
    });
  };

  const handleUploadGroupAvatar = async (file) => {
    if (!file || !group?.id) return;
    try {
      setBusy(true);
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      const url = uploaded?.file_url;
      if (!url) throw new Error("Upload failed (no file_url)");
      await base44.entities.Group.update(group.id, { avatar_image: url });
      toast.success("Updated group photo!");
      queryClient.invalidateQueries(['group', groupId]);
    } catch (e) {
      console.error("upload avatar error:", e);
      toast.error(e?.message || "Update photo failed");
    } finally {
      setBusy(false);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(138, 43, 226, 0.3)' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center flex-1">
            <div className="groupAvatarWrap relative">
              <img
                className="groupAvatar w-14 h-14 rounded-full object-cover border-2 border-white/20"
                src={group?.avatar_image || group?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group?.name || 'G')}&background=222&color=BFFF00`}
                alt="Group avatar"
              />
              {isOwner && (
                <>
                  <input
                    id="groupAvatarInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadGroupAvatar(e.target.files?.[0])}
                  />
                  <button
                    className="avatarEditBtn absolute bottom-0 right-0 w-6 h-6 rounded-full bg-lime-400 text-black flex items-center justify-center text-xs font-bold"
                    onClick={() => document.getElementById('groupAvatarInput')?.click()}
                    aria-label="Change group photo"
                    disabled={busy}
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
            <h1 className="text-base font-medium mt-1">{group.name}</h1>
          </div>

          {isAdmin ? (
            <button
              className="gearBtn w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              onClick={() => setGearOpen(true)}
              aria-label="Group settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Group Info */}
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
        <div className="text-center mb-4">
          <p className="text-sm text-gray-400">{group.description}</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-medium text-white">{group.member_count}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white">{posts.length}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Post Input */}
      {isMember && (
        <div className="px-6 pt-4 pb-4 border-b" style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              {user?.profile_image ? (
                <AvatarImage src={user.profile_image} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share with the group..."
                className="bg-white/5 border-white/10 text-white mb-2"
                rows={2}
              />
              {mediaPreview && (
                <div className="mb-2">
                  {mediaFile?.type?.startsWith('video/') ? (
                    <video src={mediaPreview} controls playsInline className="w-full rounded-xl" />
                  ) : (
                    <img src={mediaPreview} alt="preview" className="w-full rounded-xl" />
                  )}
                  <button
                    type="button"
                    onClick={clearMedia}
                    className="mt-1 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove media
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  id="groupMedia"
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={onPickMedia}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('groupMedia')?.click()}
                  className="text-xs px-3 py-2 rounded-lg text-gray-400 hover:text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  📎 Media
                </button>
                <Button
                  onClick={() => createPostMutation.mutate()}
                  disabled={(!postContent.trim() && !mediaFile) || createPostMutation.isPending}
                  size="sm"
                  style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createPostMutation.isPending ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="groupTabs" role="tablist" aria-label="Group tabs">
        <button type="button" className={`groupTab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')} role="tab" aria-selected={tab === 'feed'}>Feed</button>
        <button type="button" className={`groupTab ${tab === 'rank' ? 'active' : ''}`} onClick={() => setTab('rank')} role="tab" aria-selected={tab === 'rank'}>Rank</button>
        <button type="button" className={`groupTab ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')} role="tab" aria-selected={tab === 'challenges'}>Challenges</button>
        <button type="button" className={`groupTab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')} role="tab" aria-selected={tab === 'events'}>Events</button>
      </div>

      <div className="px-4">
        {/* Feed Tab */}
        {tab === 'feed' && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUserEmail={user?.email} onLike={handleLikePost} onDelete={handleDeletePost} onViewComments={(p) => setCommentsPost(p)} isGroupPost />
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-gray-400 text-sm">No posts yet</p>
                <p className="text-xs text-gray-600 mt-1">Be the first to share!</p>
              </div>
            )}
          </div>
        )}

        {/* Rank Tab */}
        {tab === 'rank' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Group Rankings
            </h3>
            <GroupRankTab groupId={groupId} />
          </div>
        )}

        {/* Challenges Tab */}
        {tab === 'challenges' && (
          <div className="space-y-4">
            <Button onClick={() => setCreateChallengeOpen(true)} className="w-full h-12" style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}>
              <Target className="w-4 h-4 mr-2" />
              Create Mini Challenge
            </Button>
            {challenges.length > 0 ? (
              challenges.map(challenge => (
                <motion.div key={challenge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium">{challenge.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{challenge.description}</p>
                    </div>
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-white font-medium">{challenge.target_value} {challenge.challenge_type === 'distance' ? 'km' : challenge.challenge_type === 'time' ? 'hrs' : challenge.challenge_type === 'runs_count' ? 'runs' : 'days'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Ends</p>
                      <p className="text-white text-sm">{format(new Date(challenge.end_date), 'MMM d')}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No challenges yet</p>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div className="space-y-4">
            <Button onClick={() => setCreateEventOpen(true)} className="w-full h-12" style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-medium">{event.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                    </div>
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{event.attendee_emails?.length || 0} attending</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Sheet */}
      {gearOpen && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999 }}
          onClick={() => setGearOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl p-6 pb-10 space-y-3"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(138,43,226,0.3)', touchAction: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white font-semibold text-base mb-4">Group Settings</p>
            {isMember && !isOwner && (
              <button
                className="w-full py-3 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                onClick={handleLeaveGroup}
                disabled={busy}
              >
                🚪 Leave group
              </button>
            )}
            {isOwner && (
              <button
                className="w-full py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={handleDeleteGroup}
                disabled={busy}
              >
                🗑️ Delete group
              </button>
            )}
            <button
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
              onClick={() => setGearOpen(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999999 }}
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(138,43,226,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-base font-medium text-center">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialogs */}
      <CreateGroupChallengeDialog
        open={createChallengeOpen}
        onClose={() => setCreateChallengeOpen(false)}
        groupId={groupId}
        user={user}
      />
      <CreateEventDialog
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        groupId={groupId}
        user={user}
      />

      <CommentsSheet
        open={!!commentsPost}
        onClose={() => setCommentsPost(null)}
        post={commentsPost}
        currentUser={user}
        entityType="group"
        groupId={groupId}
      />
    </div>
  );
}
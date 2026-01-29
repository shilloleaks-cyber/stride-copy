import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Settings, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostCard from '@/components/feed/PostCard';
import { toast } from 'sonner';

export default function GroupDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState('');
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

  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date'),
    enabled: !!groupId,
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupPost.create({
        group_id: groupId,
        content: postContent,
        author_name: user.full_name,
        author_email: user.email,
        author_image: user.profile_image,
        likes: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts']);
      setPostContent('');
      toast.success('Posted!');
    },
  });

  const isAdmin = members.find(m => m.user_email === user?.email)?.role === 'admin';
  const isMember = members.some(m => m.user_email === user?.email);

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
            onClick={() => navigate(createPageUrl('Groups'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium flex-1 text-center">{group.name}</h1>
          {isAdmin && (
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </button>
          )}
          {!isAdmin && <div className="w-10" />}
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
              <Button
                onClick={() => createPostMutation.mutate()}
                disabled={!postContent.trim() || createPostMutation.isPending}
                size="sm"
                style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
              >
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="px-6 pt-4 space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} isGroupPost />
          ))
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm">No posts yet</p>
            <p className="text-xs text-gray-600 mt-1">Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}
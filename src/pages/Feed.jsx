import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/mobile/PullToRefreshIndicator';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Compass, Clock, TrendingUp, Search } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PostCard from '@/components/feed/PostCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CreatePostModal from '@/components/feed/CreatePostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import GroupsPanel from '@/components/group/GroupsPanel';

const TABS = [
  { value: 'following', label: 'กำลังติดตาม' },
  { value: 'discover', label: 'สำรวจ' },
  { value: 'groups', label: 'Groups' },
];

export default function Feed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'groups' ? 'groups' : tabParam === 'discover' ? 'discover' : 'following'
  );
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [sortBy, setSortBy] = useState('time');
  const [deleteTargetPostId, setDeleteTargetPostId] = useState(null);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });
  const { data: allPosts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 100),
  });

  const { containerRef: pullRef, pullDistance, isRefreshing } = usePullToRefresh(() => refetch(), { threshold: 72 });

  const followingEmails = follows.map(f => f.following_email);
  const filteredPosts = activeTab === 'following'
    ? allPosts.filter(p => followingEmails.includes(p.author_email) || p.author_email === currentUser?.email)
    : allPosts;
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'engagement') {
      return ((b.likes?.length || 0) + (b.comments_count || 0)) - ((a.likes?.length || 0) + (a.comments_count || 0));
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.Post.create(postData),
    onSuccess: () => queryClient.invalidateQueries(['posts']),
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, newLikes }) => base44.entities.Post.update(postId, { likes: newLikes }),
    onMutate: async ({ postId, newLikes }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previous = queryClient.getQueryData(['posts']);
      queryClient.setQueryData(['posts'], (old = []) => old.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) queryClient.setQueryData(['posts'], ctx.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId) => base44.entities.Post.delete(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previous = queryClient.getQueryData(['posts']);
      queryClient.setQueryData(['posts'], (old = []) => old.filter(p => p.id !== postId));
      return { previous };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.previous) queryClient.setQueryData(['posts'], ctx.previous); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['posts'] }); setDeleteTargetPostId(null); },
  });

  const handleLike = (postId, isLiked) => {
    const post = allPosts.find(p => p.id === postId);
    const currentLikes = post?.likes || [];
    const newLikes = isLiked ? currentLikes.filter(e => e !== currentUser?.email) : [...currentLikes, currentUser?.email];
    likeMutation.mutate({ postId, newLikes });
  };

  const switchTab = (val) => {
    setActiveTab(val);
    navigate(createPageUrl(`Feed?tab=${val}`), { replace: true });
  };

  return (
    <div ref={pullRef} className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0F0F0F', position: 'relative' }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(15,15,15,0.97)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ padding: '52px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                Community
              </p>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>Feed</h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {sortBy === 'engagement' ? <TrendingUp style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)' }} /> : <Clock style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)' }} />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <DropdownMenuItem onClick={() => setSortBy('time')} style={{ color: sortBy === 'time' ? '#BFFF00' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                    <Clock style={{ width: 14, height: 14, marginRight: 8 }} /> ล่าสุด
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('engagement')} style={{ color: sortBy === 'engagement' ? '#BFFF00' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                    <TrendingUp style={{ width: 14, height: 14, marginRight: 8 }} /> ยอดนิยม
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => navigate(createPageUrl('Discover'))}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Search style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => switchTab(tab.value)}
                  style={{
                    padding: '9px 16px', borderRadius: '12px 12px 0 0', fontSize: 13, fontWeight: 700,
                    transition: 'all 0.15s',
                    ...(isActive
                      ? { background: '#BFFF00', color: '#0A0A0A', border: '1px solid #BFFF00', borderBottom: 'none' }
                      : { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }
                    ),
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 0' }}>
        {activeTab === 'groups' ? (
          <GroupsPanel embedded={true} />
        ) : isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#1A1A1A', borderRadius: 16, height: 180, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : sortedPosts.length > 0 ? (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserEmail={currentUser?.email}
                  onLike={handleLike}
                  onDelete={(id) => setDeleteTargetPostId(id)}
                  onViewComments={(p) => { setSelectedPost(p); setShowComments(true); }}
                />
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            {activeTab === 'following' ? (
              <>
                <Users style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>ยังไม่มีโพสต์</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>ติดตามนักวิ่งคนอื่นเพื่อดูกิจกรรมของพวกเขา</p>
                <button
                  onClick={() => navigate(createPageUrl('Discover'))}
                  style={{ background: '#BFFF00', color: '#0A0A0A', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Users style={{ width: 16, height: 16 }} /> ค้นหานักวิ่ง
                </button>
              </>
            ) : (
              <>
                <Compass style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>ยังไม่มีโพสต์</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>เป็นคนแรกที่แชร์กิจกรรมวิ่ง!</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreatePost(true)}
        style={{
          position: 'fixed', bottom: 96, right: 20,
          width: 52, height: 52, borderRadius: 16,
          background: '#BFFF00', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(191,255,0,0.35)',
          zIndex: 20,
        }}
      >
        <Plus style={{ width: 22, height: 22, color: '#0A0A0A' }} />
      </motion.button>

      <CreatePostModal open={showCreatePost} onClose={() => setShowCreatePost(false)} onSubmit={(data) => createPostMutation.mutateAsync(data)} user={currentUser} />
      <ConfirmDialog open={!!deleteTargetPostId} title="Delete this post?" confirmLabel="Confirm" cancelLabel="Cancel" confirmVariant="destructive" loading={deleteMutation.isPending} onCancel={() => setDeleteTargetPostId(null)} onConfirm={() => deleteMutation.mutateAsync(deleteTargetPostId)} />
      <CommentsSheet open={showComments} onClose={() => setShowComments(false)} post={selectedPost} currentUser={currentUser} />
    </div>
  );
}
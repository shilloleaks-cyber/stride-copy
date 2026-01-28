import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Compass, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/feed/CreatePostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';

export default function Feed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('following');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'engagement'

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const followingEmails = follows.map(f => f.following_email);

  const { data: allPosts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 100),
  });

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'following' 
    ? allPosts.filter(p => followingEmails.includes(p.author_email) || p.author_email === currentUser?.email)
    : allPosts;

  // Sort posts based on sortBy
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'engagement') {
      const engagementA = (a.likes?.length || 0) + (a.comments_count || 0);
      const engagementB = (b.likes?.length || 0) + (b.comments_count || 0);
      return engagementB - engagementA; // Higher engagement first
    }
    // Default: sort by time (newest first)
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => base44.entities.Post.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }) => {
      const post = allPosts.find(p => p.id === postId);
      const currentLikes = post?.likes || [];
      
      let newLikes;
      if (isLiked) {
        newLikes = currentLikes.filter(email => email !== currentUser?.email);
      } else {
        newLikes = [...currentLikes, currentUser?.email];
      }
      
      await base44.entities.Post.update(postId, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId) => base44.entities.Post.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });

  const handleLike = (postId, isLiked) => {
    likeMutation.mutate({ postId, isLiked });
  };

  const handleViewComments = (post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-white/5" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)' }}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light">ฟีด</h1>
            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    {sortBy === 'engagement' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem 
                    onClick={() => setSortBy('time')}
                    className="text-white cursor-pointer"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    ล่าสุด
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('engagement')}
                    className="text-white cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    ยอดนิยม
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('Discover'))}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white/5 p-1">
              <TabsTrigger 
                value="following" 
                className="flex-1 data-[state=active]:text-black"
                style={{ 
                  backgroundColor: activeTab === 'following' ? '#BFFF00' : 'transparent'
                }}
              >
                กำลังติดตาม
              </TabsTrigger>
              <TabsTrigger 
                value="discover" 
                className="flex-1 data-[state=active]:text-black"
                style={{ 
                  backgroundColor: activeTab === 'discover' ? '#BFFF00' : 'transparent'
                }}
              >
                <Compass className="w-4 h-4 mr-1" />
                สำรวจ
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Posts */}
      <div className="px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : sortedPosts.length > 0 ? (
          <AnimatePresence>
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={currentUser?.email}
                onLike={handleLike}
                onDelete={(id) => deleteMutation.mutate(id)}
                onViewComments={handleViewComments}
              />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            {activeTab === 'following' ? (
              <>
                <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">ยังไม่มีโพสต์</p>
                <p className="text-sm text-gray-600 mt-2">ติดตามนักวิ่งคนอื่นเพื่อดูกิจกรรมของพวกเขา</p>
                <Button 
                  onClick={() => navigate(createPageUrl('Discover'))}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  ค้นหานักวิ่ง
                </Button>
              </>
            ) : (
              <>
                <Compass className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">ยังไม่มีโพสต์ในชุมชน</p>
                <p className="text-sm text-gray-600 mt-2">เป็นคนแรกที่แชร์กิจกรรมวิ่ง!</p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 neon-glow"
        style={{ background: 'linear-gradient(135deg, #BFFF00 0%, #8A2BE2 100%)' }}
      >
        <Plus className="w-6 h-6" style={{ color: '#0A0A0A' }} />
      </motion.button>

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={(data) => createPostMutation.mutateAsync(data)}
        user={currentUser}
      />

      {/* Comments Sheet */}
      <CommentsSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        post={selectedPost}
        currentUser={currentUser}
      />
    </div>
  );
}
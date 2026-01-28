import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Compass, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/feed/PostCard';
import CreatePostModal from '@/components/feed/CreatePostModal';
import CommentsSheet from '@/components/feed/CommentsSheet';
import CrewCard from '@/components/crew/CrewCard';
import CreateCrewModal from '@/components/crew/CreateCrewModal';
import BrowseCrewsModal from '@/components/crew/BrowseCrewsModal';

export default function Feed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('following');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showCreateCrew, setShowCreateCrew] = useState(false);
  const [showBrowseCrews, setShowBrowseCrews] = useState(false);

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

  const { data: crewMembership } = useQuery({
    queryKey: ['crew-membership', currentUser?.email],
    queryFn: () => base44.entities.CrewMember.filter({ user_email: currentUser.email }),
    enabled: !!currentUser
  });

  const myCrew = crewMembership?.[0];

  const { data: crew } = useQuery({
    queryKey: ['crew', myCrew?.crew_id],
    queryFn: () => base44.entities.Crew.filter({ id: myCrew.crew_id }).then(r => r[0]),
    enabled: !!myCrew?.crew_id
  });

  const { data: allPosts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 100),
  });

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'following' 
    ? allPosts.filter(p => followingEmails.includes(p.author_email) || p.author_email === currentUser?.email)
    : allPosts;

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
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-lg border-b border-white/5">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light">ฟีด</h1>
            <div className="flex items-center gap-2">
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
                className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                กำลังติดตาม
              </TabsTrigger>
              <TabsTrigger 
                value="discover" 
                className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <Compass className="w-4 h-4 mr-1" />
                สำรวจ
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Crew Card */}
      <div className="px-6 pt-6 pb-3">
        <CrewCard 
          crew={crew}
          memberData={myCrew}
          onCreateClick={() => setShowCreateCrew(true)}
          onJoinClick={() => setShowBrowseCrews(true)}
        />
      </div>

      {/* Posts */}
      <div className="px-6 pb-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <AnimatePresence>
            {filteredPosts.map((post) => (
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
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 z-20 neon-glow"
      >
        <Plus className="w-6 h-6 text-white" />
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

      {/* Create Crew Modal */}
      <CreateCrewModal
        isOpen={showCreateCrew}
        onClose={(success) => {
          setShowCreateCrew(false);
          if (success) {
            queryClient.invalidateQueries(['crew-membership']);
            queryClient.invalidateQueries(['crew']);
          }
        }}
        user={currentUser}
      />

      {/* Browse Crews Modal */}
      <BrowseCrewsModal
        isOpen={showBrowseCrews}
        onClose={(success) => {
          setShowBrowseCrews(false);
          if (success) {
            queryClient.invalidateQueries(['crew-membership']);
            queryClient.invalidateQueries(['crew']);
          }
        }}
        user={currentUser}
      />
    </div>
  );
}
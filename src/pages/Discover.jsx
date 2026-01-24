import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Users, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import UserCard from '@/components/feed/UserCard';

export default function Discover() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suggested');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const { data: allRuns = [] } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => base44.entities.Run.filter({ status: 'completed' }),
  });

  const followingEmails = follows.map(f => f.following_email);
  const followerEmails = followers.map(f => f.follower_email);

  // Calculate user stats
  const getUserStats = (email) => {
    const userRuns = allRuns.filter(r => r.created_by === email);
    return {
      totalDistance: userRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
      totalRuns: userRuns.length,
    };
  };

  // Filter users
  const otherUsers = allUsers.filter(u => u.email !== currentUser?.email);
  
  const suggestedUsers = otherUsers.filter(u => !followingEmails.includes(u.email));
  
  const followingUsers = otherUsers.filter(u => followingEmails.includes(u.email));
  
  const followerUsers = otherUsers.filter(u => followerEmails.includes(u.email));

  const searchResults = searchQuery.trim() 
    ? otherUsers.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      await base44.entities.Follow.create({
        follower_email: currentUser?.email,
        following_email: targetEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follows']);
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const follow = follows.find(f => f.following_email === targetEmail);
      if (follow) {
        await base44.entities.Follow.delete(follow.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['follows']);
    },
  });

  const handleFollow = (email) => {
    followMutation.mutate(email);
  };

  const handleUnfollow = (email) => {
    unfollowMutation.mutate(email);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-lg border-b border-white/5">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate(createPageUrl('Feed'))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-medium">ค้นหานักวิ่ง</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="px-6 py-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
            ผลการค้นหา ({searchResults.length})
          </h2>
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={followingEmails.includes(user.email)}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  stats={getUserStats(user.email)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">ไม่พบผู้ใช้</p>
          )}
        </div>
      )}

      {/* Tabs (when not searching) */}
      {!searchQuery.trim() && (
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-white/5 p-1 mb-4">
              <TabsTrigger 
                value="suggested" 
                className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs"
              >
                แนะนำ
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs"
              >
                กำลังติดตาม ({followingUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="followers" 
                className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs"
              >
                ผู้ติดตาม ({followerUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggested" className="space-y-3">
              {suggestedUsers.length > 0 ? (
                <AnimatePresence>
                  {suggestedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <UserCard
                        user={user}
                        isFollowing={false}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        stats={getUserStats(user.email)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">คุณติดตามทุกคนแล้ว!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="space-y-3">
              {followingUsers.length > 0 ? (
                <AnimatePresence>
                  {followingUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <UserCard
                        user={user}
                        isFollowing={true}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        stats={getUserStats(user.email)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">คุณยังไม่ได้ติดตามใคร</p>
                  <p className="text-sm text-gray-600 mt-1">ค้นหานักวิ่งเพื่อติดตาม</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="followers" className="space-y-3">
              {followerUsers.length > 0 ? (
                <AnimatePresence>
                  {followerUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <UserCard
                        user={user}
                        isFollowing={followingEmails.includes(user.email)}
                        onFollow={handleFollow}
                        onUnfollow={handleUnfollow}
                        stats={getUserStats(user.email)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีผู้ติดตาม</p>
                  <p className="text-sm text-gray-600 mt-1">แชร์กิจกรรมวิ่งเพื่อให้คนอื่นรู้จักคุณ</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, MapPin, Activity, Coins, Crown, Medal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FriendRequestButton from '@/components/social/FriendRequestButton';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('distance');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsersLeaderboard'],
    queryFn: () => base44.entities.User.list(),
  });

  const sortedUsers = [...users].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (b.total_distance_km || 0) - (a.total_distance_km || 0);
      case 'runs':
        return (b.total_runs || 0) - (a.total_runs || 0);
      case 'tokens':
        return (b.token_balance || 0) - (a.token_balance || 0);
      default:
        return 0;
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-lg font-medium text-gray-500">{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500/30 to-yellow-600/10 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/10 border-gray-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/10 border-amber-600/30';
    return 'from-white/5 to-transparent border-white/10';
  };

  const getValue = (user) => {
    switch (sortBy) {
      case 'distance':
        return `${(user.total_distance_km || 0).toFixed(1)} กม.`;
      case 'runs':
        return `${user.total_runs || 0} ครั้ง`;
      case 'tokens':
        return `${(user.token_balance || 0).toFixed(1)} RUN`;
      default:
        return '';
    }
  };

  const currentUserRank = sortedUsers.findIndex(u => u.email === currentUser?.email) + 1;

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">อันดับ</h1>
        <div className="w-10" />
      </div>

      {/* User's Rank */}
      {currentUserRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6"
        >
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-300">อันดับของคุณ</p>
                <p className="text-2xl font-light text-white">#{currentUserRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 text-lg font-medium">{getValue(currentUser || {})}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort Tabs */}
      <div className="px-6 mt-6">
        <Tabs value={sortBy} onValueChange={setSortBy}>
          <TabsList className="w-full bg-white/5 p-1">
            <TabsTrigger 
              value="distance" 
              className="flex-1 data-[state=active]:text-black text-xs gap-1"
              style={{ backgroundColor: sortBy === 'distance' ? '#BFFF00' : 'transparent' }}
            >
              <MapPin className="w-3 h-3" />
              ระยะทาง
            </TabsTrigger>
            <TabsTrigger 
              value="runs" 
              className="flex-1 data-[state=active]:text-black text-xs gap-1"
              style={{ backgroundColor: sortBy === 'runs' ? '#BFFF00' : 'transparent' }}
            >
              <Activity className="w-3 h-3" />
              ครั้งวิ่ง
            </TabsTrigger>
            <TabsTrigger 
              value="tokens" 
              className="flex-1 data-[state=active]:text-black text-xs gap-1"
              style={{ backgroundColor: sortBy === 'tokens' ? '#BFFF00' : 'transparent' }}
            >
              <Coins className="w-3 h-3" />
              โทเค็น
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard List */}
      <div className="px-6 mt-6 space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : sortedUsers.length > 0 ? (
          sortedUsers.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.email === currentUser?.email;
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-r ${getRankColor(rank)} border rounded-2xl p-4 flex items-center gap-4 ${
                  isCurrentUser ? 'ring-2 ring-emerald-500/50' : ''
                }`}
              >
                <div className="w-10 flex items-center justify-center">
                  {getRankBadge(rank)}
                </div>
                
                <Avatar className={`w-12 h-12 ${rank <= 3 ? 'ring-2 ring-offset-2 ring-offset-gray-950' : ''} ${
                  rank === 1 ? 'ring-yellow-400 neon-glow' : rank === 2 ? 'ring-gray-300' : rank === 3 ? 'ring-amber-600' : ''
                }`}>
                  {user.profile_image ? (
                    <AvatarImage src={user.profile_image} alt={user.full_name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {user.full_name || 'Runner'}
                    {isCurrentUser && <span className="text-emerald-400 text-xs ml-2">(คุณ)</span>}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(user.total_distance_km || 0).toFixed(1)} กม. • {user.total_runs || 0} ครั้ง
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <p className={`text-lg font-medium ${rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
                    {getValue(user)}
                  </p>
                  {!isCurrentUser && (
                    <FriendRequestButton targetUser={user} currentUser={currentUser} />
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มีข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}
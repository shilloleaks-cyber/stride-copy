import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, TrendingUp, Trophy, Zap, Target } from 'lucide-react';

export default function CrewHome() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const crewId = params.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: crew } = useQuery({
    queryKey: ['crew', crewId],
    queryFn: () => base44.entities.Crew.filter({ id: crewId }).then(r => r[0]),
    enabled: !!crewId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['crew-members', crewId],
    queryFn: () => base44.entities.CrewMember.filter({ crew_id: crewId }),
    enabled: !!crewId
  });

  const { data: challenge } = useQuery({
    queryKey: ['crew-challenge', crewId],
    queryFn: async () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const challenges = await base44.entities.CrewChallenge.filter({ 
        crew_id: crewId,
        week_start: weekStartStr
      });
      
      return challenges[0];
    },
    enabled: !!crewId
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['crew-posts', crewId],
    queryFn: async () => {
      const memberEmails = members.map(m => m.user_email);
      if (memberEmails.length === 0) return [];
      
      const allPosts = await base44.entities.Post.list('-created_date', 20);
      return allPosts.filter(p => memberEmails.includes(p.author_email)).slice(0, 5);
    },
    enabled: !!crewId && members.length > 0
  });

  const sortedMembers = [...members].sort((a, b) => 
    (b.weekly_distance_km || 0) - (a.weekly_distance_km || 0)
  );

  const challengeProgress = challenge 
    ? Math.min((challenge.current_km / challenge.goal_km) * 100, 100)
    : 0;

  if (!crew) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Feed'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Crew</h1>
        <div className="w-10" />
      </div>

      {/* Crew Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-4xl mx-auto mb-4">
          {crew.logo_emoji || '🏃'}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{crew.name}</h2>
        {crew.description && (
          <p className="text-sm text-gray-400 mb-3">{crew.description}</p>
        )}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{crew.member_count} members</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span>{crew.weekly_distance_km?.toFixed(1)} km this week</span>
          </div>
        </div>
      </motion.div>

      {/* Weekly Challenge */}
      {challenge && (
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Weekly Challenge</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Run {challenge.goal_km}km together as a crew</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">
                  {challenge.current_km?.toFixed(1)} / {challenge.goal_km} km
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${challengeProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                />
              </div>
              {challenge.completed && (
                <p className="text-xs text-purple-400 text-center mt-2">
                  🎉 Challenge completed! +{challenge.reward_coins} coins each
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-6 mb-6">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          This Week's Leaderboard
        </h3>
        <div className="space-y-2">
          {sortedMembers.slice(0, 10).map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-2xl ${
                member.user_email === user?.email
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-500/30 text-yellow-400' :
                index === 1 ? 'bg-gray-400/30 text-gray-400' :
                index === 2 ? 'bg-orange-500/30 text-orange-400' :
                'bg-white/10 text-gray-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{member.user_name}</p>
                <p className="text-xs text-gray-400">{member.weekly_distance_km?.toFixed(1) || '0.0'} km</p>
              </div>
              {index < 3 && (
                <span className="text-xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mini Activity Feed */}
      <div className="px-6">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Recent Activity
        </h3>
        {recentPosts.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-2xl">
            <p className="text-gray-400 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    {post.author_name?.[0] || '?'}
                  </div>
                  <p className="text-sm font-medium text-white">{post.author_name}</p>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
                {post.run_data && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{post.run_data.distance_km?.toFixed(1)} km</span>
                    <span>•</span>
                    <span>{Math.floor(post.run_data.duration_seconds / 60)} min</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
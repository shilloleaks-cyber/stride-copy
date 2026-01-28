import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function Achievements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list(),
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', user?.email],
    queryFn: () => base44.entities.UserAchievement.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkAchievements', {}),
    onSuccess: (response) => {
      if (response.data.newlyUnlocked && response.data.newlyUnlocked.length > 0) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#8b5cf6']
        });

        toast.success(`🎉 Unlocked ${response.data.newlyUnlocked.length} new achievement(s)!`);
      }
      queryClient.invalidateQueries(['userAchievements']);
      queryClient.invalidateQueries(['currentUser']);
    },
  });

  const unlockedIds = userAchievements.map(ua => ua.achievement_id);

  // Calculate user stats for progress
  const { data: runs = [] } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const { data: questProgress = [] } = useQuery({
    queryKey: ['questProgress', user?.email],
    queryFn: () => base44.entities.QuestProgress.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user?.email,
  });

  const completedRuns = runs.filter(r => r.status === 'completed');
  const totalDistance = completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  const totalRuns = completedRuns.length;
  const completedQuests = questProgress.filter(q => q.completed).length;
  const friendCount = follows.length;

  const getProgress = (achievement) => {
    let current = 0;
    switch (achievement.requirement_type) {
      case 'total_distance':
        current = totalDistance;
        break;
      case 'total_runs':
        current = totalRuns;
        break;
      case 'quest_streak':
        current = completedQuests;
        break;
      case 'friend_count':
        current = friendCount;
        break;
      default:
        current = 0;
    }
    return Math.min(100, (current / achievement.requirement_value) * 100);
  };

  const rarityColors = {
    common: 'gray',
    rare: 'blue',
    epic: 'purple',
    legendary: 'yellow'
  };

  const categories = ['all', 'distance', 'consistency', 'quest', 'social'];

  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === filter);

  const unlockedCount = achievements.filter(a => unlockedIds.includes(a.id)).length;

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(createPageUrl('Profile'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Button
            onClick={() => checkAchievementsMutation.mutate()}
            disabled={checkAchievementsMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Check Progress
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-light mb-2">Achievements</h1>
          <p className="text-gray-400">
            {unlockedCount} / {achievements.length} Unlocked
          </p>
          <Progress value={(unlockedCount / achievements.length) * 100} className="mt-3 h-2" />
        </motion.div>
      </div>

      {/* Category Filter */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === cat ? '#BFFF00' : 'rgba(255, 255, 255, 0.05)',
                color: filter === cat ? '#0A0A0A' : '#9CA3AF'
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="px-6">
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlockedIds.includes(achievement.id);
              const progress = getProgress(achievement);
              const color = rarityColors[achievement.rarity];

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative bg-gradient-to-br ${
                    isUnlocked 
                      ? `from-${color}-500/20 to-${color}-600/10 border-${color}-500/30` 
                      : 'from-white/5 to-white/5 border-white/10'
                  } border rounded-2xl p-5 overflow-hidden`}
                >
                  {/* Rarity Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-1 rounded-full bg-${color}-500/20 text-${color}-400 font-medium uppercase`}>
                      {achievement.rarity}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    {/* Badge Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${
                      isUnlocked ? `bg-${color}-500/20` : 'bg-white/5'
                    } flex items-center justify-center text-3xl flex-shrink-0 ${
                      !isUnlocked && 'grayscale opacity-50'
                    }`}>
                      {isUnlocked ? achievement.badge_emoji : <Lock className="w-6 h-6 text-gray-600" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium mb-1 ${
                        isUnlocked ? 'text-white' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">
                        {achievement.description}
                      </p>

                      {!isUnlocked && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              Progress: {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <Award className="w-4 h-4" />
                          <span>Unlocked!</span>
                          {achievement.reward_coins > 0 && (
                            <span className="text-yellow-400">+{achievement.reward_coins} coins</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
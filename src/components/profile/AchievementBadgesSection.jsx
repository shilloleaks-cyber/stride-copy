import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy } from 'lucide-react';

export default function AchievementBadgesSection({ stats }) {
  const navigate = useNavigate();

  const achievements = [
    {
      id: 'first_run',
      emoji: '🏃',
      name: 'First Run',
      description: 'Completed your first run',
      unlocked: stats.totalRuns >= 1,
      gradient: 'from-emerald-500/30 to-emerald-600/10',
      border: 'border-emerald-500/30',
    },
    {
      id: '10km',
      emoji: '🎯',
      name: '10km Club',
      description: 'Ran 10km total',
      unlocked: stats.totalDistance >= 10,
      gradient: 'from-blue-500/30 to-blue-600/10',
      border: 'border-blue-500/30',
    },
    {
      id: '50km',
      emoji: '⭐',
      name: '50km Star',
      description: 'Ran 50km total',
      unlocked: stats.totalDistance >= 50,
      gradient: 'from-purple-500/30 to-purple-600/10',
      border: 'border-purple-500/30',
    },
    {
      id: '100km',
      emoji: '🏆',
      name: '100km Legend',
      description: 'Ran 100km total',
      unlocked: stats.totalDistance >= 100,
      gradient: 'from-yellow-500/30 to-yellow-600/10',
      border: 'border-yellow-500/30',
    },
    {
      id: '10_runs',
      emoji: '🔥',
      name: '10 Runs Streak',
      description: 'Completed 10 runs',
      unlocked: stats.totalRuns >= 10,
      gradient: 'from-orange-500/30 to-orange-600/10',
      border: 'border-orange-500/30',
    },
    {
      id: '50_runs',
      emoji: '💎',
      name: '50 Runs Master',
      description: 'Completed 50 runs',
      unlocked: stats.totalRuns >= 50,
      gradient: 'from-cyan-500/30 to-cyan-600/10',
      border: 'border-cyan-500/30',
    },
    {
      id: '5k_calories',
      emoji: '💪',
      name: 'Calorie Burner',
      description: 'Burned 5,000 calories',
      unlocked: stats.totalCalories >= 5000,
      gradient: 'from-red-500/30 to-red-600/10',
      border: 'border-red-500/30',
    },
    {
      id: '20k_calories',
      emoji: '🔥',
      name: 'Inferno',
      description: 'Burned 20,000 calories',
      unlocked: stats.totalCalories >= 20000,
      gradient: 'from-orange-500/30 to-orange-600/10',
      border: 'border-orange-500/30',
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h2 className="text-xs uppercase tracking-widest text-gray-500">
            Achievement Badges
          </h2>
          <span className="text-xs text-gray-500">
            ({unlockedCount}/{achievements.length})
          </span>
        </div>
        <button 
          onClick={() => navigate(createPageUrl('Achievements'))}
          className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
        >
          View All →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {achievements.slice(0, 8).map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: achievement.unlocked ? 1 : 0.9, 
              opacity: achievement.unlocked ? 1 : 0.3 
            }}
            transition={{ delay: index * 0.05 }}
            whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
            className={`aspect-square bg-gradient-to-br ${achievement.gradient} border ${achievement.border} rounded-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden`}
          >
            {!achievement.unlocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            )}
            <span className="text-2xl mb-1">{achievement.emoji}</span>
            <p className="text-[10px] text-gray-400 text-center leading-tight">
              {achievement.name}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
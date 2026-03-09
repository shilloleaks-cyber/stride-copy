import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export default function ActiveGoalCard({ goal, completedThisWeek, totalThisWeek, weekProgress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-3xl p-6 mb-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <p className="text-xs uppercase tracking-widest text-purple-400">Active Goal</p>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1">
            {goal.goal_type.replace('_', ' ').toUpperCase()}
          </h2>
          {goal.target_value && (
            <p className="text-gray-400">
              Target: {goal.target_value}
              {goal.goal_type.includes('pace') ? ' min/km' : 'km'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Target Date</p>
          <p className="text-lg font-medium text-white">
            {new Date(goal.target_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">This Week</p>
          <p className="text-sm font-medium text-white">
            {completedThisWeek} / {totalThisWeek} workouts
          </p>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weekProgress}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
          />
        </div>
      </div>
    </motion.div>
  );
}
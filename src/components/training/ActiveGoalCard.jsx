import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export default function ActiveGoalCard({ goal, completedThisWeek, totalThisWeek, weekProgress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 mb-6 relative overflow-hidden"
      style={{
        background: 'rgba(138,43,226,0.10)',
        border: '1px solid rgba(138,43,226,0.30)',
        boxShadow: '0 0 40px rgba(138,43,226,0.12), 0 0 60px rgba(191,255,0,0.06)',
      }}
    >
      {/* top highlight line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(191,255,0,0.35) 50%, transparent 100%)' }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" style={{ color: '#BFFF00' }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#BFFF00' }}>
              Active Goal
            </p>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {goal.goal_type.replace('_', ' ').toUpperCase()}
          </h2>
          {goal.target_value && (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Target: {goal.target_value}
              {goal.goal_type.includes('pace') ? ' min/km' : 'km'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Target Date</p>
          <p className="text-lg font-semibold text-white">
            {new Date(goal.target_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>This Week</p>
          <p className="text-sm font-semibold text-white">
            {completedThisWeek} / {totalThisWeek} workouts
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weekProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #BFFF00, #8A2BE2)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, MoreVertical, PauseCircle, Trash2 } from 'lucide-react';

export default function ActiveGoalCard({ goal, completedTotal, totalSessions, onPause, onDelete }) {
  const progress = totalSessions > 0 ? (completedTotal / totalSessions) * 100 : 0;
  const [menuOpen, setMenuOpen] = useState(false);

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
            {goal.goal_type.replace(/_/g, ' ').toUpperCase()}
          </h2>
          {goal.target_value && (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Target: {goal.target_value}
              {goal.goal_type.includes('pace') ? ' min/km' : 'km'}
            </p>
          )}
        </div>

        {/* Right side: date + menu */}
        <div className="flex items-start gap-3">
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Target Date</p>
            <p className="text-lg font-semibold text-white">
              {new Date(goal.target_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors mt-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  {/* click-away */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 z-20 min-w-[160px] rounded-2xl overflow-hidden py-1"
                    style={{
                      background: 'rgba(18,18,18,0.95)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <button
                      onClick={() => { setMenuOpen(false); onPause?.(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-white/5"
                      style={{ color: 'rgba(255,255,255,0.75)' }}
                    >
                      <PauseCircle className="w-4 h-4 opacity-70" />
                      Pause Goal
                    </button>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />
                    <button
                      onClick={() => { setMenuOpen(false); onDelete?.(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-white/5"
                      style={{ color: 'rgba(255,80,80,0.9)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Goal
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
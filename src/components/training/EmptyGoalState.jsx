import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyGoalState({ onCreateGoal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-8 text-center mb-6"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Target className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
      <h3 className="text-xl font-semibold text-white mb-2">No Active Goal</h3>
      <p className="mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Create a training goal to get your personalized plan
      </p>
      <button
        onClick={onCreateGoal}
        className="px-6 py-2.5 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
      >
        Create Goal
      </button>
    </motion.div>
  );
}
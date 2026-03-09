import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyGoalState({ onCreateGoal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center mb-6"
    >
      <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-white mb-2">No Active Goal</h3>
      <p className="text-gray-400 mb-4">
        Create a training goal to get your personalized plan
      </p>
      <Button onClick={onCreateGoal} className="bg-emerald-600 hover:bg-emerald-700">
        Create Goal
      </Button>
    </motion.div>
  );
}
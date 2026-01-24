import React from 'react';
import { motion } from 'framer-motion';

export default function RunTimer({ seconds, isActive }) {
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center py-8">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Duration</p>
      <motion.div
        animate={isActive ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        className="relative"
      >
        <span className="text-7xl font-extralight tracking-tight text-white tabular-nums">
          {formatTime(seconds)}
        </span>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-xl -z-10"
          />
        )}
      </motion.div>
    </div>
  );
}
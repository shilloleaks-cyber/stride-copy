import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function HeartRateMonitor({ bpm, isActive }) {
  const getHeartRateZone = (bpm) => {
    if (bpm < 100) return { zone: 'Rest', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (bpm < 130) return { zone: 'Fat Burn', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (bpm < 160) return { zone: 'Cardio', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (bpm < 180) return { zone: 'Peak', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { zone: 'Max', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const { zone, color, bg } = getHeartRateZone(bpm);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl p-6 ${bg} border border-white/10 overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Heart Rate</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-light ${color} tabular-nums`}>{bpm}</span>
            <span className="text-sm text-gray-500">bpm</span>
          </div>
          <p className={`text-sm mt-2 ${color}`}>{zone} Zone</p>
        </div>
        
        <motion.div
          animate={isActive ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 60 / bpm, repeat: Infinity }}
        >
          <Heart className={`w-12 h-12 ${color}`} fill="currentColor" />
        </motion.div>
      </div>
      
      {/* Heart rate zones indicator */}
      <div className="mt-4 flex gap-1">
        {['blue', 'green', 'yellow', 'orange', 'red'].map((c, i) => (
          <div
            key={c}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= ['blue', 'green', 'yellow', 'orange', 'red'].indexOf(color.split('-')[1])
                ? `bg-${c}-400`
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Flag } from 'lucide-react';

export default function RunControls({ status, onStart, onPause, onResume, onStop }) {
  return (
    <div className="flex items-center justify-center gap-6 py-6">
      {status === 'idle' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <Play className="w-8 h-8 text-white ml-1" fill="white" />
        </motion.button>
      )}

      {status === 'active' && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStop}
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
          >
            <Square className="w-6 h-6 text-red-400" fill="currentColor" />
          </motion.button>
          
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPause}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
          >
            <Pause className="w-8 h-8 text-white" fill="white" />
          </motion.button>
        </>
      )}

      {status === 'paused' && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStop}
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
          >
            <Flag className="w-6 h-6 text-white" />
          </motion.button>
          
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResume}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </motion.button>
        </>
      )}
    </div>
  );
}
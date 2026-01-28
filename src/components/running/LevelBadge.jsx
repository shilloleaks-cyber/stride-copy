import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function LevelBadge({ level, totalCoins, showProgress = true }) {
  // Calculate progress to next level
  const nextLevelCoins = Math.pow(level + 1, 2) * 10;
  const currentLevelCoins = Math.pow(level, 2) * 10;
  const coinsInLevel = totalCoins - currentLevelCoins;
  const coinsNeeded = nextLevelCoins - currentLevelCoins;
  const progress = Math.min((coinsInLevel / coinsNeeded) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Zap className="w-6 h-6 text-white" fill="white" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-purple-400">Level</p>
          <p className="text-3xl font-bold text-white">{level}</p>
        </div>
      </div>

      {showProgress && (
        <>
          <div className="mb-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {Math.floor(coinsInLevel)} / {coinsNeeded} coins to Level {level + 1}
          </p>
        </>
      )}
    </motion.div>
  );
}
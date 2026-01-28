import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelUpModal({ isOpen, onClose, newLevel, coinsEarned, leveledUp }) {
  useEffect(() => {
    if (isOpen && leveledUp) {
      // Celebrate level up
      const duration = 2000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#a855f7', '#8b5cf6', '#10b981', '#f59e0b']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#a855f7', '#8b5cf6', '#10b981', '#f59e0b']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, leveledUp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[99998] flex items-center justify-center p-4"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gray-900 border border-purple-500/50 rounded-3xl p-8 max-w-sm w-full pointer-events-auto text-center">
              {leveledUp ? (
                <>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 0.6, repeat: 2 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/50"
                  >
                    <Zap className="w-10 h-10 text-white" fill="white" />
                  </motion.div>
                  
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    Level Up!
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-5xl font-bold text-purple-400 mb-4"
                  >
                    {newLevel}
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-gray-400 mb-6"
                  >
                    +{coinsEarned} coins earned
                  </motion.p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">Progress!</h2>
                  <p className="text-gray-400 mb-4">+{coinsEarned} coins earned</p>
                  
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Current Level</p>
                    <p className="text-2xl font-bold text-purple-400">{newLevel}</p>
                  </div>
                </>
              )}
              
              <button
                onClick={onClose}
                className="mt-6 w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
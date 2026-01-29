import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
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
          colors: ['#8A2BE2', '#BFFF00']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#8A2BE2', '#BFFF00']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, leveledUp]);

  const unlockedFeatures = [
    { icon: '🎯', title: 'New Quest Tier', desc: 'Unlock harder challenges' },
    { icon: '🏆', title: 'Elite Status', desc: 'Join leaderboard rankings' },
    { icon: '✨', title: 'Exclusive Skins', desc: 'Customize your experience' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>{modalStyles}</style>
          
          {/* Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: '#0A0A0A' }}
            className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="levelUpModalCard">
              {leveledUp ? (
                <>
                  {/* Particle Glow Background */}
                  <div className="particleGlow" />
                  <div className="particleGlow particleGlow2" />
                  
                  {/* Glowing Purple Circle with Level */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 40px rgba(138, 43, 226, 0.6)',
                        '0 0 60px rgba(138, 43, 226, 0.8)',
                        '0 0 40px rgba(138, 43, 226, 0.6)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="levelCircle"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="levelNumber"
                    >
                      {newLevel}
                    </motion.div>
                  </motion.div>
                  
                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="levelUpTitle"
                  >
                    LEVEL UP!
                  </motion.h2>
                  
                  {/* Coins Earned */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="coinsText"
                  >
                    +{coinsEarned} coins earned
                  </motion.p>
                  
                  {/* Unlocked Features Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="featureCard"
                  >
                    <div className="featureHeader">
                      <Sparkles className="w-5 h-5" style={{ color: '#BFFF00' }} />
                      <span className="featureTitle">UNLOCKED FEATURES</span>
                    </div>
                    <div className="featureList">
                      {unlockedFeatures.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + idx * 0.1 }}
                          className="featureItem"
                        >
                          <span className="featureIcon">{feature.icon}</span>
                          <div>
                            <div className="featureName">{feature.title}</div>
                            <div className="featureDesc">{feature.desc}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  <div className="levelCircle" style={{ width: 100, height: 100 }}>
                    <div className="levelNumber" style={{ fontSize: 36 }}>{newLevel}</div>
                  </div>
                  
                  <h2 className="levelUpTitle" style={{ fontSize: 28 }}>Progress!</h2>
                  <p className="coinsText">+{coinsEarned} coins earned</p>
                </>
              )}
              
              {/* Large Gradient CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: leveledUp ? 1.2 : 0.5 }}
                onClick={onClose}
                className="ctaButton"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Running
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const modalStyles = `
.levelUpModalCard {
  background: #0A0A0A;
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 28px;
  padding: 40px 28px;
  max-width: 420px;
  width: 100%;
  pointer-events: auto;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(138, 43, 226, 0.2) inset;
}

.particleGlow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.25) 0%, transparent 70%);
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}

.particleGlow2 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(191, 255, 0, 0.15) 0%, transparent 70%);
  top: auto;
  bottom: -80px;
  animation-delay: 1.5s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.1);
  }
}

.levelCircle {
  width: 160px;
  height: 160px;
  margin: 0 auto 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(138, 43, 226, 0.9), rgba(138, 43, 226, 0.6));
  border: 2px solid rgba(138, 43, 226, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 40px rgba(138, 43, 226, 0.6), 0 0 80px rgba(138, 43, 226, 0.3) inset;
}

.levelNumber {
  font-size: 72px;
  font-weight: 900;
  color: #BFFF00;
  text-shadow: 0 0 20px rgba(191, 255, 0, 0.8), 0 0 40px rgba(191, 255, 0, 0.4);
  animation: neonPulse 2s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% {
    text-shadow: 0 0 20px rgba(191, 255, 0, 0.8), 0 0 40px rgba(191, 255, 0, 0.4);
  }
  50% {
    text-shadow: 0 0 30px rgba(191, 255, 0, 1), 0 0 60px rgba(191, 255, 0, 0.6);
  }
}

.levelUpTitle {
  font-size: 40px;
  font-weight: 900;
  color: white;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  text-shadow: 0 2px 20px rgba(255, 255, 255, 0.3);
}

.coinsText {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 28px;
}

.featureCard {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 28px;
  text-align: left;
}

.featureHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.featureTitle {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
}

.featureList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.featureItem {
  display: flex;
  align-items: center;
  gap: 12px;
}

.featureIcon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(138, 43, 226, 0.15);
  border: 1px solid rgba(138, 43, 226, 0.3);
  display: grid;
  place-items: center;
  font-size: 18px;
}

.featureName {
  font-size: 14px;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
}

.featureDesc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.ctaButton {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #8A2BE2 0%, #BFFF00 100%);
  color: #0A0A0A;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(138, 43, 226, 0.4), 0 0 0 1px rgba(191, 255, 0, 0.3) inset;
  transition: all 0.2s ease;
}

.ctaButton:hover {
  box-shadow: 0 12px 32px rgba(138, 43, 226, 0.6), 0 0 0 1px rgba(191, 255, 0, 0.5) inset;
}
`;
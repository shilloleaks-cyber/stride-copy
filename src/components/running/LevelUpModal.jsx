import React, { useEffect } from 'react';
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

  if (!isOpen) return null;

  return (
    <>
      <style>{modalStyles}</style>
      
      {/* Dark Overlay */}
      <div
        style={{ backgroundColor: '#0A0A0A' }}
        className="levelUpOverlay fixed inset-0 z-[99998] flex items-center justify-center p-4"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div
        className="levelUpContainer fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
      >
            <div className="levelUpModalCard">
              {leveledUp ? (
                <>
                  {/* Particle Glow Background */}
                  <div className="particleGlow" />
                  <div className="particleGlow particleGlow2" />
                  
                  {/* Glowing Purple Circle with Level */}
                  <div
                    className="levelCircle levelCircleAnimate"
                  >
                    <div
                      className="levelNumber levelNumberAnimate"
                    >
                      {newLevel}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h2
                    className="levelUpTitle levelUpTitleAnimate"
                  >
                    LEVEL UP!
                  </h2>
                  
                  {/* Coins Earned */}
                  <p
                    className="coinsText coinsTextAnimate"
                  >
                    +{coinsEarned} coins earned
                  </p>
                  
                  {/* Unlocked Features Card */}
                  <div
                    className="featureCard featureCardAnimate"
                  >
                    <div className="featureHeader">
                      <Sparkles className="w-5 h-5" style={{ color: '#BFFF00' }} />
                      <span className="featureTitle">UNLOCKED FEATURES</span>
                    </div>
                    <div className="featureList">
                      {unlockedFeatures.map((feature, idx) => (
                        <div
                          key={idx}
                          className="featureItem featureItemAnimate"
                          style={{ animationDelay: `${0.8 + idx * 0.1}s` }}
                        >
                          <span className="featureIcon">{feature.icon}</span>
                          <div>
                            <div className="featureName">{feature.title}</div>
                            <div className="featureDesc">{feature.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
              <button
                onClick={onClose}
                className={`ctaButton ${leveledUp ? 'ctaButtonAnimateLevelUp' : 'ctaButtonAnimateProgress'}`}
              >
                Continue Running
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const modalStyles = `
.levelUpOverlay {
  animation: overlayFadeIn 0.3s ease-out forwards;
}

@keyframes overlayFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.levelUpContainer {
  animation: containerSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes containerSlideIn {
  0% { opacity: 0; transform: scale(0.85) translateY(40px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

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

.levelCircleAnimate {
  animation: levelCirclePulse 2s ease-in-out infinite 0.3s;
}

@keyframes levelCirclePulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 40px rgba(138, 43, 226, 0.6), 0 0 80px rgba(138, 43, 226, 0.3) inset;
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 0 0 60px rgba(138, 43, 226, 0.8), 0 0 100px rgba(138, 43, 226, 0.4) inset;
  }
}

.levelNumber {
  font-size: 72px;
  font-weight: 900;
  color: #BFFF00;
  text-shadow: 0 0 20px rgba(191, 255, 0, 0.8), 0 0 40px rgba(191, 255, 0, 0.4);
  animation: neonPulse 2s ease-in-out infinite;
}

.levelNumberAnimate {
  animation: levelNumberEntry 0.6s ease-out 0.3s backwards;
}

@keyframes levelNumberEntry {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
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

.levelUpTitleAnimate {
  animation: fadeSlideDown 0.5s ease-out 0.4s backwards;
}

@keyframes fadeSlideDown {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.coinsText {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 28px;
}

.coinsTextAnimate {
  animation: fadeIn 0.4s ease-out 0.6s backwards;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.featureCard {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 28px;
  text-align: left;
}

.featureCardAnimate {
  animation: fadeSlideDown 0.5s ease-out 0.7s backwards;
}

.featureItem {
  display: flex;
  align-items: center;
  gap: 12px;
}

.featureItemAnimate {
  animation: fadeSlideLeft 0.4s ease-out backwards;
}

@keyframes fadeSlideLeft {
  0% { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
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
  transform: scale(1.02);
}

.ctaButton:active {
  transform: scale(0.98);
}

.ctaButtonAnimateLevelUp {
  animation: fadeSlideDown 0.5s ease-out 1.2s backwards;
}

.ctaButtonAnimateProgress {
  animation: fadeSlideDown 0.5s ease-out 0.5s backwards;
}
`;
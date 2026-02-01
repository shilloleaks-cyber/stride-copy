import React, { useState, useEffect } from 'react';

export default function AchievementRevealModal({ achievement, rewardCoins, onClose, isOpen }) {
  const [playBurst, setPlayBurst] = useState(false);
  const [hudTarget, setHudTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      // Calculate target position for coins
      const coinHud = document.querySelector('[data-coin-hud="true"]');
      if (coinHud) {
        const rect = coinHud.getBoundingClientRect();
        setHudTarget({ 
          x: rect.left + rect.width / 2, 
          y: rect.top + rect.height / 2 
        });
      } else {
        // Fallback to top-right corner
        setHudTarget({ 
          x: window.innerWidth - 40, 
          y: 30 
        });
      }

      // Trigger burst animation
      setPlayBurst(true);
      const timer = setTimeout(() => setPlayBurst(false), 1200);
      return () => clearTimeout(timer);
    } else {
      setPlayBurst(false);
    }
  }, [isOpen]);

  if (!achievement) return null;

  // Predefined coin trajectories
  const coinOffsets = [
    { dx: -80, dy: -100 },
    { dx: -60, dy: -120 },
    { dx: -40, dy: -90 },
    { dx: 0, dy: -130 },
    { dx: 40, dy: -90 },
    { dx: 60, dy: -120 },
    { dx: 80, dy: -100 },
    { dx: -90, dy: -60 },
    { dx: 90, dy: -60 },
    { dx: -70, dy: -80 },
    { dx: 70, dy: -80 },
    { dx: 0, dy: -110 },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="achievementOverlay" onClick={onClose}>
        {/* Coin Burst Animation */}
        {playBurst && (
          <div 
            className="coinBurstLayer" 
            aria-hidden="true"
            style={{
              '--target-x': `${hudTarget.x}px`,
              '--target-y': `${hudTarget.y}px`
            }}
          >
            {coinOffsets.map((offset, i) => (
              <div
                key={i}
                className="coinBurstParticle"
                style={{
                  '--dx': `${offset.dx}px`,
                  '--dy': `${offset.dy}px`,
                  '--delay': `${i * 0.05}s`
                }}
              >
                🪙
              </div>
            ))}
          </div>
        )}

        <div className="achievementCard" onClick={e => e.stopPropagation()}>
          {/* Achievement Icon */}
          <div className="achievementIcon">
            {achievement.badge_emoji || '🏆'}
          </div>

          {/* Title */}
          <h2 className="achievementTitle">{achievement.title}</h2>

          {/* Description */}
          {achievement.description && (
            <p className="achievementDesc">{achievement.description}</p>
          )}

          {/* Coin Reward */}
          <div className="coinReward">
            +{rewardCoins} COINS
          </div>

          {/* Button */}
          <button className="niceButton" onClick={onClose}>
            Nice!
          </button>
        </div>
      </div>
    </>
  );
}

const styles = `
.achievementOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlayFadeIn 300ms ease-out forwards;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.achievementCard {
  max-width: 90vw;
  width: 360px;
  padding: 32px 24px;
  border-radius: 24px;
  background: radial-gradient(circle at top, #2b0b3f, #0A0A0A);
  border: 1px solid rgba(138, 43, 226, 0.5);
  box-shadow: 0 0 50px rgba(138, 43, 226, 0.6), 0 0 100px rgba(138, 43, 226, 0.3) inset;
  text-align: center;
  animation: cardEnter 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform: scale(0.8);
  opacity: 0;
}

@keyframes cardEnter {
  from { 
    opacity: 0; 
    transform: scale(0.8);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
}

.achievementIcon {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8A2BE2 0%, #C084FC 100%);
  border: 3px solid rgba(191, 255, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  box-shadow: 0 0 30px rgba(138, 43, 226, 0.8), inset 0 0 40px rgba(191, 255, 0, 0.3);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { 
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.8), inset 0 0 40px rgba(191, 255, 0, 0.3);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 45px rgba(138, 43, 226, 1), inset 0 0 50px rgba(191, 255, 0, 0.5);
    transform: scale(1.05);
  }
}

.achievementTitle {
  font-size: 28px;
  font-weight: 900;
  color: #FFFFFF;
  margin: 0 0 12px;
  letter-spacing: 0.02em;
  animation: titleSlide 400ms ease-out 200ms forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes titleSlide {
  from { 
    opacity: 0; 
    transform: translateY(10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

.achievementDesc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px;
  animation: titleSlide 400ms ease-out 300ms forwards;
  opacity: 0;
  transform: translateY(10px);
}

.coinReward {
  display: inline-block;
  padding: 12px 24px;
  margin: 12px 0 24px;
  border-radius: 999px;
  background: rgba(191, 255, 0, 0.15);
  border: 2px solid #BFFF00;
  color: #BFFF00;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.05em;
  box-shadow: 0 0 20px rgba(191, 255, 0, 0.4);
  animation: coinPop 500ms ease-out 400ms forwards;
  opacity: 0;
  transform: scale(0.8);
}

@keyframes coinPop {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.niceButton {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(90deg, #BFFF00 0%, #8FD400 100%);
  color: #0A0A0A;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(191, 255, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease-in-out;
  animation: buttonSlide 400ms ease-out 500ms forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes buttonSlide {
  from { 
    opacity: 0; 
    transform: translateY(10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

.niceButton:active {
  transform: scale(0.97);
}

@media (max-width: 420px) {
  .achievementCard {
    padding: 28px 20px;
  }
  .achievementIcon {
    width: 80px;
    height: 80px;
    font-size: 40px;
  }
  .achievementTitle {
    font-size: 24px;
  }
}

/* Coin Burst Animation */
.coinBurstLayer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10000;
}

.coinBurstParticle {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(191, 255, 0, 0.6));
  animation: 
    coinBurstOut 0.3s ease-out var(--delay, 0s) forwards,
    coinFlyToHud 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) calc(var(--delay, 0s) + 0.3s) forwards;
}

@keyframes coinBurstOut {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(0.5) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: translate3d(var(--dx, 0), var(--dy, 0), 0) scale(1) rotate(180deg);
  }
}

@keyframes coinFlyToHud {
  0% {
    opacity: 1;
    transform: translate3d(var(--dx, 0), var(--dy, 0), 0) scale(1) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: translate3d(
      calc(var(--target-x) - 50vw), 
      calc(var(--target-y) - 50vh), 
      0
    ) scale(0.3) rotate(720deg);
  }
}
`;
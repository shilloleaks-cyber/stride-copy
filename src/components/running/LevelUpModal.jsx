import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LEVEL_REWARDS = {
  2: 'Unlock Custom Route Colors',
  3: 'Unlock Ghost Runs',
  4: 'Unlock Friend Challenges',
  5: 'Unlock Weekly Tournaments',
  6: 'Unlock Advanced Analytics',
  7: 'Unlock Merchandise Redemption',
  8: 'Unlock VIP Status',
  9: 'Unlock Custom Achievements',
  10: 'Legendary Runner Badge',
};

export default function LevelUpModal({ isOpen, prevLevel, newLevel, onClose }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const playedRef = useRef(false);

  const hasLeveledUp = isOpen && newLevel > prevLevel;

  useEffect(() => {
    if (hasLeveledUp && !playedRef.current) {
      // Sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      // Haptic
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(200);
      }
      playedRef.current = true;
    } else if (!isOpen) {
      playedRef.current = false;
    }
  }, [hasLeveledUp]);

  if (!hasLeveledUp) return null;

  const handleViewLevel = () => {
    onClose();
    navigate(createPageUrl('LevelProgress'));
  };

  const reward = LEVEL_REWARDS[newLevel] || 'New Achievement Unlocked';

  return (
    <>
      <style>{styles}</style>
      <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-game-level-up-alert-1004.mp3" preload="auto" />

      <div className="levelUpOverlay" onClick={onClose}>
        <div className="levelUpModalCard" onClick={e => e.stopPropagation()}>
          {/* Purple Glowing Ring */}
          <div className="levelRing">
            <div className="levelNumber">{newLevel}</div>
          </div>

          {/* Title */}
          <h2 className="levelUpHeading">LEVEL UP</h2>

          {/* Badge */}
          <div className="levelBadge">
            Lv.{newLevel} Runner
          </div>

          {/* Reward Text */}
          <p className="rewardText">{reward}</p>

          {/* Buttons */}
          <div className="ctaContainer">
            <button onClick={handleViewLevel} className="ctaButton primaryBtn">
              View Level
            </button>
            <button onClick={onClose} className="ctaButton secondaryBtn">
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = `
.levelUpOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: overlayFadeIn 200ms ease-out forwards;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.levelUpModalCard {
  max-width: 92vw;
  max-height: 80vh;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  border-radius: 24px;
  background: radial-gradient(circle at top, #2b0b3f, #050505);
  box-shadow: 0 0 40px rgba(138, 43, 226, 0.6), 0 0 80px rgba(138, 43, 226, 0.3) inset;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: cardEnter 220ms ease-out forwards;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

@keyframes cardEnter {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.levelRing {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8A2BE2 0%, #C084FC 100%);
  border: 3px solid rgba(191, 255, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(138, 43, 226, 0.8), inset 0 0 30px rgba(191, 255, 0, 0.4);
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(138, 43, 226, 0.8), inset 0 0 30px rgba(191, 255, 0, 0.4); }
  50% { box-shadow: 0 0 30px rgba(138, 43, 226, 1), inset 0 0 40px rgba(191, 255, 0, 0.6); }
}

.levelNumber {
  font-size: 64px;
  font-weight: 900;
  color: #BFFF00;
  text-shadow: 0 0 10px rgba(191, 255, 0, 0.8), 0 0 20px rgba(191, 255, 0, 0.4);
  animation: numberPop 0.4s ease-out forwards;
  opacity: 0;
  transform: scale(0.8);
}

@keyframes numberPop {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

.levelUpHeading {
  font-size: 32px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 0.05em;
  margin: 0;
  animation: fadeInDown 0.3s ease-out 100ms forwards;
  opacity: 0;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.levelBadge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.6);
  border: 1px solid #BFFF00;
  color: #BFFF00;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 15px rgba(191, 255, 0, 0.25);
  animation: fadeInDown 0.3s ease-out 200ms forwards;
  opacity: 0;
}

.rewardText {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  max-width: 85%;
  animation: fadeInDown 0.3s ease-out 300ms forwards;
  opacity: 0;
}

.ctaContainer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
  padding-bottom: env(safe-area-inset-bottom);
  animation: fadeInDown 0.3s ease-out 400ms forwards;
  opacity: 0;
}

.ctaButton {
  height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;
}

.ctaButton:active {
  transform: scale(0.98);
}

.primaryBtn {
  background: linear-gradient(90deg, #BFFF00 0%, #8FD400 100%);
  color: #0A0A0A;
  box-shadow: 0 0 20px rgba(191, 255, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.secondaryBtn {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 420px) {
  .levelUpModalCard {
    padding: 20px;
    gap: 16px;
  }
  .levelRing {
    width: 120px;
    height: 120px;
  }
  .levelNumber {
    font-size: 52px;
  }
  .levelUpHeading {
    font-size: 28px;
  }
  .rewardText {
    font-size: 14px;
  }
}
`;
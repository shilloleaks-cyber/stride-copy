import React, { useState, useEffect } from 'react';

const COIN_PARTICLES = 12;
const ARRIVAL_MS = 950;

function triggerHaptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(20);
  } catch {}
}

function playCoinDing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "triangle";
    o.frequency.setValueAtTime(1200, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.13);

    setTimeout(() => ctx.close?.(), 250);
  } catch {}
}

function pulseCoinHud() {
  const el = document.querySelector('[data-coin-hud="true"]');
  if (!el) return;
  el.classList.remove("coinHudPulse");
  void el.offsetWidth;
  el.classList.add("coinHudPulse");
  setTimeout(() => el.classList.remove("coinHudPulse"), 450);
}

function triggerArrivalFeedback() {
  pulseCoinHud();
  triggerHaptic();
  playCoinDing();
}

export default function AchievementRevealModal({ achievement, rewardCoins, onClose, isOpen }) {
  const [burstActive, setBurstActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const [hudTarget, setHudTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) {
      setBurstActive(false);
      return;
    }

    // Calculate target position for coins
    const coinHud = document.querySelector('[data-coin-hud="true"]');
    let targetX, targetY;
    
    if (coinHud) {
      const rect = coinHud.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    } else {
      // Fallback to top-right corner
      targetX = window.innerWidth - 40;
      targetY = 30;
    }

    // Calculate travel vector from modal center
    const modalCenterX = window.innerWidth / 2;
    const modalCenterY = window.innerHeight / 2;
    const tx = targetX - modalCenterX;
    const ty = targetY - modalCenterY;

    setHudTarget({ x: tx, y: ty });

    // Generate random particle parameters
    const newParticles = Array.from({ length: COIN_PARTICLES }, () => ({
      dx: Math.random() * 48 - 24,
      dy: Math.random() * 36 - 18,
      rot: Math.random() * 360 - 180,
      s: Math.random() * 0.3 + 0.85,
    }));
    setParticles(newParticles);

    // Delay burst start for cinematic effect
    setBurstActive(false);
    const timer = setTimeout(() => setBurstActive(true), 200);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Trigger arrival feedback when burst completes
  useEffect(() => {
    if (!burstActive) return;
    const t = setTimeout(() => {
      triggerArrivalFeedback();
    }, ARRIVAL_MS);
    return () => clearTimeout(t);
  }, [burstActive]);

  if (!achievement) return null;

  return (
    <>
      <style>{styles}</style>
      <div className="achievementOverlay" onClick={onClose}>
        {/* Coin Burst Animation */}
        {burstActive && (
          <div className="coinBurstLayer" aria-hidden="true">
            {particles.map((particle, i) => (
              <div
                key={i}
                className="coinBurstParticle"
                style={{
                  '--dx': `${particle.dx}px`,
                  '--dy': `${particle.dy}px`,
                  '--tx': `${hudTarget.x}px`,
                  '--ty': `${hudTarget.y}px`,
                  '--rot': `${particle.rot}deg`,
                  '--s': particle.s,
                  animationDelay: `${i * 25}ms`
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
  inset: 0;
  pointer-events: none;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coinBurstParticle {
  position: absolute;
  font-size: 24px;
  filter: drop-shadow(0 0 6px rgba(191, 255, 0, 0.5));
  will-change: transform, opacity;
  animation: coinFly 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes coinFly {
  0% {
    transform: translate3d(0, 0, 0) scale(0.6) rotate(0deg);
    opacity: 0;
    filter: drop-shadow(0 0 6px rgba(191, 255, 0, 0.5)) blur(0.2px);
  }
  15% {
    opacity: 1;
    transform: translate3d(var(--dx), var(--dy), 0) scale(1.0) rotate(calc(var(--rot) * 0.3));
    filter: drop-shadow(0 0 8px rgba(191, 255, 0, 0.6)) blur(0px);
  }
  70% {
    opacity: 1;
    transform: translate3d(calc(var(--tx) * 0.75), calc(var(--ty) * 0.75), 0) scale(var(--s)) rotate(var(--rot));
    filter: drop-shadow(0 0 10px rgba(191, 255, 0, 0.7)) blur(0px);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--tx), var(--ty), 0) scale(0.7) rotate(calc(var(--rot) * 1.2));
    filter: drop-shadow(0 0 4px rgba(191, 255, 0, 0.3)) blur(0.5px);
  }
}

/* Coin HUD Pulse Feedback */
.coinHudPulse {
  animation: coinHudPulse 420ms ease-out !important;
  transform-origin: center;
}

@keyframes coinHudPulse {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}
`;
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * CoinAnimationFlow Component
 * Handles the complete coin reward animation flow:
 * 1. Mini coins spawn from source card
 * 2. Coins travel in curved arc to target pill
 * 3. Coin balance rolls up
 * 4. Toast notification appears
 */
export default function CoinAnimationFlow({
  isActive,
  sourceRef,
  rewardAmount,
  onAnimationComplete,
}) {
  const [coins, setCoins] = useState([]);
  const [targetPillRect, setTargetPillRect] = useState(null);

  // Get target pill position from global ref (Home page coin pill)
  useEffect(() => {
    if (!isActive) return;
    
    const targetRef = window.__coinPillRef?.current;
    if (!targetRef) {
      console.warn('Coin pill ref not found');
      return;
    }
    
    const rect = targetRef.getBoundingClientRect();
    setTargetPillRect({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [isActive]);

  // Spawn coins when animation becomes active
  useEffect(() => {
    if (!isActive || !sourceRef?.current || !targetPillRect) return;

    const sourceRect = sourceRef.current.getBoundingClientRect();
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;

    // Create 6-10 coins
    const coinCount = 6 + Math.floor(Math.random() * 5);
    const newCoins = Array.from({ length: coinCount }).map((_, i) => ({
      id: `coin-${Date.now()}-${i}`,
      startX: sourceCenterX,
      startY: sourceCenterY,
      endX: targetPillRect.x,
      endY: targetPillRect.y,
      delay: i * 0.05,
    }));

    setCoins(newCoins);

    // Remove coins after animation completes (2.5s = 2000ms animation + delays)
    const timer = setTimeout(() => {
      setCoins([]);
      onAnimationComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isActive, sourceRef, targetPillRect, onAnimationComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99998 }}>
      {coins.map((coin) => (
        <CoinParticle
          key={coin.id}
          startX={coin.startX}
          startY={coin.startY}
          endX={coin.endX}
          endY={coin.endY}
          delay={coin.delay}
        />
      ))}
    </div>
  );
}

/**
 * Individual coin particle that travels from source to target
 */
function CoinParticle({ startX, startY, endX, endY, delay }) {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Curved arc: control point for quadratic bezier
  const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 80;
  const midY = (startY + endY) / 2 - distance * 0.3;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: dx, y: dy, opacity: 0, scale: 0.5 }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94], // custom cubic-bezier (accelerate near end)
      }}
      style={{
        position: 'fixed',
        left: startX,
        top: startY,
        fontSize: '20px',
        filter: 'drop-shadow(0 0 10px rgba(191, 255, 0, 0.6))',
      }}
    >
      🪙
    </motion.div>
  );
}

/**
 * Toast notification for "+X.XX RUN"
 * Anchored to coin pill with safe viewport positioning
 */
export function showCoinRewardToast(amount) {
  const toastId = toast.custom((t) => (
    <div
      style={{
        position: 'fixed',
        top: 'calc(14px + 10px + 20px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(260px, calc(100vw - 32px))',
        background: 'rgba(10, 10, 10, 0.92)',
        border: '1px solid rgba(191, 255, 0, 0.3)',
        borderRadius: '999px',
        padding: '10px 14px',
        color: '#BFFF00',
        fontSize: '14px',
        fontWeight: '800',
        textShadow: '0 0 10px rgba(191, 255, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(191, 255, 0, 0.2)',
        whiteSpace: 'nowrap',
        zIndex: 99999,
        animation: 'coinToastRise 0.7s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes coinToastRise {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px);
          }
        }
      `}</style>
      +{amount.toFixed(2)} RUN
    </div>
  ), {
    duration: 700,
    position: 'top-center',
  });

  return toastId;
}
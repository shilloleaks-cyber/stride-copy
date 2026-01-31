import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playSpawnSound, playTravelSound } from '@/components/utils/audioSystem';

/**
 * Spawns animated coins that fly to a destination (Home coin pill)
 * @param {number} count - Number of coins to spawn
 * @param {object} origin - Starting position { x, y }
 * @param {object} destination - End position { x, y } - typically Home coin pill
 * @param {function} onComplete - Callback when animation completes
 */
export default function CoinFlyAnimation({ count = 8, origin, destination, onComplete }) {
  const [coins, setCoins] = useState([]);
  const [safe, setSafe] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Validate positions and use safe fallbacks
    const safeOrigin = {
      x: origin?.x ?? window.innerWidth / 2,
      y: origin?.y ?? window.innerHeight / 3,
    };
    const safeDest = {
      x: destination?.x ?? window.innerWidth - 50,
      y: destination?.y ?? 30,
    };
    
    setSafe(safeDest);

    // Generate coins with slight random offsets
    const newCoins = Array.from({ length: count }).map((_, i) => ({
      id: i,
      delay: i * 0.08, // Stagger spawning
      offsetX: (Math.random() - 0.5) * 40,
      offsetY: (Math.random() - 0.5) * 40,
      startX: safeOrigin.x,
      startY: safeOrigin.y,
      endX: safeDest.x,
      endY: safeDest.y,
    }));
    setCoins(newCoins);

    // Play spawn sound for each coin
    newCoins.forEach((coin, idx) => {
      setTimeout(() => {
        playSpawnSound();
      }, idx * 80);
    });

    // Trigger completion callback
    const totalDuration = (count * 0.08 + 0.8) * 1000;
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [origin, destination, count, onComplete]);

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      pointerEvents: 'none', 
      zIndex: 99999 
    }}>
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          initial={{
            x: coin.startX + coin.offsetX,
            y: coin.startY + coin.offsetY,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: [
              coin.startX + coin.offsetX,
              coin.startX + coin.offsetX + (Math.random() - 0.5) * 60,
              coin.endX,
            ],
            y: [
              coin.startY + coin.offsetY,
              coin.startY + coin.offsetY - Math.min(100, window.innerHeight * 0.25),
              coin.endY,
            ],
            scale: [0, 1.2, 0.8],
            opacity: [0, 1, 1],
            rotate: [0, 180 + Math.random() * 180, 360],
          }}
          transition={{
            duration: 0.8,
            delay: coin.delay,
            ease: [0.34, 1.56, 0.64, 1],
            onUpdate: (latest) => {
              // Play travel sound mid-flight
              if (latest.y > coin.startY + coin.offsetY - Math.min(100, window.innerHeight * 0.25) * 0.8 &&
                  latest.y < coin.startY + coin.offsetY - Math.min(100, window.innerHeight * 0.25) * 0.2) {
                if (!window._coinTravelPlayed) {
                  const panValue = (coin.endX - coin.startX) / window.innerWidth;
                  playTravelSound(Math.max(-1, Math.min(1, panValue)));
                  window._coinTravelPlayed = true;
                }
              }
            },
          }}
          onAnimationComplete={() => {
            delete window._coinTravelPlayed;
          }}
          style={{
            position: 'absolute',
            fontSize: 'clamp(20px, 5vw, 28px)',
            filter: 'drop-shadow(0 0 8px rgba(191,255,0,0.5))',
          }}
        >
          🪙
        </motion.div>
      ))}
    </div>
  );
}
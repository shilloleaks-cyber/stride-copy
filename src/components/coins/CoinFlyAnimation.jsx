import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Spawns animated coins that fly to a destination (Home coin pill)
 * @param {number} count - Number of coins to spawn
 * @param {object} origin - Starting position { x, y }
 * @param {object} destination - End position { x, y } - typically Home coin pill
 * @param {function} onComplete - Callback when animation completes
 */
export default function CoinFlyAnimation({ count = 8, origin, destination, onComplete }) {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    // Generate coins with slight random offsets
    const newCoins = Array.from({ length: count }).map((_, i) => ({
      id: i,
      delay: i * 0.08, // Stagger spawning
      offsetX: (Math.random() - 0.5) * 40, // Random spread
      offsetY: (Math.random() - 0.5) * 40,
    }));
    setCoins(newCoins);

    // Trigger completion callback
    const totalDuration = (count * 0.08 + 0.8) * 1000; // delay + animation time
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

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
            x: origin.x + coin.offsetX,
            y: origin.y + coin.offsetY,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: [
              origin.x + coin.offsetX,
              origin.x + coin.offsetX + (Math.random() - 0.5) * 60,
              destination.x,
            ],
            y: [
              origin.y + coin.offsetY,
              origin.y + coin.offsetY - 100 - Math.random() * 60, // Arc up
              destination.y,
            ],
            scale: [0, 1.2, 0.8],
            opacity: [0, 1, 1],
            rotate: [0, 180 + Math.random() * 180, 360],
          }}
          transition={{
            duration: 0.8,
            delay: coin.delay,
            ease: [0.34, 1.56, 0.64, 1], // Bouncy cubic-bezier
          }}
          style={{
            position: 'absolute',
            fontSize: '28px',
            filter: 'drop-shadow(0 0 8px rgba(191,255,0,0.5))',
          }}
        >
          🪙
        </motion.div>
      ))}
    </div>
  );
}
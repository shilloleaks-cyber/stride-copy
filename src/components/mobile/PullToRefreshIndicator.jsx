import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 72 }) {
  const progress = Math.min(pullDistance / threshold, 1);
  const triggered = pullDistance >= threshold;

  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
        height: isRefreshing ? 56 : Math.max(pullDistance, 0),
        overflow: 'hidden',
      }}
      animate={{ height: isRefreshing ? 56 : Math.max(pullDistance, 0) }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(191,255,0,0.12)',
          border: '1px solid rgba(191,255,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(191,255,0,0.2)',
        }}
      >
        {isRefreshing ? (
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: '#BFFF00' }}
          />
        ) : (
          <RefreshCw
            className="w-4 h-4"
            style={{
              color: triggered ? '#BFFF00' : 'rgba(191,255,0,0.5)',
              transform: `rotate(${progress * 180}deg)`,
              transition: 'transform 0.1s ease',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Floating toast notification near coin pill
 * @param {string} message - Toast message (e.g., "+15.25 RUN")
 * @param {boolean} isRare - Whether this is a rare reward
 * @param {object} position - Position { x, y }
 */
export default function FloatingToast({ message, isRare, position = { x: '90%', y: '12%' } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -12, -12, -24], scale: [0.8, 1, 1, 0.9] }}
      transition={{ duration: 0.7, times: [0, 0.15, 0.85, 1] }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 20px)',
        zIndex: 99998,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          borderRadius: '999px',
          background: 'rgba(10, 10, 10, 0.92)',
          border: '1px solid rgba(191, 255, 0, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(191, 255, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {isRare && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: '900',
              color: '#C084FC',
              textShadow: '0 0 10px rgba(192, 132, 252, 0.6)',
            }}
          >
            RARE ✨
          </span>
        )}
        <span
          style={{
            fontSize: '14px',
            fontWeight: '900',
            color: '#BFFF00',
            textShadow: '0 0 12px rgba(191, 255, 0, 0.5)',
          }}
        >
          {message}
        </span>
      </div>
    </motion.div>
  );
}
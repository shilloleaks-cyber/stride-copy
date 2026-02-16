import React from 'react';
import { motion } from 'framer-motion';

export default function GuestLoginPrompt({ reason, onClose }) {
  const content = {
    "10K": {
      title: "10K unlocked 🎉",
      message: "You just completed 10 kilometers.\nLog in to save your stats, streaks, and rewards securely."
    },
    "LEVEL2": {
      title: "Level 2 reached ⚡",
      message: "Your progress is building.\nLog in to sync your profile, achievements, and rewards."
    }
  };

  const { title, message } = content[reason] || content["10K"];

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleEmailLogin = () => {
    window.location.href = '/login';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.55)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(16px + env(safe-area-inset-left))',
        paddingRight: 'calc(16px + env(safe-area-inset-right))',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.95), rgba(10, 10, 10, 0.98))',
          border: '2px solid',
          borderImage: 'linear-gradient(135deg, rgba(138, 43, 226, 0.5), rgba(191, 255, 0, 0.3)) 1',
          boxShadow: '0 0 50px rgba(138, 43, 226, 0.4), 0 0 30px rgba(191, 255, 0, 0.2), 0 20px 60px rgba(0, 0, 0, 0.6)',
          position: 'relative'
        }}
      >
        {/* Decorative glow */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(138, 43, 226, 0.15), transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Scrollable content */}
        <div 
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '24px',
            maxHeight: 'calc(100dvh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Title */}
          <h3 
            style={{
              fontSize: '24px',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '12px',
              color: '#FFFFFF',
              textShadow: '0 0 20px rgba(191, 255, 0, 0.3)'
            }}
          >
            {title}
          </h3>

          {/* Message */}
          <p 
            style={{
              textAlign: 'center',
              marginBottom: '24px',
              whiteSpace: 'pre-line',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.75)'
            }}
          >
            {message}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Primary - Google */}
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
                color: '#0A0A0A',
                boxShadow: '0 0 25px rgba(191, 255, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              Continue with Google
            </button>

            {/* Secondary - Email */}
            <button
              onClick={handleEmailLogin}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                boxShadow: '0 0 0 1px rgba(138, 43, 226, 0.3) inset',
                transition: 'all 0.2s'
              }}
            >
              Login with Email
            </button>

            {/* Tertiary - Not now */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: '40px',
                fontWeight: 500,
                fontSize: '14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.2s'
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
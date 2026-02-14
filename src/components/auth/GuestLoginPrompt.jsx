import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

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
    // Redirect to Google OAuth login
    window.location.href = '/api/auth/google';
  };

  const handleEmailLogin = () => {
    // Redirect to email login page
    window.location.href = '/login';
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/45 z-[99998]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-[90%] max-w-[380px]"
      >
        <div 
          className="rounded-3xl backdrop-blur-xl border p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 20, 0.95), rgba(10, 10, 10, 0.98))',
            borderImage: 'linear-gradient(135deg, rgba(138, 43, 226, 0.5), rgba(191, 255, 0, 0.3)) 1',
            boxShadow: '0 0 50px rgba(138, 43, 226, 0.4), 0 0 30px rgba(191, 255, 0, 0.2), 0 20px 60px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Decorative glow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(138, 43, 226, 0.15), transparent 70%)'
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Title */}
            <h3 
              className="text-2xl font-bold text-center mb-3"
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 20px rgba(191, 255, 0, 0.3)'
              }}
            >
              {title}
            </h3>

            {/* Message */}
            <p 
              className="text-center mb-6 whitespace-pre-line leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.75)' }}
            >
              {message}
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              {/* Primary - Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-full h-12 rounded-full font-bold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
                  color: '#0A0A0A',
                  boxShadow: '0 0 25px rgba(191, 255, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                Continue with Google
              </button>

              {/* Secondary - Email */}
              <button
                onClick={handleEmailLogin}
                className="w-full h-12 rounded-full font-bold text-sm border transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  boxShadow: '0 0 0 1px rgba(138, 43, 226, 0.3) inset'
                }}
              >
                Login with Email
              </button>

              {/* Tertiary - Not now */}
              <button
                onClick={onClose}
                className="w-full h-10 font-medium text-sm transition-all"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
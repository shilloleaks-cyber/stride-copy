import React from 'react';
import { base44 } from '@/api/base44Client';

export default function LoginGateModal({ open, onClose }) {
  if (!open) return null;

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(180deg, #12121A 0%, #0A0A0A 100%)',
          borderTopLeftRadius: 32, borderTopRightRadius: 32,
          borderTop: '1.5px solid rgba(191,255,0,0.3)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(191,255,0,0.06)',
          padding: '0 28px calc(44px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)', margin: '16px 0 28px' }} />

        {/* BoomX Logo mark */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #BFFF00 0%, #8A2BE2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 22,
          boxShadow: '0 0 32px rgba(191,255,0,0.25), 0 0 60px rgba(138,43,226,0.15)',
        }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>⚡</span>
        </div>

        {/* Title */}
        <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Join BoomX
        </p>

        {/* Body */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 280 }}>
          Sign in to track runs, earn coins, join events, and connect with the community.
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '16px 0',
            borderRadius: 18, border: 'none',
            background: '#BFFF00', color: '#0A0A0A',
            fontSize: 16, fontWeight: 900,
            cursor: 'pointer', marginBottom: 12,
            boxShadow: '0 0 28px rgba(191,255,0,0.35)',
            letterSpacing: '-0.2px',
          }}
        >
          Continue with Login
        </button>

        {/* Secondary */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
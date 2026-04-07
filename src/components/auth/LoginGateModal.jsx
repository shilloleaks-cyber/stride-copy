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
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(180deg, #111116 0%, #0A0A0A 100%)',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderTop: '1.5px solid rgba(191,255,0,0.25)',
          padding: '28px 28px calc(40px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 0,
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)', marginBottom: 24 }} />

        {/* Icon */}
        <div style={{
          width: 60, height: 60, borderRadius: 20,
          background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 20,
          boxShadow: '0 0 24px rgba(191,255,0,0.15)',
        }}>
          🔐
        </div>

        {/* Title */}
        <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
          Login Required
        </p>

        {/* Body */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 300 }}>
          Sign in to unlock this feature and save your progress.
        </p>

        {/* CTA */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '15px 0',
            borderRadius: 16, border: 'none',
            background: '#BFFF00', color: '#0A0A0A',
            fontSize: 15, fontWeight: 900,
            cursor: 'pointer', marginBottom: 12,
            boxShadow: '0 0 24px rgba(191,255,0,0.3)',
          }}
        >
          Continue with Login
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '13px 0',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.45)',
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
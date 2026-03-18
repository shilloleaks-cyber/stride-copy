import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Trash2, X, User, Mail, Shield, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Provider configs — all route through base44.auth.redirectToLogin (platform handles provider selection)
const PROVIDERS = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    bg: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.9)',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    bg: 'rgba(24,119,242,0.1)',
    border: 'rgba(24,119,242,0.3)',
    color: 'rgba(255,255,255,0.9)',
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    bg: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.9)',
  },
];

// Detect which provider the user signed in with from their email domain / auth_provider field
function detectProvider(user) {
  if (!user) return null;
  const p = user.auth_provider || user.provider || '';
  if (p.toLowerCase().includes('google')) return 'Google';
  if (p.toLowerCase().includes('facebook')) return 'Facebook';
  if (p.toLowerCase().includes('apple')) return 'Apple';
  // Fallback: guess from email
  if (user.email?.endsWith('@gmail.com')) return 'Google';
  return null;
}

function ProviderRow({ provider, loading, onClick }) {
  const isLoading = loading === provider.id;
  return (
    <button
      onClick={() => onClick(provider.id)}
      disabled={!!loading}
      style={{
        width: '100%',
        minHeight: 52,
        padding: '14px 16px',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: provider.bg,
        border: `1px solid ${provider.border}`,
        color: provider.color,
        fontSize: 15,
        fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        opacity: loading && !isLoading ? 0.45 : 1,
        transition: 'opacity 0.2s',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isLoading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : provider.icon}
      </span>
      <span style={{ flex: 1 }}>{isLoading ? 'Redirecting…' : provider.label}</span>
      {!isLoading && <ChevronRight style={{ width: 16, height: 16, opacity: 0.4 }} />}
    </button>
  );
}

export default function SettingsSheet({ user, onClose, onLogout, onDeleteRequest }) {
  const isAuthenticated = !!user;
  const [loadingProvider, setLoadingProvider] = useState(null);
  const didRedirect = useRef(false);

  // When page regains focus after auth redirect, reload to pick up new session
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && didRedirect.current) {
        didRedirect.current = false;
        // Reload so AuthContext re-checks auth state and Profile updates
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleSignIn = (providerId) => {
    setLoadingProvider(providerId);
    didRedirect.current = true;
    // Platform login page handles all providers — no per-provider URL needed
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleCreateAccount = () => {
    setLoadingProvider('create');
    didRedirect.current = true;
    base44.auth.redirectToLogin(window.location.href);
  };

  const detectedProvider = detectProvider(user);

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: 600,
            maxHeight: '85dvh',
            background: 'linear-gradient(180deg, #0f0f14 0%, #0a0a0a 100%)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTop: '1.5px solid rgba(138,43,226,0.45)',
            borderLeft: '1.5px solid rgba(138,43,226,0.2)',
            borderRight: '1.5px solid rgba(191,255,0,0.2)',
            boxShadow: '0 -8px 60px rgba(138,43,226,0.35), 0 -4px 30px rgba(191,255,0,0.15)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(90px + env(safe-area-inset-bottom))',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Account</h3>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {isAuthenticated ? (
              <>
                {/* Current account info card */}
                <div style={{
                  padding: '16px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 6,
                }}>
                  {/* Avatar initial */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(138,43,226,0.5), rgba(191,255,0,0.3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: '#fff',
                  }}>
                    {user?.full_name ? user.full_name[0].toUpperCase() : <User style={{ width: 22, height: 22 }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>
                      {user?.full_name || 'Runner'}
                    </p>
                    <p style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 5px',
                      display: 'flex', alignItems: 'center', gap: 5,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      <Mail style={{ width: 11, height: 11, flexShrink: 0 }} />
                      {user?.email || '—'}
                    </p>
                    {/* Signed-in provider badge */}
                    {detectedProvider && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CheckCircle2 style={{ width: 11, height: 11, color: '#BFFF00' }} />
                        <span style={{ fontSize: 11, color: 'rgba(191,255,0,0.8)', fontWeight: 600 }}>
                          via {detectedProvider}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '4px 10px', borderRadius: 99,
                    background: 'rgba(191,255,0,0.1)',
                    border: '1px solid rgba(191,255,0,0.2)',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#BFFF00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Active
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                {/* Log Out */}
                <button
                  onClick={onLogout}
                  style={{
                    width: '100%', minHeight: 52, padding: '14px 16px', borderRadius: 16,
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Log Out</span>
                </button>

                {/* Delete Account */}
                <button
                  onClick={onDeleteRequest}
                  style={{
                    width: '100%', minHeight: 52, padding: '14px 16px', borderRadius: 16,
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(255,60,60,0.07)',
                    border: '1px solid rgba(255,60,60,0.2)',
                    color: 'rgba(255,100,100,0.95)', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Trash2 style={{ width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Delete Account</span>
                </button>
              </>
            ) : (
              <>
                {/* Not signed in */}
                <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px',
                    background: 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(191,255,0,0.2))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield style={{ width: 26, height: 26, color: '#BFFF00' }} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Sign in to Stride</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    Connect your account to save your progress
                  </p>
                </div>

                {PROVIDERS.map((p) => (
                  <ProviderRow
                    key={p.id}
                    provider={p}
                    loading={loadingProvider}
                    onClick={handleSignIn}
                  />
                ))}

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Create New Account */}
                <button
                  onClick={handleCreateAccount}
                  disabled={!!loadingProvider}
                  style={{
                    width: '100%', minHeight: 52, padding: '14px 16px', borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'linear-gradient(135deg, rgba(191,255,0,0.15), rgba(138,43,226,0.15))',
                    border: '1px solid rgba(191,255,0,0.3)',
                    color: loadingProvider === 'create' ? 'rgba(191,255,0,0.5)' : '#BFFF00',
                    fontSize: 15, fontWeight: 700,
                    cursor: loadingProvider ? 'default' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: loadingProvider && loadingProvider !== 'create' ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {loadingProvider === 'create'
                    ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Redirecting…</>
                    : 'Create New Account'
                  }
                </button>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
                  By continuing you agree to our Terms of Service and Privacy Policy.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
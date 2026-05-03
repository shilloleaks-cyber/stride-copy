import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  approve: {
    icon: '✅',
    title: (n) => `Confirm ${n} registration${n !== 1 ? 's' : ''}?`,
    body:  (n) => `This will set ${n} registration${n !== 1 ? 's' : ''} to Confirmed. This cannot be undone.`,
    confirmLabel: 'Yes, Confirm',
    confirmStyle: { background: 'rgba(182,255,0,0.12)', border: '1px solid rgba(182,255,0,0.35)', color: '#B6FF00' },
  },
  reject: {
    icon: '❌',
    title: (n) => `Reject ${n} registration${n !== 1 ? 's' : ''}?`,
    body:  (n) => `This will set ${n} registration${n !== 1 ? 's' : ''} to Rejected. This cannot be undone.`,
    confirmLabel: 'Yes, Reject',
    confirmStyle: { background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.35)', color: 'rgba(255,90,90,0.9)' },
  },
  checkin: {
    icon: '👟',
    title: (n) => `Check In ${n} participant${n !== 1 ? 's' : ''}?`,
    body:  (n) => `This will mark ${n} participant${n !== 1 ? 's' : ''} as Checked In with the current timestamp.`,
    confirmLabel: 'Yes, Check In',
    confirmStyle: { background: 'rgba(182,255,0,0.12)', border: '1px solid rgba(182,255,0,0.35)', color: '#B6FF00' },
  },
  needs_attention: {
    icon: '⚠️',
    title: (n) => `Mark ${n} payment${n !== 1 ? 's' : ''} as Needs Attention?`,
    body:  (n) => `This will flag ${n} payment${n !== 1 ? 's' : ''} as Needs Attention. Participants should resubmit their slip.`,
    confirmLabel: 'Yes, Flag',
    confirmStyle: { background: 'rgba(255,120,0,0.12)', border: '1px solid rgba(255,120,0,0.35)', color: 'rgba(255,150,50,1)' },
  },
};

export default function BulkConfirmDialog({ open, variant = 'approve', count, onConfirm, onCancel, isLoading, customLabel, customMessage }) {
  if (!open) return null;
  const cfg = VARIANTS[variant] || VARIANTS.approve;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />

      {/* Dialog */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 360,
        background: 'rgba(14,14,18,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(138,43,226,0.1)',
      }}>
        <p style={{ fontSize: 32, margin: '0 0 12px', textAlign: 'center' }}>{cfg.icon}</p>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>
          {cfg.title(count)}
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
          {customMessage || cfg.body(count)}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={isLoading}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)',
            }}
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isLoading}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              ...cfg.confirmStyle,
            }}
          >
            {isLoading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : null}
            {isLoading ? 'Processing…' : (customLabel || cfg.confirmLabel)}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
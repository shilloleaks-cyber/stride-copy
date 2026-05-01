import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ConfirmDialog — reusable dark-neon confirmation modal
 * Props:
 *   open, title, description, confirmLabel, cancelLabel,
 *   confirmVariant ("destructive" | "primary"), loading, onConfirm, onCancel
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmStyle =
    confirmVariant === 'primary'
      ? { backgroundColor: '#BFFF00', color: '#0A0A0A', border: 'none' }
      : {
          backgroundColor: 'rgba(239,68,68,0.15)',
          color: '#f87171',
          border: '1px solid rgba(239,68,68,0.3)',
        };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 999999 }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{
          backgroundColor: '#111111',
          border: '1px solid rgba(138,43,226,0.35)',
          boxShadow: '0 0 40px rgba(138,43,226,0.15), 0 20px 40px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <p className="text-white text-base font-semibold text-center leading-snug">{title}</p>

        {/* Description */}
        {description && (
          <p className="text-gray-400 text-sm text-center leading-relaxed -mt-2">{description}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              ...confirmStyle,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
              WebkitAppearance: 'none',
              appearance: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', boxShadow: 'none', padding: 0, margin: 0, border: 0 }}>
                <svg
                  style={{ width: 16, height: 16, flexShrink: 0, background: 'transparent', boxShadow: 'none', animation: 'spin 1s linear infinite' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 0 4.582 9H4" />
                </svg>
                <span style={{ background: 'transparent', boxShadow: 'none', padding: 0, margin: 0 }}>Deleting...</span>
              </span>
            ) : (
              <span style={{ background: 'transparent', padding: 0, margin: 0 }}>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
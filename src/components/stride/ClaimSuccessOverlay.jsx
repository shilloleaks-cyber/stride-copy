import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ClaimSuccessOverlay({ claim, onDismiss }) {
  useEffect(() => {
    // Vibrate on success if supported
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.97)' }}
    >
      {/* Glow ring */}
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'rgba(191,255,0,0.1)',
          boxShadow: '0 0 60px rgba(191,255,0,0.3), 0 0 120px rgba(191,255,0,0.15)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <CheckCircle2 className="w-14 h-14" style={{ color: '#BFFF00' }} />
      </div>

      <p className="text-4xl font-black tracking-widest text-white mb-2" style={{ letterSpacing: '0.15em' }}>
        CLAIM SUCCESS
      </p>

      <div className="mt-6 w-full max-w-xs rounded-2xl p-5 space-y-3 text-center"
        style={{ background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.2)' }}>
        <p className="text-xl font-black text-white">{claim.first_name} {claim.last_name}</p>
        {claim.bib_number && (
          <p className="text-sm font-bold" style={{ color: '#BFFF00' }}>Bib #{claim.bib_number}</p>
        )}
        <p className="text-sm text-white">{claim.reward_label}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {claim.claimed_at ? format(new Date(claim.claimed_at), 'h:mm:ss a · MMM d') : ''}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
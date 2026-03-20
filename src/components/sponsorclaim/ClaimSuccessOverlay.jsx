import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ClaimSuccessOverlay({ reg, reward, claimedAt, onDismiss }) {
  useEffect(() => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    const t = setTimeout(onDismiss, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center px-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.97)' }}
    >
      {/* Glow ring */}
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
        style={{
          background: 'rgba(0,210,110,0.12)',
          boxShadow: '0 0 60px rgba(0,210,110,0.35), 0 0 120px rgba(0,210,110,0.15)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }}
      >
        <CheckCircle2 className="w-16 h-16" style={{ color: 'rgb(0,210,110)' }} />
      </div>

      <p className="text-4xl font-black tracking-wider mb-2" style={{ color: 'rgb(0,210,110)', letterSpacing: '0.08em' }}>
        CLAIM SUCCESS
      </p>

      <div className="mt-6 rounded-2xl px-6 py-5 w-full max-w-xs space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xl font-black text-white">{reg.first_name} {reg.last_name}</p>
        {reg.bib_number && (
          <p className="text-base font-bold" style={{ color: '#BFFF00' }}>Bib #{reg.bib_number}</p>
        )}
        {reward && (
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{reward.reward_name}</p>
        )}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {claimedAt ? format(new Date(claimedAt), 'h:mm a · MMM d, yyyy') : ''}
        </p>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Resetting for next scan…</p>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0,210,110,0.35), 0 0 120px rgba(0,210,110,0.15); }
          50%       { box-shadow: 0 0 80px rgba(0,210,110,0.5),  0 0 160px rgba(0,210,110,0.25); }
        }
      `}</style>
    </div>
  );
}
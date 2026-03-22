import React, { useState, useRef } from 'react';
import { Share2, Check, X, Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EventShareButton({ event, user }) {
  const [state, setState] = useState('idle'); // 'idle' | 'copied' | 'modal'
  const didCopy = useRef(false); // dedup: only one log per "share session"

  const shareUrl = `${window.location.origin}/StrideEventDetail?id=${event.id}`;
  const shareText = `Check out ${event.title}! Join me for this event 🏃`;

  const logShare = (channel) => {
    if (!user?.email || didCopy.current) return;
    didCopy.current = true;
    base44.entities.EventShareLog.create({
      event_id: event.id,
      shared_by: user.email,
      shared_at: new Date().toISOString(),
      channel,
    });
    // Reset dedup after 3s so a second deliberate share can still log
    setTimeout(() => { didCopy.current = false; }, 3000);
  };

  const tryCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (_) {
      try {
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
        document.body.appendChild(el);
        el.focus();
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
      } catch (_) {
        return false;
      }
    }
  };

  const handleShare = async () => {
    if (state === 'copied') return;

    // 1. Try native share (mobile only — touch device)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share) {
      try {
        await navigator.share({ title: event.title, text: shareText, url: shareUrl });
        logShare('native');
        return;
      } catch (_) {
        // Dismissed or failed — fall through to clipboard
      }
    }

    // 2. Try clipboard copy
    const copied = await tryCopy();
    if (copied) {
      logShare('copy_link');
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
      return;
    }

    // 3. All else failed — show modal with URL
    setState('modal');
  };

  const handleModalCopy = async () => {
    await tryCopy(); // best-effort inside modal too
    logShare('copy_link');
    setState('copied');
    setTimeout(() => setState('idle'), 2500);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '10px 16px',
          color: state === 'copied' ? '#BFFF00' : 'rgba(255,255,255,0.8)',
          fontSize: 13,
          fontWeight: 700,
          minHeight: 44,
        }}
      >
        {state === 'copied'
          ? <><Check style={{ width: 15, height: 15 }} /> Copied!</>
          : <><Share2 style={{ width: 15, height: 15 }} /> Share</>
        }
      </button>

      {/* Fallback modal — shown when clipboard is also blocked */}
      {state === 'modal' && (
        <div
          className="fixed inset-0 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999999 }}
          onClick={() => setState('idle')}
        >
          <div
            className="w-full max-w-md"
            style={{
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px calc(20px + env(safe-area-inset-bottom))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Share Event</p>
              <button onClick={() => setState('idle')} style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Copy this link to share the event:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={e => e.target.select()}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 12px', color: 'rgba(255,255,255,0.8)',
                  fontSize: 12, outline: 'none', minWidth: 0,
                }}
              />
              <button
                onClick={handleModalCopy}
                style={{
                  flexShrink: 0, background: '#BFFF00', color: '#0A0A0A',
                  border: 'none', borderRadius: 10, padding: '10px 16px',
                  fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Copy style={{ width: 14, height: 14 }} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
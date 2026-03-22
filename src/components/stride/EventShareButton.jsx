import React, { useState, useRef } from 'react';
import { Share2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EventShareButton({ event, user }) {
  const [state, setState] = useState('idle'); // 'idle' | 'copied'
  const isHandling = useRef(false); // prevent re-entrant calls

  const shareUrl = `${window.location.origin}/StrideEventDetail?id=${event.id}`;
  const shareText = `Check out ${event.title}! Join me for this event 🏃`;

  const logShare = (channel) => {
    if (!user?.email) return;
    base44.entities.EventShareLog.create({
      event_id: event.id,
      shared_by: user.email,
      shared_at: new Date().toISOString(),
      channel,
    });
  };

  const handleShare = async () => {
    // Prevent re-entrant calls (rapid taps, double-clicks)
    if (isHandling.current) return;
    isHandling.current = true;

    try {
      if (navigator.share) {
        // Native share (iOS Safari, Android Chrome) — must be called synchronously
        // within the user gesture, so no awaits before this point
        await navigator.share({ title: event.title, text: shareText, url: shareUrl });
        logShare('native');
      } else {
        // Clipboard path
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch (_) {
          // Fallback for non-HTTPS or permission denied
          const el = document.createElement('input');
          el.value = shareUrl;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          document.body.appendChild(el);
          el.focus();
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        logShare('copy_link');
        setState('copied');
        setTimeout(() => setState('idle'), 2000);
      }
    } catch (_) {
      // AbortError (user dismissed native share) or any other error — no-op
    } finally {
      isHandling.current = false;
    }
  };

  const copied = state === 'copied';

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 transition-all active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: '10px 16px',
        color: copied ? '#BFFF00' : 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: 700,
        minHeight: 44,
      }}
    >
      {copied
        ? <><Check style={{ width: 15, height: 15 }} /> Copied!</>
        : <><Share2 style={{ width: 15, height: 15 }} /> Share</>
      }
    </button>
  );
}
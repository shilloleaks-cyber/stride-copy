import React, { useState, useRef } from 'react';
import { Share2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EventShareButton({ event, user }) {
  const [copied, setCopied] = useState(false);
  const didLog = useRef(false); // prevent duplicate log on rapid clicks

  const shareUrl = `${window.location.origin}/StrideEventDetail?id=${event.id}`;
  const shareText = `Check out ${event.title}! Join me for this event 🏃`;

  const logShare = (channel) => {
    if (!user?.email || didLog.current) return;
    didLog.current = true;
    // Reset after 2s so the same user can share again intentionally
    setTimeout(() => { didLog.current = false; }, 2000);
    base44.entities.EventShareLog.create({
      event_id: event.id,
      shared_by: user.email,
      shared_at: new Date().toISOString(),
      channel,
    });
  };

  const handleShare = async () => {
    if (copied) return; // already in "copied" state, ignore rapid re-clicks

    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: shareText, url: shareUrl });
        logShare('native');
      } catch (_) {
        // user cancelled or browser blocked — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        logShare('copy_link');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {
        // Clipboard permission denied — fallback: select a temporary input
        const el = document.createElement('input');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        logShare('copy_link');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

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
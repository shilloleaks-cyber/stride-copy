import React, { useState } from 'react';
import { Share2, Link, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EventShareButton({ event, user }) {
  const [copied, setCopied] = useState(false);

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
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: shareText, url: shareUrl });
        logShare('native');
      } catch (_) {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      logShare('copy_link');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
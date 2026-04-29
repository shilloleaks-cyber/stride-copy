import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Link } from 'lucide-react';
import { trackShare } from '@/lib/eventMetrics';

export default function EventShareSheet({ event, user, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/StrideEventDetail?id=${event.id}`;
  const slug = (event.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 280;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    QRCode.toCanvas(canvas, shareUrl, {
      width: SIZE,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }, (err) => {
      if (err) return;
      const LOGO = 52;
      const cx = SIZE / 2 - LOGO / 2;
      const cy = SIZE / 2 - LOGO / 2;

      ctx.save();
      ctx.beginPath();
      const r = 10;
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + LOGO - r, cy);
      ctx.quadraticCurveTo(cx + LOGO, cy, cx + LOGO, cy + r);
      ctx.lineTo(cx + LOGO, cy + LOGO - r);
      ctx.quadraticCurveTo(cx + LOGO, cy + LOGO, cx + LOGO - r, cy + LOGO);
      ctx.lineTo(cx + r, cy + LOGO);
      ctx.quadraticCurveTo(cx, cy + LOGO, cx, cy + LOGO - r);
      ctx.lineTo(cx, cy + r);
      ctx.quadraticCurveTo(cx, cy, cx + r, cy);
      ctx.closePath();
      ctx.fillStyle = '#0A0A0A';
      ctx.fill();
      ctx.restore();

      ctx.save();
      const gB = ctx.createLinearGradient(cx + 4, cy + 8, cx + 4, cy + LOGO - 8);
      gB.addColorStop(0, '#BFFF00');
      gB.addColorStop(1, '#6DBF00');
      ctx.fillStyle = gB;
      ctx.font = `bold ${LOGO - 16}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('B', cx + 5, cy + LOGO / 2);
      ctx.restore();

      ctx.save();
      const gX = ctx.createLinearGradient(cx + LOGO / 2 + 2, cy + 8, cx + LOGO / 2 + 2, cy + LOGO - 8);
      gX.addColorStop(0, '#C060FF');
      gX.addColorStop(1, '#8A2BE2');
      ctx.fillStyle = gX;
      ctx.font = `bold ${LOGO - 16}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('X', cx + LOGO / 2 + 1, cy + LOGO / 2);
      ctx.restore();
    });
  }, [shareUrl]);

  const handleSaveQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = 24;
    const out = document.createElement('canvas');
    out.width = canvas.width + pad * 2;
    out.height = canvas.height + pad * 2;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, pad, pad);
    const link = document.createElement('a');
    link.download = `${slug}-qr.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch (_) {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      el.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    if (user?.email) trackShare(event.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(18,18,18,0.97)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.18)', margin: '14px 0 20px' }} />

        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Event QR</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '5px 0 20px' }}>Share or save this QR</p>

        <div style={{ background: '#fff', borderRadius: 20, padding: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.4)', display: 'inline-flex' }}>
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 10 }} />
        </div>

        <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '16px 0 20px', textAlign: 'center', padding: '0 24px' }}>
          {event.title}
        </p>

        <div style={{ width: '100%', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSaveQR}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 99, border: 'none',
              background: '#BFFF00', color: '#0A0A0A', fontSize: 15, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', boxShadow: '0 0 24px rgba(191,255,0,0.3)',
            }}
          >
            <Download style={{ width: 17, height: 17 }} /> Save QR
          </button>

          <button
            onClick={handleCopyLink}
            style={{
              width: '100%', padding: '15px 0', borderRadius: 99,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
              color: copied ? '#BFFF00' : '#fff', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'color 0.2s',
            }}
          >
            <Link style={{ width: 16, height: 16 }} /> {copied ? 'Link Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 600, padding: '10px 0',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
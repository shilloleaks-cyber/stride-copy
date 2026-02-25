import React, { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtPace = (p) => {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return '--:--';
  const mins = Math.floor(n);
  const secs = Math.round((n - mins) * 60);
  return `${mins}:${String(secs === 60 ? 0 : secs).padStart(2, '0')}`;
};

const fmtDur = (s) => {
  if (!s) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = Math.round(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  return `${m}:${String(sc).padStart(2, '0')}`;
};

const getPace = (run) => {
  if (run?.pace_min_per_km) return run.pace_min_per_km;
  const d = Number(run?.distance_km);
  const sc = Number(run?.duration_sec ?? run?.duration_seconds);
  if (d > 0 && sc > 0) return (sc / 60) / d;
  return null;
};

// ─── canvas image generator ──────────────────────────────────────────────────
function generateRunImage(run) {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#07070A';
    ctx.fillRect(0, 0, W, H);

    // Asphalt texture overlay (random grain)
    for (let i = 0; i < 60000; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const a = Math.random() * 0.07;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Purple glow top-left
    const glowPurple = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
    glowPurple.addColorStop(0, 'rgba(138,43,226,0.28)');
    glowPurple.addColorStop(1, 'transparent');
    ctx.fillStyle = glowPurple;
    ctx.fillRect(0, 0, W, H);

    // Lime glow bottom-right
    const glowLime = ctx.createRadialGradient(W, H, 0, W, H, 700);
    glowLime.addColorStop(0, 'rgba(191,255,0,0.18)');
    glowLime.addColorStop(1, 'transparent');
    ctx.fillStyle = glowLime;
    ctx.fillRect(0, 0, W, H);

    // Horizontal scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(0, y, W, 2);
    }

    // Top label
    ctx.font = '700 48px Helvetica Neue, Arial, sans-serif';
    ctx.letterSpacing = '18px';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('COMPLETED RUN', W / 2, 180);

    // BoomX branding
    ctx.font = '900 120px Helvetica Neue, Arial, sans-serif';
    ctx.letterSpacing = '-4px';
    ctx.fillStyle = '#BFFF00';
    ctx.shadowColor = 'rgba(191,255,0,0.55)';
    ctx.shadowBlur = 60;
    ctx.fillText('BoomX', W / 2, 320);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = 'rgba(191,255,0,0.20)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 380); ctx.lineTo(W - 80, 380); ctx.stroke();

    // Route polyline or placeholder
    const points = (() => {
      try {
        let pts = run?.route_points;
        if (typeof pts === 'string') pts = JSON.parse(pts);
        if (!Array.isArray(pts)) return [];
        return pts.map(p => {
          if (Array.isArray(p)) return { lat: Number(p[0]), lng: Number(p[1]) };
          return { lat: Number(p.lat), lng: Number(p.lng) };
        }).filter(p => isFinite(p.lat) && isFinite(p.lng));
      } catch (_) { return []; }
    })();

    const MAP_Y = 420, MAP_H = 700;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(80, MAP_Y, W - 160, MAP_H, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (points.length >= 2) {
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const pad = 60;
      const scaleX = (W - 160 - pad * 2) / (maxLng - minLng || 1);
      const scaleY = (MAP_H - pad * 2) / (maxLat - minLat || 1);
      const scale = Math.min(scaleX, scaleY);

      const toX = (lng) => 80 + pad + (lng - minLng) * scale + ((W - 160 - pad * 2) - (maxLng - minLng) * scale) / 2;
      const toY = (lat) => MAP_Y + pad + (maxLat - lat) * scale + ((MAP_H - pad * 2) - (maxLat - minLat) * scale) / 2;

      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      }
      ctx.strokeStyle = '#BFFF00';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(191,255,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Start dot
      ctx.beginPath();
      ctx.arc(toX(points[0].lng), toY(points[0].lat), 16, 0, Math.PI * 2);
      ctx.fillStyle = '#BFFF00';
      ctx.fill();
      // End dot
      const last = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(toX(last.lng), toY(last.lat), 16, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B6B';
      ctx.fill();
    } else {
      ctx.font = '600 44px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.textAlign = 'center';
      ctx.fillText('No route recorded', W / 2, MAP_Y + MAP_H / 2);
    }

    // Stats section
    const pace = getPace(run);
    const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;
    const stats = [
      { label: 'DISTANCE', value: `${Number(run?.distance_km || 0).toFixed(2)} km` },
      { label: 'PACE',     value: `${fmtPace(pace)} /km` },
      { label: 'TIME',     value: fmtDur(durSec) },
    ];

    const statsY = MAP_Y + MAP_H + 60;
    const colW = (W - 160) / 3;

    stats.forEach((st, i) => {
      const cx = 80 + colW * i + colW / 2;

      ctx.font = '900 80px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(191,255,0,0.25)';
      ctx.shadowBlur = 20;
      ctx.fillText(st.value, cx, statsY);
      ctx.shadowBlur = 0;

      ctx.font = '700 34px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.letterSpacing = '6px';
      ctx.fillText(st.label, cx, statsY + 52);
    });

    // Separator line
    ctx.strokeStyle = 'rgba(191,255,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, statsY + 100);
    ctx.lineTo(W - 80, statsY + 100);
    ctx.stroke();

    // Bottom tagline
    ctx.font = '700 36px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.letterSpacing = '14px';
    ctx.textAlign = 'center';
    ctx.fillText('RUN · EARN · EVOLVE', W / 2, statsY + 180);

    resolve(canvas.toDataURL('image/png'));
  });
}

// ─── component ───────────────────────────────────────────────────────────────
export default function ShareRunModal({ run, user, onClose }) {
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(''); // '' | 'saving' | 'sharing' | 'posting' | 'success' | 'error'
  const [msg, setMsg] = useState('');
  const busy = ['saving', 'sharing', 'posting'].includes(status);

  useEffect(() => {
    if (!run) return;
    setGenerating(true);
    generateRunImage(run).then(url => {
      setImgDataUrl(url);
      setGenerating(false);
    });
  }, [run]);

  const ensureImage = async () => {
    if (imgDataUrl) return imgDataUrl;
    const url = await generateRunImage(run);
    setImgDataUrl(url);
    return url;
  };

  const handleSave = async () => {
    if (busy) return;
    setStatus('saving');
    const url = await ensureImage();
    const a = document.createElement('a');
    a.href = url;
    a.download = `boomx-run-${run.id || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('success');
    setMsg('Image saved!');
  };

  const handleShare = async () => {
    if (busy) return;
    setStatus('sharing');
    const url = await ensureImage();
    if (navigator.share && navigator.canShare) {
      // Convert dataURL to blob for Web Share API
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], 'boomx-run.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'BoomX Run', text: `I ran ${Number(run.distance_km || 0).toFixed(2)} km on BoomX!` });
        setStatus('success');
        setMsg('Shared!');
        return;
      }
    }
    // Fallback: same as save
    const a = document.createElement('a');
    a.href = url;
    a.download = `boomx-run-${run.id || Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('success');
    setMsg('Image downloaded (share not supported on this device).');
  };

  const handlePost = async () => {
    if (busy) return;
    setStatus('posting');
    let imageUrl = null;
    try {
      const dataUrl = await ensureImage();
      // Upload via UploadFile — if payload too large, skip image
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'run-share.png', { type: 'image/png' });
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        imageUrl = uploaded?.file_url ?? null;
      } catch (_) {
        imageUrl = null;
      }

      const pace = getPace(run);
      const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;

      await base44.entities.Post.create({
        content: `Completed a ${Number(run.distance_km || 0).toFixed(2)} km run! 🏃‍♂️⚡`,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        run_id: run.id,
        run_data: {
          distance_km: run.distance_km,
          duration_seconds: durSec,
          pace_min_per_km: pace,
          calories_burned: run.calories_burned || run.calories_est || 0,
          avg_heart_rate: run.avg_heart_rate || 0,
        },
        author_name: user?.full_name || 'Runner',
        author_email: user?.email || '',
        author_image: user?.profile_image || '',
        likes: [],
        comments_count: 0,
      });

      setStatus('success');
      setMsg('Posted to Feed! 🎉');
    } catch (e) {
      setStatus('error');
      setMsg(e.message || 'Failed to post.');
    }
  };

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle bar */}
        <div style={M.handle} />

        {/* Title */}
        <div style={M.titleRow}>
          <span style={M.title}>Share Run</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Preview */}
        <div style={M.previewWrap}>
          {generating ? (
            <div style={M.previewPlaceholder}>
              <div style={M.previewSpinner} />
              <span style={M.previewHint}>Generating image…</span>
            </div>
          ) : imgDataUrl ? (
            <img src={imgDataUrl} alt="Run card" style={M.previewImg} />
          ) : (
            <div style={M.previewPlaceholder}>
              <span style={M.previewHint}>Preview unavailable</span>
            </div>
          )}
        </div>

        {/* Status feedback */}
        {msg && (
          <div style={{ ...M.feedback, ...(status === 'error' ? M.feedbackError : M.feedbackSuccess) }}>
            {msg}
          </div>
        )}

        {/* Buttons */}
        <div style={M.btnCol}>
          <button style={{ ...M.btn, ...M.btnSecondary, opacity: busy ? 0.55 : 1 }} onClick={handleSave} disabled={busy}>
            {status === 'saving' ? 'Saving…' : '⬇ Save Image'}
          </button>
          <button style={{ ...M.btn, ...M.btnSecondary, opacity: busy ? 0.55 : 1 }} onClick={handleShare} disabled={busy}>
            {status === 'sharing' ? 'Sharing…' : '↑ Share Image'}
          </button>
          <button style={{ ...M.btn, ...M.btnPrimary, opacity: busy ? 0.55 : 1 }} onClick={handlePost} disabled={busy}>
            {status === 'posting' ? 'Posting…' : '📣 Post to Feed'}
          </button>
        </div>
      </div>
    </div>
  );
}

const M = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.70)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480,
    background: 'rgba(12,12,18,0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px 28px 0 0',
    border: '1px solid rgba(191,255,0,0.15)',
    borderBottom: 'none',
    boxShadow: '0 -8px 60px rgba(138,43,226,0.25)',
    padding: '12px 20px 40px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 4,
  },
  titleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontSize: 18, fontWeight: 800, color: '#FFFFFF',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10, width: 32, height: 32,
    color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 600,
  },
  previewWrap: {
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#0A0A0A',
    height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewImg: {
    width: '100%', height: '100%', objectFit: 'cover',
  },
  previewPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  previewSpinner: {
    width: 24, height: 24, borderRadius: '50%',
    border: '2px solid rgba(191,255,0,0.25)',
    borderTopColor: '#BFFF00',
    animation: 'spin 0.8s linear infinite',
  },
  previewHint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  feedback: {
    textAlign: 'center', padding: '10px 16px',
    borderRadius: 12, fontSize: 13, fontWeight: 600,
  },
  feedbackSuccess: {
    background: 'rgba(80,220,120,0.12)',
    border: '1px solid rgba(80,220,120,0.25)',
    color: 'rgba(80,220,120,0.90)',
  },
  feedbackError: {
    background: 'rgba(255,90,90,0.10)',
    border: '1px solid rgba(255,90,90,0.25)',
    color: 'rgba(255,90,90,0.85)',
  },
  btnCol: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  btn: {
    width: '100%', padding: '14px 0',
    borderRadius: 999, fontSize: 14, fontWeight: 800,
    letterSpacing: '0.06em', border: 'none', cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A',
    boxShadow: '0 0 24px rgba(191,255,0,0.30)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#FFFFFF',
  },
};

// inject keyframe
if (typeof document !== 'undefined') {
  const id = '__boomx_spin';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }
}
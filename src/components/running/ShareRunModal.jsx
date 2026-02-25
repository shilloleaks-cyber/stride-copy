import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ─── helpers ─────────────────────────────────────────────────────────────────
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
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(sc).padStart(2, '0')}`;
};

const getPace = (run) => {
  if (run?.pace_min_per_km) return run.pace_min_per_km;
  const d = Number(run?.distance_km);
  const sc = Number(run?.duration_sec ?? run?.duration_seconds);
  if (d > 0 && sc > 0) return (sc / 60) / d;
  return null;
};

const parseRoutePoints = (pts) => {
  try {
    if (typeof pts === 'string') pts = JSON.parse(pts);
    if (!Array.isArray(pts)) return [];
    return pts.map(p => Array.isArray(p)
      ? { lat: Number(p[0]), lng: Number(p[1]) }
      : { lat: Number(p.lat), lng: Number(p.lng) }
    ).filter(p => isFinite(p.lat) && isFinite(p.lng));
  } catch (_) { return []; }
};

// ─── canvas generator ─────────────────────────────────────────────────────────
function generateRunImage(run, style = 'clean') {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const PAD_H = 80, PAD_V = 140;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const isClean = style === 'clean';

    // ── Background ──
    if (isClean) {
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, W, H);
      // subtle grid
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else {
      ctx.fillStyle = '#07070A';
      ctx.fillRect(0, 0, W, H);
      // grain
      for (let i = 0; i < 50000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }
      // purple glow
      const gp = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
      gp.addColorStop(0, 'rgba(138,43,226,0.25)'); gp.addColorStop(1, 'transparent');
      ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);
      // lime glow
      const gl = ctx.createRadialGradient(W, H, 0, W, H, 600);
      gl.addColorStop(0, 'rgba(191,255,0,0.15)'); gl.addColorStop(1, 'transparent');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      // scanlines
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, y, W, 2); }
    }

    const textMain = isClean ? '#111111' : '#FFFFFF';
    const textMuted = isClean ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.38)';
    const accentColor = '#BFFF00';
    const dividerColor = isClean ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

    // ── Top label ──
    ctx.font = `600 38px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '12px';
    ctx.fillText('COMPLETED RUN', W / 2, PAD_V);

    // ── Brand ──
    ctx.font = `900 148px "Helvetica Neue", Arial, sans-serif`;
    ctx.letterSpacing = '-6px';
    ctx.fillStyle = isClean ? '#111111' : accentColor;
    if (!isClean) { ctx.shadowColor = 'rgba(191,255,0,0.5)'; ctx.shadowBlur = 50; }
    ctx.fillText('BoomX', W / 2, PAD_V + 180);
    ctx.shadowBlur = 0;

    // ── Divider ──
    const divY1 = PAD_V + 220;
    ctx.strokeStyle = dividerColor;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PAD_H, divY1); ctx.lineTo(W - PAD_H, divY1); ctx.stroke();

    // ── Route map area ──
    const MAP_Y = divY1 + 40;
    const MAP_H = 780;
    const MAP_X = PAD_H;
    const MAP_W = W - PAD_H * 2;

    // map background
    if (isClean) {
      ctx.fillStyle = '#EBEBEB';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
    }
    ctx.beginPath();
    ctx.roundRect(MAP_X, MAP_Y, MAP_W, MAP_H, 40);
    ctx.fill();
    ctx.strokeStyle = isClean ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const points = parseRoutePoints(run?.route_points);
    if (points.length >= 2) {
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const innerPad = 80;
      const innerW = MAP_W - innerPad * 2;
      const innerH = MAP_H - innerPad * 2;
      const scaleX = innerW / (maxLng - minLng || 0.0001);
      const scaleY = innerH / (maxLat - minLat || 0.0001);
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (innerW - (maxLng - minLng) * scale) / 2;
      const offsetY = (innerH - (maxLat - minLat) * scale) / 2;

      const toX = (lng) => MAP_X + innerPad + offsetX + (lng - minLng) * scale;
      const toY = (lat) => MAP_Y + innerPad + offsetY + (maxLat - lat) * scale;

      // route line
      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = isClean ? 7 : 10;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(191,255,0,0.55)'; ctx.shadowBlur = isClean ? 8 : 22;
      ctx.stroke(); ctx.shadowBlur = 0;

      // start dot
      const sx = toX(points[0].lng), sy = toY(points[0].lat);
      ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2);
      ctx.fillStyle = accentColor; ctx.fill();

      // end dot
      const last = points[points.length - 1];
      const ex = toX(last.lng), ey = toY(last.lat);
      ctx.beginPath(); ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6B6B'; ctx.fill();
    } else {
      // no route placeholder
      ctx.font = `500 44px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = textMuted;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '0px';
      ctx.fillText('No route recorded', W / 2, MAP_Y + MAP_H / 2);
    }

    // ── Stats section (stacked vertically, 3 blocks) ──
    const STATS_TOP = MAP_Y + MAP_H + 60;
    const pace = getPace(run);
    const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;

    const statBlocks = [
      { value: `${Number(run?.distance_km || 0).toFixed(2)} km`, label: 'DISTANCE' },
      { value: `${fmtPace(pace)} /km`,                           label: 'PACE' },
      { value: fmtDur(durSec),                                   label: 'TIME' },
    ];

    const blockH = 130;

    statBlocks.forEach((st, i) => {
      const cy = STATS_TOP + i * blockH;

      // value
      ctx.font = `800 80px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = textMain;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '-1px';
      ctx.shadowBlur = 0;
      ctx.fillText(st.value, W / 2, cy);

      // label
      ctx.font = `600 30px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = textMuted;
      ctx.letterSpacing = '6px';
      ctx.fillText(st.label, W / 2, cy + 44);

      // separator between items
      if (i < statBlocks.length - 1) {
        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PAD_H + 60, cy + 80);
        ctx.lineTo(W - PAD_H - 60, cy + 80);
        ctx.stroke();
      }
    });

    // ── Bottom tagline ──
    const tagY = H - PAD_V;
    ctx.font = `600 30px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = textMuted;
    ctx.letterSpacing = '10px';
    ctx.textAlign = 'center';
    ctx.fillText('RUN · EARN · EVOLVE', W / 2, tagY);

    resolve(canvas.toDataURL('image/png'));
  });
}

// ─── component ────────────────────────────────────────────────────────────────
export default function ShareRunModal({ run, user, onClose }) {
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [styleMode, setStyleMode] = useState('clean'); // 'clean' | 'neon'
  const [actionStatus, setActionStatus] = useState(''); // '' | 'busy' | 'success' | 'error'
  const [msg, setMsg] = useState('');

  const busy = actionStatus === 'busy';

  // regenerate when run or style changes
  useEffect(() => {
    if (!run) return;
    setImgDataUrl(null);
    setGenerating(true);
    generateRunImage(run, styleMode).then(url => {
      setImgDataUrl(url);
      setGenerating(false);
    });
  }, [run, styleMode]);

  const getBlob = async () => {
    const url = imgDataUrl || await generateRunImage(run, styleMode);
    if (!imgDataUrl) setImgDataUrl(url);
    const res = await fetch(url);
    return res.blob();
  };

  // iOS PWA: prefer Web Share API with file → Share Sheet → "Save Image"
  const handleSaveToPhotos = async () => {
    if (busy) return;
    setActionStatus('busy'); setMsg('');
    const blob = await getBlob();
    const file = new File([blob], 'boomx-run.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'BoomX Run' });
      setActionStatus('success'); setMsg('Shared via Share Sheet!');
    } else {
      // fallback download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `boomx-run-${run.id || Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setActionStatus('success'); setMsg('Image downloaded!');
    }
  };

  const handleDownload = async () => {
    if (busy) return;
    setActionStatus('busy'); setMsg('');
    const blob = await getBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boomx-run-${run.id || Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setActionStatus('success'); setMsg('Image downloaded!');
  };

  const handlePost = async () => {
    if (busy) return;
    setActionStatus('busy'); setMsg('');
    let imageUrl = null;
    try {
      const blob = await getBlob();
      const file = new File([blob], 'run-share.png', { type: 'image/png' });
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      imageUrl = uploaded?.file_url ?? null;
    } catch (_) {}

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

    setActionStatus('success'); setMsg('Posted to Feed! 🎉');
  };

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.sheet} onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div style={M.handle} />

        {/* Title row */}
        <div style={M.titleRow}>
          <span style={M.title}>Share Run</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Style toggle */}
        <div style={M.toggleRow}>
          {['clean', 'neon'].map(s => (
            <button
              key={s}
              style={{ ...M.toggleBtn, ...(styleMode === s ? M.toggleActive : M.toggleInactive) }}
              onClick={() => setStyleMode(s)}
            >
              {s === 'clean' ? '☀ Clean' : '⚡ Neon BX'}
            </button>
          ))}
        </div>

        {/* Preview — full 9:16, no crop */}
        <div style={M.previewWrap}>
          {generating ? (
            <div style={M.previewPlaceholder}>
              <div style={M.spinner} />
              <span style={M.hint}>Generating…</span>
            </div>
          ) : imgDataUrl ? (
            <img src={imgDataUrl} alt="Run card" style={M.previewImg} />
          ) : (
            <div style={M.previewPlaceholder}>
              <span style={M.hint}>Preview unavailable</span>
            </div>
          )}
        </div>

        {/* Feedback */}
        {msg && (
          <div style={{ ...M.feedback, ...(actionStatus === 'error' ? M.feedbackError : M.feedbackOk) }}>
            {msg}
          </div>
        )}

        {/* Action buttons */}
        <div style={M.btnCol}>
          <button style={{ ...M.btn, ...M.btnPrimary, opacity: busy ? 0.55 : 1 }} onClick={handleSaveToPhotos} disabled={busy}>
            {busy ? 'Working…' : '📲 Save to Photos'}
          </button>
          <button style={{ ...M.btn, ...M.btnSecondary, opacity: busy ? 0.55 : 1 }} onClick={handleDownload} disabled={busy}>
            ⬇ Download PNG
          </button>
          <button style={{ ...M.btn, ...M.btnSecondary, opacity: busy ? 0.55 : 1 }} onClick={handlePost} disabled={busy}>
            📣 Post to Feed
          </button>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const M = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480,
    maxHeight: '88vh', overflowY: 'auto',
    background: 'rgba(12,12,18,0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px 28px 0 0',
    border: '1px solid rgba(191,255,0,0.14)',
    borderBottom: 'none',
    boxShadow: '0 -8px 60px rgba(138,43,226,0.22)',
    padding: '12px 20px 0',
    display: 'flex', flexDirection: 'column', gap: 14,
    WebkitOverflowScrolling: 'touch',
  },
  handle: {
    width: 44, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', flexShrink: 0,
  },
  titleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10, width: 32, height: 32,
    color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 600,
  },
  toggleRow: {
    display: 'flex', gap: 8, flexShrink: 0,
  },
  toggleBtn: {
    flex: 1, padding: '10px 0',
    borderRadius: 999, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    letterSpacing: '0.03em',
  },
  toggleActive: {
    background: '#BFFF00', color: '#07070A',
    boxShadow: '0 0 16px rgba(191,255,0,0.30)',
  },
  toggleInactive: {
    background: 'rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  // 9:16 aspect ratio wrapper — no crop ever
  previewWrap: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    aspectRatio: '9 / 16',
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#0A0A0A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewImg: {
    width: '100%', height: '100%', objectFit: 'contain', display: 'block',
  },
  previewPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
  },
  spinner: {
    width: 28, height: 28, borderRadius: '50%',
    border: '2.5px solid rgba(191,255,0,0.20)',
    borderTopColor: '#BFFF00',
    animation: 'spin 0.8s linear infinite',
  },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  feedback: {
    textAlign: 'center', padding: '10px 16px',
    borderRadius: 12, fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  feedbackOk: {
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
    display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
  },
  btn: {
    width: '100%', padding: '14px 0',
    borderRadius: 999, fontSize: 14, fontWeight: 800,
    letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A',
    boxShadow: '0 0 24px rgba(191,255,0,0.28)',
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#FFFFFF',
  },
};

// inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('__bx_spin')) {
  const s = document.createElement('style');
  s.id = '__bx_spin';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
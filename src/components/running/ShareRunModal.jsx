import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtPace = (p) => {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return '--:--';
  const mins = Math.floor(n);
  const secs = Math.round((n - mins) * 60);
  return `${mins}:${String(secs >= 60 ? 0 : secs).padStart(2, '0')}`;
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
    return pts
      .map(p => Array.isArray(p)
        ? { lat: Number(p[0]), lng: Number(p[1]) }
        : { lat: Number(p.lat), lng: Number(p.lng) })
      .filter(p => isFinite(p.lat) && isFinite(p.lng));
  } catch (_) { return []; }
};

// ─── Canvas image generator ───────────────────────────────────────────────────
function generateRunImage(run, variant) {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const PH = 80;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: true });

    const isCard = variant === 'card';

    // ── Background ──────────────────────────────────────────────────────────
    if (isCard) {
      // BX Card: neon textured background
      ctx.fillStyle = '#07070A';
      ctx.fillRect(0, 0, W, H);
      // texture
      for (let i = 0; i < 40000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }
      // purple glow
      const gp = ctx.createRadialGradient(0, 0, 0, 0, 0, 750);
      gp.addColorStop(0, 'rgba(138,43,226,0.22)'); gp.addColorStop(1, 'transparent');
      ctx.fillStyle = gp; ctx.fillRect(0, 0, W, H);
      // lime glow
      const gl = ctx.createRadialGradient(W, H, 0, W, H, 620);
      gl.addColorStop(0, 'rgba(191,255,0,0.14)'); gl.addColorStop(1, 'transparent');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    } else {
      // Vibe: transparent background
      ctx.clearRect(0, 0, W, H);
    }

    const cText  = isCard ? '#FFFFFF' : '#111111';
    const cMuted = isCard ? 'rgba(255,255,255,0.36)' : 'rgba(0,0,0,0.50)';
    const cDiv   = isCard ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)';
    const routeColor = isCard ? '#BFFF00' : '#00C853';

    // ── Brand name ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.font = '900 140px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = isCard ? '#BFFF00' : '#111111';
    ctx.textAlign = 'center';
    if (isCard) { ctx.shadowColor = 'rgba(191,255,0,0.45)'; ctx.shadowBlur = 48; }
    ctx.fillText('BoomX', W / 2, 280);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Divider (card only) ─────────────────────────────────────────────────
    if (isCard) {
      const DIV1_Y = 340;
      ctx.save();
      ctx.strokeStyle = cDiv; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(PH, DIV1_Y); ctx.lineTo(W - PH, DIV1_Y); ctx.stroke();
      ctx.restore();
    }

    // ── Route polyline ──────────────────────────────────────────────────────
    const MAP_Y = isCard ? 380 : 360;
    const MAP_H = 760;
    const points = parseRoutePoints(run?.route_points);

    if (points.length >= 2) {
      const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const ip = 80;
      const iW = W - PH * 2 - ip * 2, iH = MAP_H - ip * 2;
      const scX = iW / (maxLng - minLng || 0.0001);
      const scY = iH / (maxLat - minLat || 0.0001);
      const sc = Math.min(scX, scY);
      const ofX = (iW - (maxLng - minLng) * sc) / 2;
      const ofY = (iH - (maxLat - minLat) * sc) / 2;
      const toX = (lng) => PH + ip + ofX + (lng - minLng) * sc;
      const toY = (lat) => MAP_Y + ip + ofY + (maxLat - lat) * sc;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = 9;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = routeColor; ctx.shadowBlur = 18;
      ctx.stroke(); ctx.restore();

      // start dot
      ctx.save();
      ctx.beginPath();
      ctx.arc(toX(points[0].lng), toY(points[0].lat), 16, 0, Math.PI * 2);
      ctx.fillStyle = routeColor; ctx.fill(); ctx.restore();

      // end dot
      const last = points[points.length - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(toX(last.lng), toY(last.lat), 16, 0, Math.PI * 2);
      ctx.fillStyle = '#FF5252'; ctx.fill(); ctx.restore();
    }

    // ── Stats — 3 vertical blocks ────────────────────────────────────────────
    const pace    = getPace(run);
    const durSec  = run?.duration_sec ?? run?.duration_seconds ?? 0;
    const distStr = `${Number(run?.distance_km || 0).toFixed(2)} km`;
    const paceStr = `${fmtPace(pace)} /km`;
    const timeStr = fmtDur(durSec);

    const statBlocks = [
      { value: distStr, label: 'DISTANCE' },
      { value: paceStr, label: 'PACE' },
      { value: timeStr, label: 'TIME' },
    ];

    const STATS_TOP  = MAP_Y + MAP_H + 72;
    const VAL_SIZE   = 84;
    const LBL_SIZE   = 28;
    const VAL_LEAD   = VAL_SIZE * 1.0;
    const LBL_GAP    = 14;
    const LBL_LEAD   = LBL_SIZE * 1.0;
    const BLOCK_H    = VAL_LEAD + LBL_GAP + LBL_LEAD;
    const BETWEEN    = 44;
    const SLOT       = BLOCK_H + BETWEEN;

    statBlocks.forEach((st, i) => {
      const baseY = STATS_TOP + i * SLOT;

      // value
      ctx.save();
      ctx.font = `800 ${VAL_SIZE}px Helvetica Neue, Arial, sans-serif`;
      ctx.fillStyle = cText;
      ctx.textAlign = 'center';
      ctx.fillText(st.value, W / 2, baseY + VAL_LEAD);
      ctx.restore();

      // label
      ctx.save();
      ctx.font = `600 ${LBL_SIZE}px Helvetica Neue, Arial, sans-serif`;
      ctx.fillStyle = cMuted;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText(st.label, W / 2, baseY + VAL_LEAD + LBL_GAP + LBL_LEAD);
      ctx.restore();

      // divider below (not after last, and only for card)
      if (isCard && i < statBlocks.length - 1) {
        const divY = baseY + BLOCK_H + BETWEEN / 2;
        ctx.save();
        ctx.strokeStyle = cDiv; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PH + 120, divY); ctx.lineTo(W - PH - 120, divY);
        ctx.stroke(); ctx.restore();
      }
    });

    resolve(canvas.toDataURL('image/png'));
  });
}

// ─── Modal component ──────────────────────────────────────────────────────────
export default function ShareRunModal({ run, user, onClose }) {
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [variant, setVariant] = useState('card');
  const [actionStatus, setActionStatus] = useState('');
  const [msg, setMsg] = useState('');

  const busy = actionStatus === 'busy';

  useEffect(() => {
    if (!run) return;
    setImgDataUrl(null);
    setMsg('');
    setActionStatus('');
    setGenerating(true);
    generateRunImage(run, variant).then(url => {
      setImgDataUrl(url);
      setGenerating(false);
    });
  }, [run, variant]);

  const getBlob = async () => {
    const url = imgDataUrl || await generateRunImage(run, variant);
    if (!imgDataUrl) setImgDataUrl(url);
    const res = await fetch(url);
    return res.blob();
  };

  const handleSave = async () => {
    if (busy) return;
    setActionStatus('busy'); setMsg('');
    const blob = await getBlob();
    const file = new File([blob], 'boomx-run.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'BoomX Run' });
      setActionStatus('success'); setMsg('Shared via Share Sheet!');
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `boomx-run-${run.id || Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setActionStatus('success'); setMsg('Saved!');
    }
  };

  const handleShareToFeed = async () => {
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>

        <div style={S.handle} />

        <div style={S.titleRow}>
          <span style={S.title}>Share Run</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Variant toggle */}
        <div style={S.toggleRow}>
          {[{ k: 'card', label: '🎴 BX Card' }, { k: 'vibe', label: '✨ Vibe' }].map(({ k, label }) => (
            <button
              key={k}
              style={{ ...S.toggleBtn, ...(variant === k ? S.tActive : S.tInactive) }}
              onClick={() => setVariant(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 9:16 preview */}
        <div style={S.previewWrap}>
          {generating ? (
            <div style={S.placeholder}>
              <div style={S.spinner} />
              <span style={S.hint}>Generating…</span>
            </div>
          ) : imgDataUrl ? (
            <img src={imgDataUrl} alt="Run card" style={S.previewImg} />
          ) : (
            <div style={S.placeholder}><span style={S.hint}>Preview unavailable</span></div>
          )}
        </div>

        {msg && (
          <div style={{ ...S.feedback, ...(actionStatus === 'error' ? S.fbErr : S.fbOk) }}>
            {msg}
          </div>
        )}

        <div style={S.btnCol}>
          <button style={{ ...S.btn, ...S.btnPrimary, opacity: busy ? 0.55 : 1 }} onClick={handleSave} disabled={busy}>
            {busy ? 'Working…' : '💾 Save'}
          </button>
          <button style={{ ...S.btn, ...S.btnSec, opacity: busy ? 0.55 : 1 }} onClick={handleShareToFeed} disabled={busy}>
            📣 Share to Feed
          </button>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto',
    background: 'rgba(12,12,18,0.97)', backdropFilter: 'blur(20px)',
    borderRadius: '28px 28px 0 0',
    border: '1px solid rgba(191,255,0,0.14)', borderBottom: 'none',
    boxShadow: '0 -8px 60px rgba(138,43,226,0.22)',
    padding: '12px 20px 0',
    display: 'flex', flexDirection: 'column', gap: 14,
    WebkitOverflowScrolling: 'touch',
  },
  handle: { width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', alignSelf: 'center', flexShrink: 0 },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title: { fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10, width: 32, height: 32, color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 600,
  },
  toggleRow: { display: 'flex', gap: 8, flexShrink: 0 },
  toggleBtn: { flex: 1, padding: '10px 0', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
  tActive: { background: '#BFFF00', color: '#07070A', boxShadow: '0 0 16px rgba(191,255,0,0.30)' },
  tInactive: { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' },
  previewWrap: {
    width: '100%', maxWidth: 260, alignSelf: 'center',
    aspectRatio: '9 / 16',
    borderRadius: 14, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  spinner: { width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(191,255,0,0.20)', borderTopColor: '#BFFF00', animation: 'spin 0.8s linear infinite' },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  feedback: { textAlign: 'center', padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, flexShrink: 0 },
  fbOk:  { background: 'rgba(80,220,120,0.12)', border: '1px solid rgba(80,220,120,0.25)', color: 'rgba(80,220,120,0.90)' },
  fbErr: { background: 'rgba(255,90,90,0.10)',  border: '1px solid rgba(255,90,90,0.25)',  color: 'rgba(255,90,90,0.85)' },
  btnCol: { display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 },
  btn: { width: '100%', padding: '14px 0', borderRadius: 999, fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' },
  btnPrimary: { background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)', color: '#07070A', boxShadow: '0 0 24px rgba(191,255,0,0.28)' },
  btnSec: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' },
};

if (typeof document !== 'undefined' && !document.getElementById('__bx_spin')) {
  const s = document.createElement('style');
  s.id = '__bx_spin';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
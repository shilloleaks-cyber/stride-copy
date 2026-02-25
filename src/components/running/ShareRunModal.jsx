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
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: true });

    const isCard = variant === 'card';

    if (!isCard) {
      // ── VIBE: transparent, minimal ────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      _drawVibeVariant(ctx, run, W, H);
      return resolve(canvas.toDataURL('image/png'));
    }

    // ── BX CARD: dark space + neon ────────────────────────────────────────────
    // Base dark
    ctx.fillStyle = '#0A0A0C';
    ctx.fillRect(0, 0, W, H);

    // Grain texture
    for (let i = 0; i < 60000; i++) {
      const alpha = Math.random() * 0.06;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // Purple nebula top-left
    const gPurple = ctx.createRadialGradient(W * 0.1, H * 0.08, 0, W * 0.1, H * 0.08, 520);
    gPurple.addColorStop(0, 'rgba(138,43,226,0.35)');
    gPurple.addColorStop(0.5, 'rgba(100,0,180,0.15)');
    gPurple.addColorStop(1, 'transparent');
    ctx.fillStyle = gPurple; ctx.fillRect(0, 0, W, H);

    // Lime glow bottom-right
    const gLime = ctx.createRadialGradient(W * 0.85, H * 0.78, 0, W * 0.85, H * 0.78, 480);
    gLime.addColorStop(0, 'rgba(191,255,0,0.20)');
    gLime.addColorStop(0.5, 'rgba(150,220,0,0.08)');
    gLime.addColorStop(1, 'transparent');
    ctx.fillStyle = gLime; ctx.fillRect(0, 0, W, H);

    // Diagonal light streak (top-left to mid)
    ctx.save();
    ctx.translate(W * 0.05, H * 0.05);
    ctx.rotate(Math.PI / 5);
    const streak1 = ctx.createLinearGradient(0, 0, 400, 0);
    streak1.addColorStop(0, 'transparent');
    streak1.addColorStop(0.4, 'rgba(180,60,255,0.18)');
    streak1.addColorStop(0.6, 'rgba(200,100,255,0.12)');
    streak1.addColorStop(1, 'transparent');
    ctx.fillStyle = streak1;
    ctx.fillRect(0, -6, 420, 12);
    ctx.restore();

    // Diagonal lime streak (bottom-right)
    ctx.save();
    ctx.translate(W * 0.62, H * 0.68);
    ctx.rotate(-Math.PI / 6);
    const streak2 = ctx.createLinearGradient(0, 0, 500, 0);
    streak2.addColorStop(0, 'transparent');
    streak2.addColorStop(0.3, 'rgba(191,255,0,0.22)');
    streak2.addColorStop(0.6, 'rgba(180,255,0,0.14)');
    streak2.addColorStop(1, 'transparent');
    ctx.fillStyle = streak2;
    ctx.fillRect(0, -5, 520, 10);
    ctx.restore();

    // ── "COMPLETED RUN" label ──────────────────────────────────────────────
    ctx.save();
    ctx.font = '600 32px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '12px';
    ctx.fillText('COMPLETED RUN', W / 2, 160);
    ctx.restore();

    // ── BoomX title ────────────────────────────────────────────────────────
    ctx.save();
    ctx.font = '900 160px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = '#BFFF00';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(191,255,0,0.7)';
    ctx.shadowBlur = 60;
    ctx.fillText('BoomX', W / 2, 320);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Map frame ─────────────────────────────────────────────────────────
    const MX = 80, MY = 380, MW = W - 160, MH = 780;
    const R = 36;

    // Map bg — subtle dark glass
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(MX, MY, MW, MH, R);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill();
    ctx.restore();

    // Neon border glow
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(MX, MY, MW, MH, R);
    ctx.strokeStyle = 'rgba(191,255,0,0.30)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(191,255,0,0.45)';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Route polyline inside map ──────────────────────────────────────────
    const points = parseRoutePoints(run?.route_points);
    if (points.length >= 2) {
      const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const ip = 100;
      const iW = MW - ip * 2, iH = MH - ip * 2;
      const scX = iW / (maxLng - minLng || 0.0001);
      const scY = iH / (maxLat - minLat || 0.0001);
      const sc = Math.min(scX, scY);
      const ofX = (iW - (maxLng - minLng) * sc) / 2;
      const ofY = (iH - (maxLat - minLat) * sc) / 2;
      const toX = (lng) => MX + ip + ofX + (lng - minLng) * sc;
      const toY = (lat) => MY + ip + ofY + (maxLat - lat) * sc;

      // Outer glow pass
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      ctx.strokeStyle = 'rgba(191,255,0,0.25)';
      ctx.lineWidth = 26;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 40;
      ctx.stroke(); ctx.restore();

      // Inner bright line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      ctx.strokeStyle = '#BFFF00';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 24;
      ctx.stroke(); ctx.restore();

      // Core white-hot line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke(); ctx.restore();

      // Start dot (lime)
      const sx = toX(points[0].lng), sy = toY(points[0].lat);
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#BFFF00'; ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 30;
      ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();

      // End dot (red/pink)
      const last = points[points.length - 1];
      const ex = toX(last.lng), ey = toY(last.lat);
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,120,0.25)'; ctx.shadowColor = 'rgba(255,80,120,0.8)'; ctx.shadowBlur = 25;
      ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,120,140,0.9)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }

    // ── Stats bar below map ────────────────────────────────────────────────
    const SY = MY + MH + 30;
    const pace   = getPace(run);
    const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;

    // Stat box background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(MX, SY, MW, 240, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();
    ctx.restore();

    const stats = [
      { label: 'DISTANCE', value: `${Number(run?.distance_km || 0).toFixed(2)}`, unit: 'km' },
      { label: 'PACE',     value: fmtPace(pace),                                  unit: '/km' },
      { label: 'TIME',     value: fmtDur(durSec),                                 unit: '' },
    ];

    const colW = MW / 3;
    stats.forEach((st, i) => {
      const cx = MX + colW * i + colW / 2;

      // Vertical divider
      if (i > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(MX + colW * i, SY + 24);
        ctx.lineTo(MX + colW * i, SY + 216);
        ctx.stroke(); ctx.restore();
      }

      // Label
      ctx.save();
      ctx.font = '600 26px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.40)';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText(st.label, cx, SY + 64);
      ctx.restore();

      // Value
      ctx.save();
      ctx.font = `800 ${i === 2 ? 62 : 72}px Helvetica Neue, Arial, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(191,255,0,0.15)';
      ctx.shadowBlur = 10;
      ctx.fillText(st.value, cx - (st.unit ? 20 : 0), SY + 158);
      ctx.shadowBlur = 0;
      ctx.restore();

      // Unit
      if (st.unit) {
        ctx.save();
        ctx.font = '500 32px Helvetica Neue, Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'left';
        const vm = ctx.measureText(st.value);
        ctx.fillText(st.unit, cx - (st.unit ? 20 : 0) + vm.width / 2 + 6, SY + 158);
        ctx.restore();
      }
    });

    // ── RUN · EARN · EVOLVE ────────────────────────────────────────────────
    ctx.save();
    ctx.font = '600 28px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('RUN · EARN · EVOLVE', W / 2, SY + 300);
    ctx.restore();

    // ── BX logo bottom ──────────────────────────────────────────────────────
    ctx.save();
    ctx.font = '900 160px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = '#BFFF00';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(191,255,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.fillText('BX', W / 2, H - 220);
    ctx.shadowBlur = 0;
    ctx.restore();

    resolve(canvas.toDataURL('image/png'));
  });
}

function _drawVibeVariant(ctx, run, W, H) {
  const PH = 80;
  ctx.clearRect(0, 0, W, H);

  const cText  = '#111111';
  const cMuted = 'rgba(0,0,0,0.50)';
  const routeColor = '#00C853';

  // BoomX title
  ctx.save();
  ctx.font = '900 140px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'center';
  ctx.fillText('BoomX', W / 2, 280);
  ctx.restore();

  const MAP_Y = 360, MAP_H = 760;
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
    ctx.shadowColor = routeColor; ctx.shadowBlur = 14;
    ctx.stroke(); ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(toX(points[0].lng), toY(points[0].lat), 16, 0, Math.PI * 2);
    ctx.fillStyle = routeColor; ctx.fill(); ctx.restore();

    const last = points[points.length - 1];
    ctx.save();
    ctx.beginPath(); ctx.arc(toX(last.lng), toY(last.lat), 16, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5252'; ctx.fill(); ctx.restore();
  }

  const pace    = getPace(run);
  const durSec  = run?.duration_sec ?? run?.duration_seconds ?? 0;
  const statBlocks = [
    { value: `${Number(run?.distance_km || 0).toFixed(2)} km`, label: 'DISTANCE' },
    { value: `${fmtPace(pace)} /km`, label: 'PACE' },
    { value: fmtDur(durSec), label: 'TIME' },
  ];

  const STATS_TOP = MAP_Y + MAP_H + 72;
  const SLOT = 170;
  statBlocks.forEach((st, i) => {
    const baseY = STATS_TOP + i * SLOT;
    ctx.save();
    ctx.font = `800 84px Helvetica Neue, Arial, sans-serif`;
    ctx.fillStyle = cText; ctx.textAlign = 'center';
    ctx.fillText(st.value, W / 2, baseY + 84);
    ctx.restore();
    ctx.save();
    ctx.font = `600 28px Helvetica Neue, Arial, sans-serif`;
    ctx.fillStyle = cMuted; ctx.textAlign = 'center';
    ctx.fillText(st.label, W / 2, baseY + 84 + 14 + 28);
    ctx.restore();
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
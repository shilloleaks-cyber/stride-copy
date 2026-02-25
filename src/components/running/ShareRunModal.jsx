import React, { useState, useEffect, useRef } from 'react';
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
        : { lat: Number(p.lat), lng: Number(p.lng) }
      )
      .filter(p => isFinite(p.lat) && isFinite(p.lng));
  } catch (_) { return []; }
};

// ─── Route mini-canvas (drawn inline inside the export node) ─────────────────
function RouteCanvas({ points, width, height, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (points.length < 2) {
      ctx.font = '500 18px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.textAlign = 'center';
      ctx.fillText('No route recorded', width / 2, height / 2);
      return;
    }

    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const pad = Math.min(width, height) * 0.1;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const scaleX = innerW / (maxLng - minLng || 0.0001);
    const scaleY = innerH / (maxLat - minLat || 0.0001);
    const scale = Math.min(scaleX, scaleY);
    const offX = (innerW - (maxLng - minLng) * scale) / 2;
    const offY = (innerH - (maxLat - minLat) * scale) / 2;

    const toX = (lng) => pad + offX + (lng - minLng) * scale;
    const toY = (lat) => pad + offY + (maxLat - lat) * scale;

    const accent = style === 'neon' ? '#BFFF00' : '#00C853';

    // route line
    ctx.beginPath();
    ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
    for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
    ctx.strokeStyle = accent;
    ctx.lineWidth = style === 'neon' ? 4 : 3;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (style === 'neon') { ctx.shadowColor = 'rgba(191,255,0,0.6)'; ctx.shadowBlur = 10; }
    ctx.stroke(); ctx.shadowBlur = 0;

    // start dot
    ctx.beginPath();
    ctx.arc(toX(points[0].lng), toY(points[0].lat), 7, 0, Math.PI * 2);
    ctx.fillStyle = accent; ctx.fill();

    // end dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(toX(last.lng), toY(last.lat), 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5252'; ctx.fill();
  }, [points, width, height, style]);

  return <canvas ref={ref} width={width} height={height} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

// ─── Export template (1080×1920 DOM node, rendered off-screen) ────────────────
const ExportTemplate = React.forwardRef(function ExportTemplate({ run, styleMode }, ref) {
  const W = 1080, H = 1920;
  const pace = getPace(run);
  const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;
  const dist = Number(run?.distance_km || 0).toFixed(2);
  const points = parseRoutePoints(run?.route_points);

  const isClean = styleMode === 'clean';

  const bg = isClean ? '#FFFFFF' : '#07070A';
  const textPrimary = isClean ? '#111111' : '#FFFFFF';
  const textMuted = isClean ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.38)';
  const divider = isClean ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)';
  const mapBg = isClean ? '#F2F2F2' : 'rgba(255,255,255,0.04)';
  const mapBorder = isClean ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';

  const stats = [
    { value: `${dist} km`, label: 'DISTANCE' },
    { value: `${fmtPace(pace)} /km`, label: 'PACE' },
    { value: fmtDur(durSec), label: 'TIME' },
  ];

  // All measurements are at 1080px scale. We scale down via transform in preview.
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: W, height: H,
        backgroundColor: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        overflow: 'hidden',
        // not visible in DOM — captured by toPng
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* neon bg glow overlay */}
      {!isClean && (
        <>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 0% 0%, rgba(138,43,226,0.22) 0%, transparent 55%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 100% 100%, rgba(191,255,0,0.13) 0%, transparent 55%)',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Top section */}
      <div style={{ paddingTop: 140, textAlign: 'center', width: '100%' }}>
        <div style={{
          fontSize: 36, fontWeight: 600, letterSpacing: 14,
          color: textMuted, textTransform: 'uppercase', lineHeight: 1,
        }}>
          COMPLETED RUN
        </div>
        <div style={{
          fontSize: 130, fontWeight: 900, letterSpacing: -5,
          color: isClean ? '#111' : '#BFFF00',
          lineHeight: 1.1, marginTop: 16,
          textShadow: isClean ? 'none' : '0 0 50px rgba(191,255,0,0.45)',
        }}>
          BoomX
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: W - 160, height: 1.5, backgroundColor: divider, marginTop: 32, flexShrink: 0,
      }} />

      {/* Route map */}
      <div style={{
        width: W - 160, height: 700, marginTop: 40, flexShrink: 0,
        backgroundColor: mapBg,
        borderRadius: 40,
        border: `1.5px solid ${mapBorder}`,
        overflow: 'hidden',
      }}>
        <RouteCanvas points={points} width={W - 160} height={700} style={styleMode} />
      </div>

      {/* Stats — strictly stacked, no inline layout */}
      <div style={{
        width: W - 160, marginTop: 64, flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {stats.map((st, i) => (
          <div key={st.label}>
            {/* value */}
            <div style={{
              fontSize: 88,
              fontWeight: 800,
              color: textPrimary,
              textAlign: 'center',
              lineHeight: 1.0,
              letterSpacing: -1,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {st.value}
            </div>
            {/* label */}
            <div style={{
              fontSize: 28,
              fontWeight: 600,
              color: textMuted,
              textAlign: 'center',
              letterSpacing: 7,
              lineHeight: 1.0,
              marginTop: 10,
              textTransform: 'uppercase',
            }}>
              {st.label}
            </div>
            {/* divider between stats */}
            {i < stats.length - 1 && (
              <div style={{
                width: '60%', height: 1, backgroundColor: divider,
                margin: '36px auto',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <div style={{
        marginTop: 'auto', paddingBottom: 120,
        fontSize: 28, fontWeight: 600, letterSpacing: 10,
        color: textMuted, textTransform: 'uppercase', textAlign: 'center',
      }}>
        RUN · EARN · EVOLVE
      </div>
    </div>
  );
});

// ─── Main modal component ─────────────────────────────────────────────────────
export default function ShareRunModal({ run, user, onClose }) {
  const exportRef = useRef(null);
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [styleMode, setStyleMode] = useState('clean');
  const [actionStatus, setActionStatus] = useState('');
  const [msg, setMsg] = useState('');

  const busy = actionStatus === 'busy';

  // Capture the hidden export node into a PNG using dynamic import
  const capture = async () => {
    if (!exportRef.current) return null;
    const { toPng } = await import('html-to-image');
    exportRef.current.style.visibility = 'visible';
    const dataUrl = await toPng(exportRef.current, {
      backgroundColor: styleMode === 'clean' ? '#FFFFFF' : '#07070A',
      pixelRatio: 1,
      width: 1080,
      height: 1920,
    });
    exportRef.current.style.visibility = 'hidden';
    return dataUrl;
  };

  // Regenerate preview when run or style changes
  useEffect(() => {
    if (!run) return;
    // Small delay to let DOM render the ExportTemplate
    setImgDataUrl(null);
    setGenerating(true);
    const t = setTimeout(async () => {
      const url = await capture();
      setImgDataUrl(url);
      setGenerating(false);
    }, 120);
    return () => clearTimeout(t);
  }, [run, styleMode]);

  const getBlob = async () => {
    const url = imgDataUrl || await capture();
    if (!imgDataUrl && url) setImgDataUrl(url);
    const res = await fetch(url);
    return res.blob();
  };

  const handleSaveToPhotos = async () => {
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
    setActionStatus('success'); setMsg('Downloaded!');
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
    <>
      {/* Hidden export node — lives outside modal overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 1080, height: 1920, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
        {run && <ExportTemplate ref={exportRef} run={run} styleMode={styleMode} />}
      </div>

      {/* Modal overlay */}
      <div style={M.overlay} onClick={onClose}>
        <div style={M.sheet} onClick={e => e.stopPropagation()}>

          <div style={M.handle} />

          <div style={M.titleRow}>
            <span style={M.title}>Share Run</span>
            <button style={M.closeBtn} onClick={onClose}>✕</button>
          </div>

          {/* Style toggle */}
          <div style={M.toggleRow}>
            {[
              { key: 'clean', label: '☀ Clean' },
              { key: 'neon',  label: '⚡ Neon BX' },
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{ ...M.toggleBtn, ...(styleMode === key ? M.toggleActive : M.toggleInactive) }}
                onClick={() => { setStyleMode(key); setMsg(''); setActionStatus(''); }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 9:16 preview — contain, no crop */}
          <div style={M.previewWrap}>
            {generating ? (
              <div style={M.placeholder}>
                <div style={M.spinner} />
                <span style={M.hint}>Generating…</span>
              </div>
            ) : imgDataUrl ? (
              <img src={imgDataUrl} alt="Run card" style={M.previewImg} />
            ) : (
              <div style={M.placeholder}>
                <span style={M.hint}>Preview unavailable</span>
              </div>
            )}
          </div>

          {msg && (
            <div style={{ ...M.feedback, ...(actionStatus === 'error' ? M.fbErr : M.fbOk) }}>
              {msg}
            </div>
          )}

          <div style={M.btnCol}>
            <button style={{ ...M.btn, ...M.btnPrimary, opacity: busy ? 0.55 : 1 }} onClick={handleSaveToPhotos} disabled={busy}>
              {busy ? 'Working…' : '📲 Save to Photos'}
            </button>
            <button style={{ ...M.btn, ...M.btnSec, opacity: busy ? 0.55 : 1 }} onClick={handleDownload} disabled={busy}>
              ⬇ Download PNG
            </button>
            <button style={{ ...M.btn, ...M.btnSec, opacity: busy ? 0.55 : 1 }} onClick={handlePost} disabled={busy}>
              📣 Post to Feed
            </button>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const M = {
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
  handle: {
    width: 44, height: 4, borderRadius: 2,
    background: 'rgba(255,255,255,0.18)', alignSelf: 'center', flexShrink: 0,
  },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  title: { fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10, width: 32, height: 32, color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 600,
  },
  toggleRow: { display: 'flex', gap: 8, flexShrink: 0 },
  toggleBtn: {
    flex: 1, padding: '10px 0', borderRadius: 999, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s', letterSpacing: '0.03em',
  },
  toggleActive: { background: '#BFFF00', color: '#07070A', boxShadow: '0 0 16px rgba(191,255,0,0.30)' },
  toggleInactive: {
    background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.10)',
  },
  previewWrap: {
    width: '100%', maxWidth: 300, alignSelf: 'center',
    aspectRatio: '9 / 16', borderRadius: 14, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)', background: '#0A0A0A',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  spinner: {
    width: 28, height: 28, borderRadius: '50%',
    border: '2.5px solid rgba(191,255,0,0.20)', borderTopColor: '#BFFF00',
    animation: 'spin 0.8s linear infinite',
  },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  feedback: { textAlign: 'center', padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600, flexShrink: 0 },
  fbOk: { background: 'rgba(80,220,120,0.12)', border: '1px solid rgba(80,220,120,0.25)', color: 'rgba(80,220,120,0.90)' },
  fbErr: { background: 'rgba(255,90,90,0.10)', border: '1px solid rgba(255,90,90,0.25)', color: 'rgba(255,90,90,0.85)' },
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
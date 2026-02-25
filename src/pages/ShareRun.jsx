import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Download, Loader2 } from 'lucide-react';

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt2 = (n) => Number(n || 0).toFixed(2);

const formatTime = (totalSec) => {
  if (!totalSec) return '0:00';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatPace = (dist, secs) => {
  if (!dist || dist <= 0 || !secs || secs <= 0) return '--';
  const pMin = (secs / 60) / dist;
  const m = Math.floor(pMin);
  const sec = Math.round((pMin - m) * 60);
  const secStr = String(sec === 60 ? 0 : sec).padStart(2, '0');
  const mAdj = sec === 60 ? m + 1 : m;
  return `${mAdj}:${secStr}`;
};

// ─── Parse route points robustly ─────────────────────────────────────────────
const parseRoutePoints = (raw) => {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr
      .map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }))
      .filter(p => isFinite(p.lat) && isFinite(p.lng));
  } catch (_) { return []; }
};

// ─── Draw share template onto canvas ─────────────────────────────────────────
const CANVAS_W = 1080;
const CANVAS_H = 1920;

function drawTemplate(canvas, { distKm, durSec, bxEarned, routePoints, dateStr }) {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // ── 1. Asphalt background ──
  // Base dark fill
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Asphalt texture via noise-like gradient speckle
  const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  grad.addColorStop(0,   'rgba(22,22,28,1)');
  grad.addColorStop(0.4, 'rgba(14,14,18,1)');
  grad.addColorStop(1,   'rgba(8,8,12,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Asphalt speckle (random dots)
  const seed = 42;
  let rng = seed;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  for (let i = 0; i < 18000; i++) {
    const x = rand() * CANVAS_W;
    const y = rand() * CANVAS_H;
    const r = rand() * 1.4;
    const a = rand() * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${180 + rand() * 60 | 0},${180 + rand() * 60 | 0},${180 + rand() * 60 | 0},${a})`;
    ctx.fill();
  }

  // Vignette
  const vig = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.2, CANVAS_W/2, CANVAS_H/2, CANVAS_W*0.85);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(1,   'rgba(0,0,0,0.75)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Scanlines
  for (let y = 0; y < CANVAS_H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, y, CANVAS_W, 1);
  }

  // Purple glow top-left
  const glowPurple = ctx.createRadialGradient(-100, -100, 0, -100, -100, 900);
  glowPurple.addColorStop(0, 'rgba(138,43,226,0.28)');
  glowPurple.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowPurple;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Lime glow bottom-right
  const glowLime = ctx.createRadialGradient(CANVAS_W+100, CANVAS_H+100, 0, CANVAS_W+100, CANVAS_H+100, 900);
  glowLime.addColorStop(0, 'rgba(191,255,0,0.18)');
  glowLime.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowLime;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ── 2. Thin neon divider under stats area ──
  const divY = 860;
  const dividerGrad = ctx.createLinearGradient(0, divY, CANVAS_W, divY);
  dividerGrad.addColorStop(0,    'rgba(191,255,0,0)');
  dividerGrad.addColorStop(0.5,  'rgba(191,255,0,0.45)');
  dividerGrad.addColorStop(1,    'rgba(191,255,0,0)');
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, divY);
  ctx.lineTo(CANVAS_W - 60, divY);
  ctx.stroke();

  // ── 3. TOP STATS BLOCK ──
  const CX = CANVAS_W / 2;
  const statTop = 180;

  // Date label
  if (dateStr) {
    ctx.font = '600 38px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.textAlign = 'center';
    ctx.fillText(dateStr.toUpperCase(), CX, statTop);
  }

  // Distance
  ctx.font = '700 44px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.textAlign = 'center';
  ctx.fillText('DISTANCE', CX, statTop + 110);

  ctx.save();
  ctx.shadowColor = 'rgba(191,255,0,0.6)';
  ctx.shadowBlur = 40;
  ctx.font = '900 180px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#BFFF00';
  ctx.textAlign = 'center';
  ctx.fillText(`${Number(distKm || 0).toFixed(2)}`, CX, statTop + 290);
  ctx.restore();

  ctx.font = '700 56px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('KM', CX, statTop + 370);

  // Pace & Time row
  const paceLabel = formatPace(distKm, durSec);
  const timeLabel = formatTime(durSec);

  // Pace box
  const boxY = statTop + 440;
  const boxH = 160;
  const boxW = 440;
  const boxGap = 40;
  const boxLeft  = CX - boxW - boxGap / 2;
  const boxRight = CX + boxGap / 2;

  // Pace
  roundRect(ctx, boxLeft, boxY, boxW, boxH, 24, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.09)');
  ctx.font = '700 38px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.textAlign = 'center';
  ctx.fillText('PACE', boxLeft + boxW / 2, boxY + 50);
  ctx.save();
  ctx.shadowColor = 'rgba(191,255,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.font = '900 72px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#BFFF00';
  ctx.fillText(paceLabel, boxLeft + boxW / 2, boxY + 125);
  ctx.restore();
  ctx.font = '600 30px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText('/km', boxLeft + boxW / 2, boxY + 155);

  // Time
  roundRect(ctx, boxRight, boxY, boxW, boxH, 24, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.09)');
  ctx.font = '700 38px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.textAlign = 'center';
  ctx.fillText('TIME', boxRight + boxW / 2, boxY + 50);
  ctx.save();
  ctx.shadowColor = 'rgba(191,255,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.font = '900 72px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#BFFF00';
  ctx.fillText(timeLabel, boxRight + boxW / 2, boxY + 125);
  ctx.restore();

  // ── 4. ROUTE DRAWING AREA ──
  const routeTop    = divY + 30;
  const routeBottom = CANVAS_H - 340;
  const routeLeft   = 80;
  const routeRight  = CANVAS_W - 80;
  const routeW      = routeRight - routeLeft;
  const routeH      = routeBottom - routeTop;

  if (routePoints.length >= 2) {
    // Compute bounds
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    routePoints.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    const pad = 80;

    const toX = (lng) => routeLeft + pad + ((lng - minLng) / lngRange) * (routeW - pad * 2);
    const toY = (lat) => routeTop  + pad + ((maxLat - lat) / latRange)  * (routeH - pad * 2);

    const pts = routePoints.map(p => ({ x: toX(p.lng), y: toY(p.lat) }));

    // Outer glow pass
    ctx.save();
    ctx.shadowColor = 'rgba(191,255,0,0.55)';
    ctx.shadowBlur = 28;
    ctx.strokeStyle = 'rgba(191,255,0,0.25)';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    // Main neon line
    ctx.save();
    ctx.shadowColor = 'rgba(191,255,0,0.8)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = '#BFFF00';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    // Start dot (green)
    const start = pts[0];
    ctx.save();
    ctx.shadowColor = 'rgba(80,255,120,0.9)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#40FF80';
    ctx.fill();
    ctx.restore();

    // End dot (neon pink/red)
    const end = pts[pts.length - 1];
    ctx.save();
    ctx.shadowColor = 'rgba(255,60,120,0.9)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#FF3C78';
    ctx.fill();
    ctx.restore();
  } else {
    // No route placeholder
    ctx.font = '600 38px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'center';
    ctx.fillText('No route recorded', CX, routeTop + routeH / 2);

    // Draw a short neon dashed placeholder line
    ctx.save();
    ctx.shadowColor = 'rgba(191,255,0,0.4)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(191,255,0,0.35)';
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 14]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(CX - 220, routeTop + routeH / 2 + 50);
    ctx.lineTo(CX + 220, routeTop + routeH / 2 + 50);
    ctx.stroke();
    ctx.restore();
  }

  // ── 5. BRANDING ──
  const brandY = routeBottom + 20;
  ctx.save();
  ctx.shadowColor = 'rgba(191,255,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.font = '900 96px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#BFFF00';
  ctx.textAlign = 'center';
  ctx.fillText('BoomX', CX, brandY + 90);
  ctx.restore();

  ctx.font = '700 38px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('RUN · EARN · EVOLVE', CX, brandY + 150);

  // ── 6. BOTTOM STATS BAR ──
  const barH   = 200;
  const barY   = CANVAS_H - barH - 30;
  const barX   = 60;
  const barW   = CANVAS_W - 120;

  // Panel background
  roundRect(ctx, barX, barY, barW, barH, 32, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.10)');

  // Neon top border
  const barTopGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  barTopGrad.addColorStop(0,   'rgba(191,255,0,0)');
  barTopGrad.addColorStop(0.5, 'rgba(191,255,0,0.5)');
  barTopGrad.addColorStop(1,   'rgba(191,255,0,0)');
  ctx.strokeStyle = barTopGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(barX + 32, barY);
  ctx.lineTo(barX + barW - 32, barY);
  ctx.stroke();

  // Three columns
  const cols = [
    { label: 'DISTANCE', value: `${Number(distKm || 0).toFixed(2)} km` },
    { label: 'TIME',     value: timeLabel },
    { label: 'BX EARNED',value: `${Number(bxEarned || 0).toFixed(2)} BX` },
  ];
  const colW = barW / 3;

  cols.forEach((col, i) => {
    const cx = barX + colW * i + colW / 2;

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(barX + colW * i, barY + 30);
      ctx.lineTo(barX + colW * i, barY + barH - 30);
      ctx.stroke();
    }

    ctx.font = '600 30px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.textAlign = 'center';
    ctx.fillText(col.label, cx, barY + 60);

    ctx.save();
    if (col.label === 'BX EARNED') {
      ctx.shadowColor = 'rgba(191,255,0,0.5)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#BFFF00';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.font = '800 52px Helvetica Neue, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.value, cx, barY + 145);
    ctx.restore();
  });
}

// ─── Utility: draw rounded rect with fill + stroke ────────────────────────────
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShareRun() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const runId = params.get('run_id') || params.get('id');

  const { data: runs, isLoading } = useQuery({
    queryKey: ['shareRun', runId],
    queryFn: () => base44.entities.Runs.filter({ id: runId }),
    enabled: !!runId,
  });

  const { data: walletLogs } = useQuery({
    queryKey: ['shareWalletLog', runId],
    queryFn: () => base44.entities.WalletLog.filter({ run_id: runId, source_type: 'run' }),
    enabled: !!runId,
  });

  const run = runs?.[0];

  const bxEarned = React.useMemo(() => {
    if (walletLogs?.length > 0) {
      const log = walletLogs[0];
      if (log.final_reward != null) return log.final_reward;
    }
    return run?.tokens_earned ?? 0;
  }, [walletLogs, run]);

  const distKm   = run?.distance_km ?? 0;
  const durSec   = run?.duration_sec ?? run?.duration_seconds ?? 0;
  const routePoints = React.useMemo(() => parseRoutePoints(run?.route_points), [run]);
  const dateStr  = run?.start_time
    ? new Date(run.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  // Draw whenever data is ready
  useEffect(() => {
    if (!canvasRef.current || !run) return;
    drawTemplate(canvasRef.current, { distKm, durSec, bxEarned, routePoints, dateStr });
  }, [run, bxEarned, routePoints, distKm, durSec, dateStr]);

  const getBlob = useCallback(() => new Promise(resolve => {
    canvasRef.current?.toBlob(resolve, 'image/png');
  }), []);

  const handleSave = useCallback(async () => {
    const blob = await getBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `boomx-run-${runId || 'share'}.png`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [getBlob, runId]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await getBlob();
      if (!blob) return;
      const file = new File([blob], `boomx-run-${runId || 'share'}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My BoomX Run',
          text: `I ran ${Number(distKm).toFixed(2)} km and earned ${Number(bxEarned).toFixed(2)} BX 🏃‍♂️⚡`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } finally {
      setSharing(false);
    }
  }, [getBlob, runId, distKm, bxEarned]);

  return (
    <div style={S.root}>

      {/* ── Background glows (pointer-events: none) ── */}
      <div style={S.bgLayer}>
        <div style={S.glowPurple} />
        <div style={S.glowLime} />
      </div>

      {/* ── Foreground ── */}
      <div style={S.page}>

        {/* Header */}
        <div style={S.header}>
          <button style={S.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} color="#BFFF00" />
          </button>
          <div>
            <div style={S.headerLabel}>SHARE RUN</div>
          </div>
          <div style={{ width: 40 }} />
        </div>

        {isLoading && (
          <div style={S.center}>
            <Loader2 size={32} color="#BFFF00" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!isLoading && !run && (
          <div style={S.center}>
            <p style={S.mutedText}>Run not found.</p>
            <button style={S.outlineBtn} onClick={() => navigate(createPageUrl('History'))}>← Back</button>
          </div>
        )}

        {!isLoading && run && (
          <>
            {/* Canvas preview (scaled to fit screen) */}
            <div style={S.canvasWrap}>
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                style={S.canvas}
              />
            </div>

            {/* Action buttons */}
            <div style={S.actions}>
              <button style={S.shareBtn} onClick={handleShare} disabled={sharing}>
                {sharing
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Share2 size={18} />}
                <span>Share</span>
              </button>
              <button style={S.saveBtn} onClick={handleSave}>
                <Download size={18} />
                <span>Save Image</span>
              </button>
            </div>

            {/* Quick stats reminder */}
            <div style={S.statsRow}>
              <div style={S.statChip}>
                <span style={S.chipVal}>{Number(distKm).toFixed(2)}</span>
                <span style={S.chipLbl}>km</span>
              </div>
              <div style={S.statChip}>
                <span style={S.chipVal}>{formatTime(durSec)}</span>
                <span style={S.chipLbl}>time</span>
              </div>
              <div style={S.statChip}>
                <span style={{ ...S.chipVal, color: '#BFFF00' }}>{Number(bxEarned).toFixed(2)}</span>
                <span style={S.chipLbl}>BX</span>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

const S = {
  root: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#07070A',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  bgLayer: {
    position: 'absolute', inset: 0,
    zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
  },
  glowPurple: {
    position: 'absolute', top: '-10%', left: '-15%',
    width: '70vw', height: '70vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(138,43,226,0.22) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  glowLime: {
    position: 'absolute', bottom: '5%', right: '-10%',
    width: '55vw', height: '55vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,255,0,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  page: {
    position: 'relative', zIndex: 1,
    maxWidth: 480, margin: '0 auto',
    paddingBottom: 100,
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '52px 20px 16px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12, width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
  headerLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
    marginTop: 10,
  },
  center: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '80px 0', gap: 16,
  },
  mutedText: { color: 'rgba(255,255,255,0.40)', fontSize: 15 },
  outlineBtn: {
    background: 'none', border: '1px solid rgba(191,255,0,0.30)',
    color: '#BFFF00', padding: '10px 24px', borderRadius: 999,
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },

  /* Canvas preview */
  canvasWrap: {
    margin: '0 16px 20px',
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid rgba(191,255,0,0.15)',
    boxShadow: '0 0 40px rgba(191,255,0,0.10), 0 0 80px rgba(138,43,226,0.12)',
  },
  canvas: {
    display: 'block',
    width: '100%',   // scaled to container, actual resolution is 1080x1920
    height: 'auto',
  },

  /* Action buttons */
  actions: {
    display: 'flex', gap: 12, padding: '0 16px 20px',
  },
  shareBtn: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '16px 0', borderRadius: 999,
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A', fontSize: 15, fontWeight: 900,
    letterSpacing: '0.10em', border: 'none', cursor: 'pointer',
    boxShadow: '0 0 30px rgba(191,255,0,0.35)',
    textTransform: 'uppercase',
  },
  saveBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '16px 24px', borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: '0.06em',
  },

  /* Quick stats chips */
  statsRow: {
    display: 'flex', gap: 10, padding: '0 16px',
  },
  statChip: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  chipVal: { fontSize: 18, fontWeight: 800, color: '#fff' },
  chipLbl: { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' },
};
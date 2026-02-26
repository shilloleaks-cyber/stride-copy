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

    if (variant !== 'card') {
      ctx.clearRect(0, 0, W, H);
      _drawVibeVariant(ctx, run, W, H);
      return resolve(canvas.toDataURL('image/png'));
    }

    // ════════════════════════════════════════════════════════
    // LAYOUT CONSTANTS — 3 locked blocks, no overlap
    // ════════════════════════════════════════════════════════
    const PAD   = 72;          // horizontal padding
    const CW    = W - PAD * 2; // content width = 936

    // Block A: Header  top=60 .. bottom=380
    const HDR_TOP = 60;
    const HDR_H   = 320;

    // Block B: Route panel  top=400 .. bottom=1220
    const MAP_X = PAD, MAP_Y = 400, MAP_W = CW, MAP_H = 820;
    const MAP_R = 32; // corner radius

    // Block C: Stats panel  top=1244 .. bottom=1484 (240px)
    const SBX_X = PAD, SBX_Y = 1244, SBX_W = CW, SBX_H = 240;

    // Tagline: ~1520
    // BX logo: ~1700

    // ════════════════════════════════════════════════════════
    // 1. BACKGROUND — aggressive dark space/grunge
    // ════════════════════════════════════════════════════════
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, W, H);

    // Heavy grain — two passes: dust + film noise
    for (let i = 0; i < 80000; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const a = Math.random() * 0.07;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x, y, 1, 1);
    }
    // Dark dust patches
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
      ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
    }
    // Star specks
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 1.5;
      const a = Math.random() * 0.6 + 0.2;
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
      ctx.restore();
    }

    // Purple nebula — top-left large
    const nb1 = ctx.createRadialGradient(W * 0.05, H * 0.06, 0, W * 0.15, H * 0.10, 600);
    nb1.addColorStop(0, 'rgba(120,20,220,0.50)');
    nb1.addColorStop(0.4, 'rgba(80,0,160,0.22)');
    nb1.addColorStop(1, 'transparent');
    ctx.fillStyle = nb1; ctx.fillRect(0, 0, W, H);

    // Secondary purple smear mid-left
    const nb2 = ctx.createRadialGradient(W * 0.0, H * 0.40, 0, W * 0.05, H * 0.40, 320);
    nb2.addColorStop(0, 'rgba(90,0,180,0.28)');
    nb2.addColorStop(1, 'transparent');
    ctx.fillStyle = nb2; ctx.fillRect(0, 0, W, H);

    // Lime haze bottom-right
    const nb3 = ctx.createRadialGradient(W * 0.88, H * 0.80, 0, W * 0.88, H * 0.80, 500);
    nb3.addColorStop(0, 'rgba(191,255,0,0.18)');
    nb3.addColorStop(0.5, 'rgba(140,220,0,0.07)');
    nb3.addColorStop(1, 'transparent');
    ctx.fillStyle = nb3; ctx.fillRect(0, 0, W, H);

    // Diagonal purple streak — top-left
    ctx.save();
    ctx.translate(W * 0.02, H * 0.03); ctx.rotate(0.56);
    const ds1 = ctx.createLinearGradient(0, 0, 600, 0);
    ds1.addColorStop(0, 'transparent');
    ds1.addColorStop(0.35, 'rgba(160,40,255,0.22)');
    ds1.addColorStop(0.65, 'rgba(180,80,255,0.14)');
    ds1.addColorStop(1, 'transparent');
    ctx.fillStyle = ds1; ctx.fillRect(0, -7, 640, 14);
    ctx.restore();

    // Diagonal lime streak — bottom-right
    ctx.save();
    ctx.translate(W * 0.55, H * 0.70); ctx.rotate(-0.48);
    const ds2 = ctx.createLinearGradient(0, 0, 580, 0);
    ds2.addColorStop(0, 'transparent');
    ds2.addColorStop(0.3, 'rgba(191,255,0,0.20)');
    ds2.addColorStop(0.65, 'rgba(170,240,0,0.12)');
    ds2.addColorStop(1, 'transparent');
    ctx.fillStyle = ds2; ctx.fillRect(0, -6, 580, 12);
    ctx.restore();

    // Faint scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, y, W, 2);
    }

    // Vignette — strong edges
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.80);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(0.6, 'rgba(0,0,0,0.35)');
    vig.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

    // ════════════════════════════════════════════════════════
    // 2. SCI-FI HUD FRAME — outer card border
    // ════════════════════════════════════════════════════════
    const FP = 28; // frame inset from edge
    const FR = 18; // frame corner radius
    const FX = FP, FY = FP, FW = W - FP * 2, FH = H - FP * 2;

    // Outer neon-lime stroke
    ctx.save();
    ctx.beginPath(); ctx.roundRect(FX, FY, FW, FH, FR);
    ctx.strokeStyle = 'rgba(191,255,0,0.28)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(191,255,0,0.50)'; ctx.shadowBlur = 18;
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();

    // Inner darker stroke
    ctx.save();
    ctx.beginPath(); ctx.roundRect(FX + 5, FY + 5, FW - 10, FH - 10, FR - 2);
    ctx.strokeStyle = 'rgba(191,255,0,0.08)';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // Corner accent ticks — 4 corners
    const tickLen = 40, tickW = 3;
    const corners = [
      { x: FX, y: FY, dx: 1, dy: 1 },
      { x: FX + FW, y: FY, dx: -1, dy: 1 },
      { x: FX, y: FY + FH, dx: 1, dy: -1 },
      { x: FX + FW, y: FY + FH, dx: -1, dy: -1 },
    ];
    corners.forEach(({ x, y, dx, dy }) => {
      ctx.save();
      ctx.strokeStyle = '#BFFF00';
      ctx.lineWidth = tickW;
      ctx.shadowColor = 'rgba(191,255,0,0.7)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(x + dx * 2, y); ctx.lineTo(x + dx * tickLen, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + dy * 2); ctx.lineTo(x, y + dy * tickLen); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    });

    // Micro tick marks along top edge
    for (let tx = FX + 80; tx < FX + FW - 80; tx += 48) {
      const isLong = (tx - FX - 80) % (48 * 4) === 0;
      ctx.save();
      ctx.strokeStyle = `rgba(191,255,0,${isLong ? 0.5 : 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, FY); ctx.lineTo(tx, FY + (isLong ? 14 : 7));
      ctx.stroke(); ctx.restore();
    }

    // ════════════════════════════════════════════════════════
    // 3. BLOCK A — HEADER
    // ════════════════════════════════════════════════════════
    // "COMPLETED RUN" label
    ctx.save();
    ctx.font = '500 30px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '14px';
    ctx.fillText('COMPLETED RUN', W / 2, HDR_TOP + 90);
    ctx.restore();

    // "BoomX" — neon-lime, punchy glow
    ctx.save();
    ctx.font = '900 170px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = '#BFFF00';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(191,255,0,0.80)'; ctx.shadowBlur = 70;
    ctx.fillText('BoomX', W / 2, HDR_TOP + 260);
    ctx.shadowBlur = 35;
    ctx.fillText('BoomX', W / 2, HDR_TOP + 260); // double for punch
    ctx.shadowBlur = 0;
    ctx.restore();

    // Thin lime divider below header
    ctx.save();
    ctx.strokeStyle = 'rgba(191,255,0,0.20)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(191,255,0,0.40)'; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(PAD + 60, HDR_TOP + HDR_H);
    ctx.lineTo(W - PAD - 60, HDR_TOP + HDR_H);
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();

    // ════════════════════════════════════════════════════════
    // 4. BLOCK B — ROUTE PANEL
    // ════════════════════════════════════════════════════════

    // Clip to panel — route NEVER escapes
    ctx.save();
    ctx.beginPath(); ctx.roundRect(MAP_X, MAP_Y, MAP_W, MAP_H, MAP_R);
    ctx.clip();

    // Panel bg: very dark glass
    ctx.fillStyle = 'rgba(6,6,16,0.72)';
    ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H);

    // Inner grain for panel
    for (let i = 0; i < 18000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.fillRect(MAP_X + Math.random() * MAP_W, MAP_Y + Math.random() * MAP_H, 1, 1);
    }

    // Subtle purple haze inside panel top
    const ph = ctx.createRadialGradient(MAP_X + MAP_W * 0.3, MAP_Y + MAP_H * 0.1, 0, MAP_X + MAP_W * 0.3, MAP_Y + MAP_H * 0.1, 350);
    ph.addColorStop(0, 'rgba(100,0,180,0.16)'); ph.addColorStop(1, 'transparent');
    ctx.fillStyle = ph; ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H);

    // Route line
    const points = parseRoutePoints(run?.route_points);
    if (points.length >= 2) {
      const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
      const ip = 110;
      const iW = MAP_W - ip * 2, iH = MAP_H - ip * 2;
      const scX = iW / (maxLng - minLng || 0.0001);
      const scY = iH / (maxLat - minLat || 0.0001);
      const sc = Math.min(scX, scY);
      const ofX = (iW - (maxLng - minLng) * sc) / 2;
      const ofY = (iH - (maxLat - minLat) * sc) / 2;
      const toX = (lng) => MAP_X + ip + ofX + (lng - minLng) * sc;
      const toY = (lat) => MAP_Y + ip + ofY + (maxLat - lat) * sc;

      const pathFn = () => {
        ctx.beginPath();
        ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
        for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
      };

      // Pass 1: wide outer glow
      ctx.save(); pathFn();
      ctx.strokeStyle = 'rgba(191,255,0,0.18)'; ctx.lineWidth = 36;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 55;
      ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

      // Pass 2: bright neon core
      ctx.save(); pathFn();
      ctx.strokeStyle = '#BFFF00'; ctx.lineWidth = 9;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 28;
      ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

      // Pass 3: white-hot center
      ctx.save(); pathFn();
      ctx.strokeStyle = 'rgba(240,255,180,0.92)'; ctx.lineWidth = 3;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke(); ctx.restore();

      // Start dot — lime with halo ring
      const sx = toX(points[0].lng), sy = toY(points[0].lat);
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(191,255,0,0.12)'; ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#BFFF00'; ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 35;
      ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();

      // End dot — pink/red with halo
      const last = points[points.length - 1];
      const ex = toX(last.lng), ey = toY(last.lat);
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,130,0.14)'; ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, 16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,100,140,0.85)'; ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,80,130,0.9)'; ctx.shadowBlur = 24;
      ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,130,160,0.9)'; ctx.fill(); ctx.restore();
    } else {
      ctx.font = '500 38px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.textAlign = 'center';
      ctx.fillText('No route recorded', W / 2, MAP_Y + MAP_H / 2);
    }

    ctx.restore(); // end clip

    // Panel border (drawn after clip restore so it's on top)
    ctx.save();
    ctx.beginPath(); ctx.roundRect(MAP_X, MAP_Y, MAP_W, MAP_H, MAP_R);
    ctx.strokeStyle = 'rgba(191,255,0,0.35)'; ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(191,255,0,0.50)'; ctx.shadowBlur = 16;
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

    // Inner darker border
    ctx.save();
    ctx.beginPath(); ctx.roundRect(MAP_X + 4, MAP_Y + 4, MAP_W - 8, MAP_H - 8, MAP_R - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // ════════════════════════════════════════════════════════
    // 5. BLOCK C — STATS PANEL
    // ════════════════════════════════════════════════════════
    const pace   = getPace(run);
    const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;

    // Stats panel background — glassy dark
    ctx.save();
    ctx.beginPath(); ctx.roundRect(SBX_X, SBX_Y, SBX_W, SBX_H, 22);
    const sglass = ctx.createLinearGradient(SBX_X, SBX_Y, SBX_X, SBX_Y + SBX_H);
    sglass.addColorStop(0, 'rgba(255,255,255,0.07)');
    sglass.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = sglass; ctx.fill();
    ctx.restore();

    // Panel border + inner shadow line
    ctx.save();
    ctx.beginPath(); ctx.roundRect(SBX_X, SBX_Y, SBX_W, SBX_H, 22);
    ctx.strokeStyle = 'rgba(191,255,0,0.22)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(191,255,0,0.30)'; ctx.shadowBlur = 10;
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

    // Top highlight line of panel
    ctx.save();
    const hl = ctx.createLinearGradient(SBX_X, SBX_Y, SBX_X + SBX_W, SBX_Y);
    hl.addColorStop(0, 'transparent');
    hl.addColorStop(0.3, 'rgba(191,255,0,0.25)');
    hl.addColorStop(0.7, 'rgba(191,255,0,0.25)');
    hl.addColorStop(1, 'transparent');
    ctx.strokeStyle = hl; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(SBX_X + 22, SBX_Y); ctx.lineTo(SBX_X + SBX_W - 22, SBX_Y);
    ctx.stroke(); ctx.restore();

    const stats = [
      { label: 'DISTANCE', value: `${Number(run?.distance_km || 0).toFixed(2)}`, unit: 'km' },
      { label: 'PACE',     value: fmtPace(pace),  unit: '/km' },
      { label: 'TIME',     value: fmtDur(durSec), unit: '' },
    ];

    // Fixed Y positions within stats panel — all relative to SBX_Y
    // Panel H = 240px  |  content block centres ~160px tall
    // LABEL  → baseline SBX_Y + 56
    // VALUE  → baseline SBX_Y + 158
    // UNIT   → baseline SBX_Y + 208  (extra 6px gap below value)
    const LBL_Y = SBX_Y + 56;
    const VAL_Y = SBX_Y + 158;
    const UNT_Y = SBX_Y + 208;
    const colW  = SBX_W / 3;

    stats.forEach((st, i) => {
      const cx = SBX_X + colW * i + colW / 2;

      // Vertical divider
      if (i > 0) {
        const dvx = SBX_X + colW * i;
        ctx.save();
        const dg = ctx.createLinearGradient(dvx, SBX_Y + 20, dvx, SBX_Y + SBX_H - 20);
        dg.addColorStop(0, 'transparent');
        dg.addColorStop(0.3, 'rgba(191,255,0,0.22)');
        dg.addColorStop(0.7, 'rgba(191,255,0,0.22)');
        dg.addColorStop(1, 'transparent');
        ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(dvx, SBX_Y + 16); ctx.lineTo(dvx, SBX_Y + SBX_H - 16);
        ctx.stroke(); ctx.restore();
      }

      // LABEL — slightly larger, letter-spaced, mid-bright
      ctx.save();
      ctx.font = '600 28px Helvetica Neue, Arial, sans-serif';
      ctx.fillStyle = 'rgba(200,210,200,0.52)';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.shadowColor = 'rgba(0,0,0,0.70)';
      ctx.shadowBlur = 6;
      ctx.fillText(st.label, cx, LBL_Y);
      ctx.shadowBlur = 0; ctx.restore();

      // VALUE — pure bright white, dominant
      const vSize = i === 0 ? 68 : i === 1 ? 64 : 60;
      ctx.save();
      ctx.font = `800 ${vSize}px Helvetica Neue, Arial, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(191,255,0,0.22)';
      ctx.shadowBlur = 14;
      ctx.fillText(st.value, cx, VAL_Y);
      ctx.shadowBlur = 0; ctx.restore();

      // UNIT — neon-soft tinted gray, clearly readable, below value
      if (st.unit) {
        ctx.save();
        ctx.font = '600 38px Helvetica Neue, Arial, sans-serif';
        ctx.fillStyle = 'rgba(191,230,160,0.62)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '3px';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 9;
        ctx.shadowOffsetY = 2;
        ctx.fillText(st.unit, cx, UNT_Y);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.restore();
      }
    });

    // ── Tagline
    ctx.save();
    ctx.font = '500 26px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText('RUN · EARN · EVOLVE', W / 2, SBX_Y + SBX_H + 64);
    ctx.restore();

    // ── BX logo — neon-lime, strong glow, blur halo
    const BX_Y = SBX_Y + SBX_H + 240;
    ctx.save();
    ctx.font = '900 180px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(191,255,0,0.12)';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#BFFF00'; ctx.shadowBlur = 90;
    ctx.fillText('BX', W / 2, BX_Y); // blur halo pass
    ctx.shadowBlur = 0; ctx.restore();

    ctx.save();
    ctx.font = '900 180px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = '#BFFF00';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(191,255,0,0.85)'; ctx.shadowBlur = 55;
    ctx.fillText('BX', W / 2, BX_Y);
    ctx.shadowBlur = 25; ctx.fillText('BX', W / 2, BX_Y); // second pass for punch
    ctx.shadowBlur = 0; ctx.restore();

    resolve(canvas.toDataURL('image/png'));
  });
}

function _drawVibeVariant(ctx, run, W, H) {
  // Black background (as shown in the reference image)
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, W, H);

  const routeColor = '#BFFF00';

  // ── BoomX title ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = '900 160px Helvetica Neue, Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('BoomX', W / 2, 260);
  ctx.restore();

  // ── Route ────────────────────────────────────────────────────────────────────
  const MAP_Y = 340, MAP_H = 820;
  const points = parseRoutePoints(run?.route_points);

  if (points.length >= 2) {
    const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const ip = 120;
    const iW = W - ip * 2, iH = MAP_H - ip * 2;
    const scX = iW / (maxLng - minLng || 0.0001);
    const scY = iH / (maxLat - minLat || 0.0001);
    const sc = Math.min(scX, scY);
    const ofX = (iW - (maxLng - minLng) * sc) / 2;
    const ofY = (iH - (maxLat - minLat) * sc) / 2;
    const toX = (lng) => ip + ofX + (lng - minLng) * sc;
    const toY = (lat) => MAP_Y + ip + ofY + (maxLat - lat) * sc;

    // Route line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
    for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
    ctx.strokeStyle = routeColor;
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = routeColor; ctx.shadowBlur = 18;
    ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();

    // Start dot — red
    ctx.save();
    ctx.beginPath(); ctx.arc(toX(points[0].lng), toY(points[0].lat), 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FF3B3B';
    ctx.shadowColor = 'rgba(255,60,60,0.7)'; ctx.shadowBlur = 14;
    ctx.fill(); ctx.shadowBlur = 0; ctx.restore();

    // End dot — lime green
    const last = points[points.length - 1];
    ctx.save();
    ctx.beginPath(); ctx.arc(toX(last.lng), toY(last.lat), 14, 0, Math.PI * 2);
    ctx.fillStyle = routeColor;
    ctx.shadowColor = 'rgba(191,255,0,0.7)'; ctx.shadowBlur = 14;
    ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const pace   = getPace(run);
  const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;
  const statBlocks = [
    { value: `${Number(run?.distance_km || 0).toFixed(2)} km`, label: 'DISTANCE' },
    { value: `${fmtPace(pace)} /km`,                           label: 'PACE' },
    { value: fmtDur(durSec),                                   label: 'TIME' },
  ];

  const STATS_TOP = MAP_Y + MAP_H + 60;
  const SLOT = 190;
  statBlocks.forEach((st, i) => {
    const baseY = STATS_TOP + i * SLOT;
    // Value — white, large bold
    ctx.save();
    ctx.font = '800 96px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(st.value, W / 2, baseY + 96);
    ctx.restore();
    // Label — small, dimmed white, letter-spaced
    ctx.save();
    ctx.font = '600 32px Helvetica Neue, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(st.label, W / 2, baseY + 96 + 18 + 32);
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
    // Try native share sheet first (iOS/Android) — user can tap "Save to Photos" directly
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'BoomX Run', text: 'My BoomX Run 🏃‍♂️⚡' });
        setActionStatus('success'); setMsg('บันทึกรูปได้เลย!');
        return;
      } catch (e) {
        if (e.name === 'AbortError') { setActionStatus(''); return; } // user cancelled
      }
    }
    // Fallback: direct download (desktop)
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boomx-run-${run.id || Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setActionStatus('success'); setMsg('บันทึกแล้ว!');
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
        <div style={{
          ...S.previewWrap,
          ...(variant === 'vibe' ? S.previewWrapVibe : {}),
        }}>
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
  // Vibe preview-only background (CSS only, not drawn on canvas)
  previewWrapVibe: {
    background: '#0A0A0A',
    border: '1px solid rgba(255,255,255,0.06)',
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
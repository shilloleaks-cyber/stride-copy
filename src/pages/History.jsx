import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RunCard from '../components/running/RunCard';

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtDuration(totalSec) {
  if (!totalSec) return '0:00';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function avgPaceStr(runs) {
  const validRuns = runs.filter(r => {
    const dist = r.distance_km || 0;
    const secs = r.duration_seconds ?? r.duration_sec ?? 0;
    return dist > 0 && secs > 0;
  });
  if (!validRuns.length) return '--:--';
  const avgMin = validRuns.reduce((sum, r) => {
    const dist = r.distance_km;
    const secs = r.duration_seconds ?? r.duration_sec;
    return sum + (secs / 60) / dist;
  }, 0) / validRuns.length;
  const m = Math.floor(avgMin);
  const s = Math.round((avgMin - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── component ───────────────────────────────────────────────────────────────
export default function History() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [filter, setFilter] = useState('all');

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ['historyRuns'],
    queryFn: () => base44.entities.Runs.filter({ status: 'completed' }, '-start_time', 100),
    enabled: !isLoading && !!user,
  });

  // Redirect to welcome if not seen
  useEffect(() => {
    if (!isLoading && user && user.has_seen_welcome !== true) {
      navigate(createPageUrl('Welcome'), { replace: true });
    }
  }, [user, isLoading]);

  // Animated grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawGrain = () => {
      const { width, height } = canvas;
      if (!width || !height) { animId = requestAnimationFrame(drawGrain); return; }
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v; data[i + 1] = v; data[i + 2] = v;
        data[i + 3] = 16;
      }
      ctx.putImageData(imageData, 0, 0);
      animId = requestAnimationFrame(drawGrain);
    };
    drawGrain();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Apply date filter
  const runs = React.useMemo(() => {
    if (filter === 'all') return allRuns;
    const now = new Date();
    const cutoff = new Date();
    if (filter === '7d') cutoff.setDate(now.getDate() - 7);
    if (filter === '30d') cutoff.setDate(now.getDate() - 30);
    if (filter === '90d') cutoff.setDate(now.getDate() - 90);
    return allRuns.filter(r => new Date(r.start_time || r.created_date) >= cutoff);
  }, [allRuns, filter]);

  const totalKm    = runs.reduce((s, r) => s + (r.distance_km || 0), 0);
  const totalSec   = runs.reduce((s, r) => s + (r.duration_seconds ?? r.duration_sec ?? 0), 0);
  const totalCoins = runs.reduce((s, r) => s + (r.tokens_earned || 0), 0);

  const FILTERS = [
    { key: 'all', label: 'All Time' },
    { key: '7d',  label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ];

  return (
    <div style={S.root}>

      {/* ── Background (pointer-events: none — never blocks taps) ── */}
      <div style={S.bg}>
        <canvas ref={canvasRef} style={S.grain} />
        <div style={S.glowPurple} />
        <div style={S.glowLime} />
        <div style={S.glowBottom} />
        <div style={S.scanlines} />
      </div>

      {/* ── Foreground content ── */}
      <div style={S.page}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.headerRow}>
            <span style={S.dot} />
            <h1 style={S.title}>Run History</h1>
          </div>

          {/* Filter pills */}
          <div style={S.filterRow}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{ ...S.pill, ...(filter === f.key ? S.pillActive : {}) }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary card */}
        {allRuns.length > 0 && (
          <div style={S.summaryCard}>
            <div style={S.summaryLabel}>{FILTERS.find(f => f.key === filter)?.label} Summary</div>
            <div style={S.summaryGrid}>
              <div style={S.summaryItem}>
                <div style={S.summaryVal}>{runs.length}</div>
                <div style={S.summaryKey}>Runs</div>
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryVal}>{totalKm.toFixed(1)}</div>
                <div style={S.summaryKey}>km</div>
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryVal}>{fmtDuration(totalSec)}</div>
                <div style={S.summaryKey}>Time</div>
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryVal}>{avgPaceStr(runs)}</div>
                <div style={S.summaryKey}>Avg pace</div>
              </div>
            </div>
            <div style={S.summaryCoins}>
              <span style={S.coinsVal}>⚡ {totalCoins.toFixed(1)} BX</span>
              <span style={S.coinsLbl}>earned</span>
            </div>
          </div>
        )}

        {/* Run list */}
        {runsLoading ? (
          <div style={S.loading}>Loading runs…</div>
        ) : runs.length > 0 ? (
          <div className="runList" style={{ padding: '0 16px 96px' }}>
            {runs.map(run => <RunCard key={run.id} run={run} />)}
          </div>
        ) : (
          /* Empty state */
          <div style={S.emptyState}>
            <div style={S.emptyHeadline}>
              <div style={S.emptyLine1}>ZERO KM.</div>
              <div style={S.emptyLine2}>ZERO<br />EXCUSES.</div>
            </div>
            <p style={S.emptyText}>Every kilometer creates value.<br /><span style={S.emptyAccent}>Start moving.</span></p>
            <button
              style={S.goBtn}
              onClick={() => navigate(createPageUrl('ActiveRun'))}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = hoverShadow; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = baseShadow; }}
            >
              GO RUN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const baseShadow  = '0 0 40px rgba(191,255,0,0.45), 0 8px 32px rgba(0,0,0,0.6)';
const hoverShadow = '0 0 60px rgba(191,255,0,0.65), 0 12px 40px rgba(0,0,0,0.7)';

const S = {
  root: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#07070A',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    // NO overflow:hidden – breaks fixed nav
    // NO transform    – creates stacking context that breaks fixed nav
  },

  /* ── Single background block, never intercepts taps ── */
  bg: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  grain: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none', zIndex: 0,
    opacity: 1, mixBlendMode: 'overlay',
  },
  glowPurple: {
    position: 'absolute', top: '-10%', left: '-15%',
    width: '70vw', height: '70vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(138,43,226,0.22) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },
  glowLime: {
    position: 'absolute', bottom: '5%', right: '-10%',
    width: '55vw', height: '55vw', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,255,0,0.14) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },
  glowBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30vh',
    background: 'linear-gradient(to top, rgba(138,43,226,0.12) 0%, transparent 100%)',
    pointerEvents: 'none', zIndex: 0,
  },
  scanlines: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
    pointerEvents: 'none', zIndex: 0, opacity: 0.6,
  },

  /* ── Foreground ── */
  page: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 480,
    margin: '0 auto',
    paddingBottom: 96, // clears fixed bottom nav
  },

  /* Header */
  header: {
    padding: '56px 20px 16px',
  },
  headerRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  dot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    backgroundColor: '#BFFF00', boxShadow: '0 0 10px rgba(191,255,0,0.8)',
    flexShrink: 0,
  },
  title: {
    margin: 0, fontSize: 26, fontWeight: 900, color: '#fff',
    letterSpacing: '-0.02em',
  },

  /* Filter pills */
  filterRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
  },
  pill: {
    padding: '6px 14px', borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  pillActive: {
    background: 'rgba(191,255,0,0.12)',
    border: '1px solid rgba(191,255,0,0.40)',
    color: '#BFFF00',
    boxShadow: '0 0 12px rgba(191,255,0,0.15)',
  },

  /* Summary card */
  summaryCard: {
    margin: '0 16px 20px',
    padding: '18px 20px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 0 24px rgba(138,43,226,0.10)',
  },
  summaryLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
    color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', marginBottom: 14,
  },
  summaryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14,
  },
  summaryItem: {
    textAlign: 'center',
  },
  summaryVal: {
    fontSize: 20, fontWeight: 900, color: '#BFFF00',
    textShadow: '0 0 12px rgba(191,255,0,0.4)',
  },
  summaryKey: {
    fontSize: 10, color: 'rgba(255,255,255,0.40)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2,
  },
  summaryCoins: {
    display: 'flex', alignItems: 'center', gap: 8,
    paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  coinsVal: {
    fontSize: 14, fontWeight: 800, color: '#fff',
  },
  coinsLbl: {
    fontSize: 11, color: 'rgba(255,255,255,0.40)',
  },

  /* Loading */
  loading: {
    textAlign: 'center', padding: '60px 0',
    color: 'rgba(255,255,255,0.30)', fontSize: 13, letterSpacing: '0.1em',
  },

  /* Empty state */
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '60px 24px',
  },
  emptyHeadline: { marginBottom: 24 },
  emptyLine1: {
    fontSize: 'clamp(40px,12vw,72px)', fontWeight: 900, lineHeight: 0.95,
    letterSpacing: '-0.03em', color: '#fff',
  },
  emptyLine2: {
    fontSize: 'clamp(40px,12vw,72px)', fontWeight: 900, lineHeight: 0.95,
    letterSpacing: '-0.03em', color: '#BFFF00',
    textShadow: '0 0 40px rgba(191,255,0,0.4)',
  },
  emptyText: {
    margin: '0 0 32px', fontSize: 15, lineHeight: 1.65,
    color: 'rgba(255,255,255,0.45)',
  },
  emptyAccent: { color: 'rgba(255,255,255,0.80)', fontWeight: 600 },
  goBtn: {
    padding: '16px 48px', borderRadius: 999,
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A', fontSize: 15, fontWeight: 900,
    letterSpacing: '0.14em', border: 'none', cursor: 'pointer',
    boxShadow: baseShadow, transition: 'box-shadow 0.2s, transform 0.2s',
    textTransform: 'uppercase',
  },
};
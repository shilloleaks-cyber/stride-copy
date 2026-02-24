import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatPace = (paceMinPerKm) => {
  const p = Number(paceMinPerKm);
  if (!Number.isFinite(p) || p <= 0) return '--:--';
  let mins = Math.floor(p);
  let secs = Math.round((p - mins) * 60);
  if (secs === 60) { mins += 1; secs = 0; }
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const getPace = (run) => {
  if (run.pace_min_per_km) return run.pace_min_per_km;
  const dist = Number(run.distance_km);
  const secs = Number(run.duration_sec ?? run.duration_seconds);
  if (dist > 0 && secs > 0) return (secs / 60) / dist;
  return null;
};

export default function RunSummary() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const runId = params.get('id');

  const { data: runs, isLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => base44.entities.Runs.filter({ id: runId }),
    enabled: !!runId,
  });

  const run = runs?.[0];

  const dateStr = run?.start_time
    ? format(new Date(run.start_time), 'EEEE, MMMM d yyyy')
    : run?.created_date
    ? format(new Date(run.created_date), 'EEEE, MMMM d yyyy')
    : '—';

  const timeStr = run?.start_time
    ? format(new Date(run.start_time), 'h:mm a')
    : run?.created_date
    ? format(new Date(run.created_date), 'h:mm a')
    : '—';

  const pace = run ? getPace(run) : null;
  const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;

  const stats = run ? [
    { icon: '📍', label: 'Distance', value: `${(run.distance_km || 0).toFixed(2)} km` },
    { icon: '⏱', label: 'Duration', value: formatDuration(durSec) },
    { icon: '⚡', label: 'Pace', value: `${formatPace(pace)} /km` },
    { icon: '🪙', label: 'BX Earned', value: run.tokens_earned != null ? `${run.tokens_earned} BX` : '—' },
  ] : [];

  return (
    <div style={s.root}>
      <div style={s.glowPurple} />
      <div style={s.glowLime} />

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} color="#BFFF00" />
        </button>
        <span style={s.headerTitle}>RUN SUMMARY</span>
        <div style={{ width: 40 }} />
      </div>

      {isLoading && (
        <div style={s.center}>
          <div style={s.loadingDot} />
        </div>
      )}

      {!isLoading && !run && (
        <div style={s.center}>
          <p style={s.notFound}>Run not found.</p>
          <button style={s.goBackBtn} onClick={() => navigate(createPageUrl('History'))}>← Back to History</button>
        </div>
      )}

      {!isLoading && run && (
        <div style={s.content}>
          {/* Date */}
          <div style={s.dateBlock}>
            <div style={s.dateText}>{dateStr}</div>
            <div style={s.timeText}>{timeStr}</div>
          </div>

          {/* Divider */}
          <div style={s.divider} />

          {/* Stats grid */}
          <div style={s.grid}>
            {stats.map((st) => (
              <div key={st.label} style={s.statCard}>
                <div style={s.statIcon}>{st.icon}</div>
                <div style={s.statValue}>{st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div style={s.tagline}>RUN · EARN · EVOLVE</div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#07070A',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 100,
  },
  glowPurple: {
    position: 'absolute',
    top: '-10%', left: '-15%',
    width: '70vw', height: '70vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(138,43,226,0.20) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  glowLime: {
    position: 'absolute',
    bottom: '5%', right: '-10%',
    width: '55vw', height: '55vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,255,0,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '56px 20px 20px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.28em',
    color: 'rgba(255,255,255,0.35)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    padding: '24px 20px',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  dateBlock: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 22,
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.01em',
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, rgba(191,255,0,0.3), rgba(138,43,226,0.3))',
    marginBottom: 28,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 40,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: { fontSize: 26 },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#BFFF00',
    textShadow: '0 0 20px rgba(191,255,0,0.4)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.16em',
    color: 'rgba(255,255,255,0.40)',
    textTransform: 'uppercase',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.35em',
    color: 'rgba(255,255,255,0.15)',
  },
  center: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    zIndex: 10,
    position: 'relative',
  },
  notFound: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    marginBottom: 20,
  },
  goBackBtn: {
    background: 'none',
    border: '1px solid rgba(191,255,0,0.3)',
    color: '#BFFF00',
    padding: '10px 24px',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  loadingDot: {
    width: 12, height: 12,
    borderRadius: '50%',
    backgroundColor: '#BFFF00',
    boxShadow: '0 0 16px rgba(191,255,0,0.8)',
  },
};
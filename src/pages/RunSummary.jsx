import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import RouteMap from '../components/running/RouteMap';

const fmt2 = (n) => Number(n || 0).toFixed(2);

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = Math.round(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const formatPace = (p) => {
  const n = Number(p);
  if (!Number.isFinite(n) || n <= 0) return '--:--';
  let mins = Math.floor(n);
  let secs = Math.round((n - mins) * 60);
  if (secs === 60) { mins += 1; secs = 0; }
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const getPace = (run) => {
  if (run?.pace_min_per_km) return run.pace_min_per_km;
  const dist = Number(run?.distance_km);
  const secs = Number(run?.duration_sec ?? run?.duration_seconds);
  if (dist > 0 && secs > 0) return (secs / 60) / dist;
  return null;
};

export default function RunSummary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const runId = params.get('id');

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [localClaimed, setLocalClaimed] = useState(null); // override after claim

  const { data: runs, isLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => base44.entities.Runs.filter({ id: runId }),
    enabled: !!runId,
  });

  const { data: walletLogs } = useQuery({
    queryKey: ['walletLog', runId],
    queryFn: () => base44.entities.WalletLog.filter({ run_id: runId, source_type: 'run' }),
    enabled: !!runId,
  });

  const run = runs?.[0];

  // Parse breakdown from WalletLog.note
  let breakdown = { distance: 0, streak: 0, daily: 0 };
  if (walletLogs?.length > 0) {
    try {
      const parsed = JSON.parse(walletLogs[0].note || '{}');
      breakdown = {
        distance: parsed.distance ?? parsed.base_reward ?? 0,
        streak: parsed.streak ?? 0,
        daily: parsed.daily ?? 0,
      };
    } catch (_) {}
  }

  const isClaimed = localClaimed !== null ? localClaimed : run?.reward_claimed === true;

  const dateStr = run?.start_time
    ? format(new Date(run.start_time), 'EEEE, MMMM d')
    : null;
  const timeStr = run?.start_time
    ? format(new Date(run.start_time), 'h:mm a')
    : null;

  const durSec = run?.duration_sec ?? run?.duration_seconds ?? 0;
  const pace = getPace(run);

  const handleClaim = async () => {
    setClaimError('');
    setClaiming(true);
    try {
      // Re-fetch to guard double-claim
      const fresh = await base44.entities.Runs.filter({ id: runId });
      const freshRun = fresh?.[0];
      if (!freshRun || freshRun.reward_claimed === true) {
        setLocalClaimed(true);
        return;
      }

      const duration_sec = freshRun.duration_sec ?? freshRun.duration_seconds ?? 0;

      // Guard: too short
      if ((freshRun.distance_km || 0) < 0.1 || duration_sec <= 0) {
        setClaimError('Run too short to claim reward.');
        return;
      }

      const res = await base44.functions.invoke('finishRun', {
        run_id: runId,
        distance_km: freshRun.distance_km,
        duration_sec,
      });

      await base44.entities.Runs.update(runId, {
        reward_claimed: true,
        tokens_earned: res.data?.tokens_earned ?? freshRun.tokens_earned,
        status: 'completed',
      });

      setLocalClaimed(true);
      queryClient.invalidateQueries({ queryKey: ['run', runId] });
      queryClient.invalidateQueries({ queryKey: ['walletLog', runId] });
    } catch (e) {
      setClaimError(e.message || 'Something went wrong.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.glowPurple} />
      <div style={s.glowLime} />

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} color="#BFFF00" />
        </button>
        <div>
          <div style={s.headerLabel}>COMPLETED RUN</div>
          {dateStr && <div style={s.headerDate}>{dateStr}</div>}
          {timeStr && <div style={s.headerTime}>{timeStr}</div>}
        </div>
        <div style={{ width: 40 }} />
      </div>

      {isLoading && (
        <div style={s.center}>
          <div style={s.loadingPulse} />
        </div>
      )}

      {!isLoading && !run && (
        <div style={s.center}>
          <p style={s.notFoundText}>Run not found.</p>
          <button style={s.outlineBtn} onClick={() => navigate(createPageUrl('History'))}>
            ← Back to History
          </button>
        </div>
      )}

      {!isLoading && run && (
        <div style={s.content}>

          {/* Quote block */}
          <div style={s.quoteCard}>
            <div style={s.quoteLabel}>🔥 Today's vibe</div>
            <div style={s.quoteText}>
              "{run.quote_text || 'No excuses. Just progress.'}"
            </div>
          </div>

          {/* BX Earned card */}
          <div style={s.earnCard}>
            <div style={s.earnRow}>
              <span style={s.earnTitle}>BX EARNED</span>
              <span style={isClaimed ? s.badgeClaimed : s.badgePending}>
                {isClaimed ? '✓ CLAIMED' : '⏳ PENDING'}
              </span>
            </div>

            <div style={s.bigNumber}>
              🪙 {fmt2(run.tokens_earned)}
            </div>

            <div style={s.breakdownRow}>
              <span style={s.bItem}>Dist <span style={s.bVal}>+{fmt2(breakdown.distance)}</span></span>
              <span style={s.bSep}>|</span>
              <span style={s.bItem}>Streak <span style={s.bVal}>+{fmt2(breakdown.streak)}</span></span>
              <span style={s.bSep}>|</span>
              <span style={s.bItem}>Daily <span style={s.bVal}>+{fmt2(breakdown.daily)}</span></span>
            </div>

            {/* Claim button */}
            {!isClaimed && (
              <button
                style={{ ...s.claimBtn, opacity: claiming ? 0.6 : 1 }}
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? 'Processing…' : 'Claim Reward'}
              </button>
            )}

            {isClaimed && (
              <div style={s.claimedRow}>✅ Claimed</div>
            )}

            {claimError && <div style={s.errorText}>{claimError}</div>}
          </div>

          {/* Run stats */}
          <div style={s.statsGrid}>
            {[
              { icon: '📍', label: 'Distance', value: `${fmt2(run.distance_km)} km` },
              { icon: '⏱', label: 'Duration', value: formatDuration(durSec) },
              { icon: '⚡', label: 'Pace', value: `${formatPace(pace)} /km` },
              { icon: '❤', label: 'Avg HR', value: run.avg_heart_rate ? `${run.avg_heart_rate} bpm` : '—' },
            ].map(st => (
              <div key={st.label} style={s.statCard}>
                <span style={s.statIcon}>{st.icon}</span>
                <span style={s.statVal}>{st.value}</span>
                <span style={s.statLbl}>{st.label}</span>
              </div>
            ))}
          </div>

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
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '52px 20px 20px',
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
    marginBottom: 6,
  },
  headerDate: {
    fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1,
  },
  headerTime: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4,
  },
  content: {
    position: 'relative', zIndex: 10,
    padding: '16px 16px 0',
    maxWidth: 480, width: '100%', margin: '0 auto',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  quoteCard: {
    background: 'linear-gradient(135deg, rgba(138,43,226,0.18) 0%, rgba(191,255,0,0.06) 100%)',
    border: '1px solid rgba(138,43,226,0.30)',
    borderRadius: 18, padding: '16px 18px',
  },
  quoteLabel: { fontSize: 12, color: 'rgba(255,255,255,0.50)', marginBottom: 6 },
  quoteText: {
    fontSize: 16, fontWeight: 700,
    color: '#BFFF00',
    textShadow: '0 0 20px rgba(191,255,0,0.35)',
    lineHeight: 1.4,
  },
  earnCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20, padding: '18px 18px 14px',
  },
  earnRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  earnTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.20em',
    color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase',
  },
  badgePending: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    color: 'rgba(255,200,0,0.85)',
    background: 'rgba(255,200,0,0.10)',
    border: '1px solid rgba(255,200,0,0.25)',
    borderRadius: 999, padding: '3px 10px',
  },
  badgeClaimed: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    color: 'rgba(80,220,120,0.90)',
    background: 'rgba(80,220,120,0.10)',
    border: '1px solid rgba(80,220,120,0.25)',
    borderRadius: 999, padding: '3px 10px',
  },
  bigNumber: {
    fontSize: 48, fontWeight: 900, color: '#BFFF00',
    textShadow: '0 0 40px rgba(191,255,0,0.45)',
    textAlign: 'center', marginBottom: 10,
  },
  breakdownRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 16,
  },
  bItem: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  bVal: { color: '#BFFF00', fontWeight: 700 },
  bSep: { color: 'rgba(255,255,255,0.20)', fontSize: 13 },
  claimBtn: {
    width: '100%', padding: '15px 0',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #BFFF00 0%, #8FD400 100%)',
    color: '#07070A', fontSize: 15, fontWeight: 900,
    letterSpacing: '0.12em', border: 'none', cursor: 'pointer',
    boxShadow: '0 0 30px rgba(191,255,0,0.35)',
    transition: 'opacity 0.2s',
    textTransform: 'uppercase',
  },
  claimedRow: {
    textAlign: 'center', padding: '13px 0',
    color: 'rgba(80,220,120,0.80)',
    fontSize: 15, fontWeight: 700,
    background: 'rgba(80,220,120,0.07)',
    borderRadius: 999, border: '1px solid rgba(80,220,120,0.20)',
  },
  errorText: {
    textAlign: 'center', marginTop: 10,
    color: 'rgba(255,90,90,0.85)', fontSize: 13,
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '16px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
  },
  statIcon: { fontSize: 22 },
  statVal: { fontSize: 20, fontWeight: 800, color: '#FFFFFF' },
  statLbl: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
  },
  tagline: {
    textAlign: 'center', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.35em', color: 'rgba(255,255,255,0.12)',
    paddingTop: 8,
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 40, zIndex: 10, position: 'relative',
  },
  notFoundText: { color: 'rgba(255,255,255,0.45)', fontSize: 16, marginBottom: 20 },
  outlineBtn: {
    background: 'none', border: '1px solid rgba(191,255,0,0.3)',
    color: '#BFFF00', padding: '10px 24px', borderRadius: 999,
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  loadingPulse: {
    width: 12, height: 12, borderRadius: '50%',
    backgroundColor: '#BFFF00', boxShadow: '0 0 16px rgba(191,255,0,0.8)',
  },
};
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Camera, Search, Loader2, ShieldOff,
  ScanLine, Keyboard, History, XCircle, AlertCircle
} from 'lucide-react';
import QRScanner from '@/components/stride/QRScanner';
import ClaimResultCard from '@/components/sponsorclaim/ClaimResultCard';
import ClaimSuccessOverlay from '@/components/sponsorclaim/ClaimSuccessOverlay';
import ClaimHistory from '@/components/sponsorclaim/ClaimHistory';

const TABS = ['scan', 'manual', 'history'];
const S = {
  IDLE: 'idle', SEARCHING: 'searching',
  FOUND: 'found',
  NOT_FOUND: 'not_found', NOT_CONFIRMED: 'not_confirmed',
  NO_REWARD: 'no_reward',
  SUCCESS: 'success',
};

export default function SponsorClaim() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const [tab, setTab] = useState('scan');
  const [input, setInput] = useState('');
  const [state, setState] = useState(S.IDLE);
  const [showScanner, setShowScanner] = useState(false);
  const [successData, setSuccessData] = useState(null); // { reg, reward, claimedAt }

  // Lookup results
  const [foundReg, setFoundReg] = useState(null);
  const [foundEvent, setFoundEvent] = useState(null);
  const [foundCat, setFoundCat] = useState(null);
  const [foundReward, setFoundReward] = useState(null);
  const [foundClaimLog, setFoundClaimLog] = useState(null);

  // Auth
  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: boothStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['my-booth-staff', user?.email],
    queryFn: () => base44.entities.BoothStaff.filter({ user_id: user.email, is_active: true }),
    enabled: !!user?.email && user?.role !== 'admin',
  });
  const isAdmin = user?.role === 'admin';
  const isLoadingAccess = loadingUser || (!isAdmin && loadingStaff);
  const hasAccess = isAdmin || boothStaff.length > 0;

  // ── Lookup ──────────────────────────────────────────────────────────────────
  const lookup = async (q) => {
    q = (q || input).trim();
    if (!q) return;
    setState(S.SEARCHING);
    setFoundReg(null); setFoundEvent(null); setFoundCat(null);
    setFoundReward(null); setFoundClaimLog(null);

    // Find registration by QR or bib
    let regs = await base44.entities.EventRegistration.filter({ qr_code: q });
    if (!regs.length) regs = await base44.entities.EventRegistration.filter({ bib_number: q.toUpperCase() });
    if (!regs.length) { setState(S.NOT_FOUND); return; }

    const reg = regs[0];

    // BUG FIX: block RSVP-only registrations — sponsor rewards are for official race participants
    if (reg.category_id === 'rsvp') {
      setFoundReg(reg);
      setState(S.NOT_CONFIRMED);
      return;
    }

    if (reg.status !== 'confirmed') { setFoundReg(reg); setState(S.NOT_CONFIRMED); return; }

    // Parallel: fetch event, category, active sponsor rewards, existing claim log
    const [evs, cats, rewards, claimLogs] = await Promise.all([
      base44.entities.StrideEvent.filter({ id: reg.event_id }),
      reg.category_id && reg.category_id !== 'rsvp'
        ? base44.entities.EventCategory.filter({ id: reg.category_id })
        : Promise.resolve([]),
      base44.entities.SponsorReward.filter({ event_id: reg.event_id, is_active: true }),
      base44.entities.RewardClaimLog.filter({ registration_id: reg.id }),
    ]);

    setFoundReg(reg);
    setFoundEvent(evs[0] || null);
    setFoundCat(cats[0] || null);

    // Filter rewards by eligible_categories:
    // empty/missing → all categories allowed; otherwise must include reg.category_id
    const eligibleRewards = rewards.filter(r =>
      !r.eligible_categories?.length ||
      r.eligible_categories.includes(reg.category_id)
    );

    if (!eligibleRewards.length) {
      setFoundReg(reg);
      setFoundEvent(evs[0] || null);
      setFoundCat(cats[0] || null);
      setState(S.NO_REWARD);
      return;
    }

    const reward = eligibleRewards[0];
    setFoundReward(reward);

    // Check if already claimed for this reward
    const existing = claimLogs.find(l => l.reward_id === reward.id) || null;
    setFoundClaimLog(existing);

    setState(S.FOUND);
  };

  const handleQRScan = (value) => {
    setShowScanner(false);
    setInput(value);
    setTab('manual');
    lookup(value);
  };

  // ── Claim ────────────────────────────────────────────────────────────────────
  // BUG FIX: capture refs at mutation time, not closure time, to guard against
  // stale state if the user somehow triggers a second lookup during the in-flight request.
  const claimMutation = useMutation({
    mutationFn: async ({ reg, reward, staffEmail }) => {
      const now = new Date().toISOString();

      // Server-side race-condition guard: re-fetch before writing
      const existing = await base44.entities.RewardClaimLog.filter({ registration_id: reg.id });
      if (reward && existing.find(l => l.reward_id === reward.id)) {
        throw new Error('already_claimed');
      }

      await base44.entities.RewardClaimLog.create({
        registration_id: reg.id,
        reward_id: reward?.id || '',
        event_id: reg.event_id,
        user_email: reg.user_email,
        first_name: reg.first_name,
        last_name: reg.last_name,
        bib_number: reg.bib_number || '',
        reward_name: reward?.reward_name || 'Reward',
        sponsor_name: reward?.sponsor_name || '',
        claimed_at: now,
        claimed_by_staff: staffEmail,
      });

      // Increment claimed_count on the reward
      if (reward) {
        await base44.entities.SponsorReward.update(reward.id, {
          claimed_count: (reward.claimed_count || 0) + 1,
        });
      }

      return { now, reg, reward };
    },
    onSuccess: ({ now, reg, reward }) => {
      queryClient.invalidateQueries({ queryKey: ['reward-claim-logs-recent'] });
      setSuccessData({ reg, reward, claimedAt: now });
      setState(S.SUCCESS);
    },
    onError: (err) => {
      if (err.message === 'already_claimed') {
        setFoundClaimLog({ claimed_at: new Date().toISOString() });
      }
    },
  });

  const handleReset = () => {
    setInput('');
    setState(S.IDLE);
    setFoundReg(null); setFoundEvent(null); setFoundCat(null);
    setFoundReward(null); setFoundClaimLog(null);
    setSuccessData(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSuccessDismiss = () => {
    setSuccessData(null);
    handleReset();
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'scan') setShowScanner(true);
    if (t === 'manual') setTimeout(() => inputRef.current?.focus(), 80);
  };

  if (isLoadingAccess) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 pt-10 pb-4 flex items-center gap-4"
        style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
          <h1 className="text-xl font-bold">Sponsor Claim</h1>
        </div>
      </div>

      {/* No access */}
      {!hasAccess && (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center space-y-4">
          <ShieldOff className="w-14 h-14" style={{ color: 'rgba(255,80,80,0.5)' }} />
          <p className="text-xl font-bold">Access Denied</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You need staff or admin access to use Sponsor Claim.</p>
          <button onClick={() => navigate(-1)} className="mt-4 py-3 px-8 rounded-2xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            Go Back
          </button>
        </div>
      )}

      {hasAccess && (
        <div className="px-5 pt-6 space-y-4">

          {/* ── Scan / Manual input ─────────────────────────────────────── */}
          {tab !== 'history' && state !== S.SUCCESS && (
            <>
              {/* Camera CTA */}
              {state === S.IDLE && (
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{ background: '#BFFF00', color: '#0A0A0A', boxShadow: '0 0 30px rgba(191,255,0,0.2)' }}
                >
                  <Camera className="w-6 h-6" /> Scan QR with Camera
                </button>
              )}
              {state !== S.IDLE && (
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'rgba(191,255,0,0.08)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
                >
                  <Camera className="w-4 h-4" /> Scan Again
                </button>
              )}

              {/* Manual input */}
              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>— or enter manually —</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && state !== S.SEARCHING && lookup()}
                  placeholder="Enter Bib or QR code..."
                  className="w-full px-5 py-4 rounded-2xl text-center text-white font-bold text-xl tracking-wider outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}
                />
                <button
                  onClick={() => lookup()}
                  disabled={state === S.SEARCHING || !input.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={input.trim() && state !== S.SEARCHING
                    ? { background: '#BFFF00', color: '#0A0A0A' }
                    : { background: 'rgba(191,255,0,0.12)', color: 'rgba(255,255,255,0.25)' }
                  }
                >
                  {state === S.SEARCHING
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                    : <><Search className="w-5 h-5" /> Find Participant</>
                  }
                </button>
              </div>
            </>
          )}

          {/* ── Error states ─────────────────────────────────────────────── */}
          {state === S.NOT_FOUND && (
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)' }}>
              <XCircle className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,100,100,1)' }} />
              <div>
                <p className="font-bold text-white text-base">Not Found</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>No registration matches this QR code or bib number.</p>
              </div>
            </div>
          )}

          {state === S.NOT_CONFIRMED && foundReg && (
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <AlertCircle className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,200,80,1)' }} />
              <div>
                <p className="font-bold text-white text-base">
                  {foundReg.category_id === 'rsvp' ? 'RSVP Only — Not Eligible' : 'Registration Not Confirmed'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {foundReg.category_id === 'rsvp'
                    ? `${foundReg.first_name} ${foundReg.last_name} is a community RSVP, not a race registrant. Sponsor rewards are for official race participants only.`
                    : `${foundReg.first_name} ${foundReg.last_name}'s registration is `}
                  {foundReg.category_id !== 'rsvp' && (
                    <><span className="font-bold capitalize">{foundReg.status}</span>. Only confirmed registrations can claim rewards.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── Result card ──────────────────────────────────────────────── */}
          {state === S.FOUND && foundReg && (
            <ClaimResultCard
              reg={foundReg}
              event={foundEvent}
              category={foundCat}
              reward={foundReward}
              claimLog={foundClaimLog}
              onClaim={() => claimMutation.mutate({ reg: foundReg, reward: foundReward, staffEmail: user.email })}
              isClaiming={claimMutation.isPending}
            />
          )}

          {/* Reset link for error states */}
          {[S.NOT_FOUND, S.NOT_CONFIRMED, S.FOUND].includes(state) && (
            <button onClick={handleReset} className="w-full text-center text-sm font-semibold py-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Try a different code
            </button>
          )}

          {/* ── History tab ──────────────────────────────────────────────── */}
          {tab === 'history' && <ClaimHistory />}
        </div>
      )}

      {/* ── Bottom navigation ─────────────────────────────────────────────── */}
      {hasAccess && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3"
          style={{ backgroundColor: 'rgba(10,10,10,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', zIndex: 50 }}
        >
          <div
            className="flex rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { key: 'scan', icon: ScanLine, label: 'Scan' },
              { key: 'manual', icon: Keyboard, label: 'Manual' },
              { key: 'history', icon: History, label: 'History' },
            ].map(({ key, icon: Icon, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
                  style={active
                    ? { background: '#BFFF00', color: '#0A0A0A' }
                    : { color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Scanner overlay */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Success overlay */}
      {successData && (
        <ClaimSuccessOverlay
          reg={successData.reg}
          reward={successData.reward}
          claimedAt={successData.claimedAt}
          onDismiss={handleSuccessDismiss}
        />
      )}
    </div>
  );
}
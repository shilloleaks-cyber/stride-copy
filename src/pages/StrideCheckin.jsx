import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, CheckCircle2, XCircle,
  AlertCircle, Loader2, ShieldOff, CreditCard, Hash, Calendar, Camera, ScanLine, Clock, UserX, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import QRScanner from '@/components/stride/QRScanner';

// ─── State keys ───────────────────────────────────────────────────────────────
const S = {
  IDLE:      'idle',
  SEARCHING: 'searching',
  RESULTS:   'results',    // multiple matches — show list to pick from
  READY:     'ready',      // confirmed + payment ok + not yet checked in
  ALREADY:   'already',    // checked_in === true
  PAYMENT:   'payment',    // confirmed but payment not approved
  BLOCKED:   'blocked',    // rejected / cancelled / not confirmed
  NOT_FOUND: 'not_found',
  SUCCESS:   'success',
};

// ─── Payment label helper ─────────────────────────────────────────────────────
function getPayLabel(payment_status, hasSlip) {
  if (payment_status === 'paid')         return { label: 'Payment Approved',          color: 'rgb(0,210,110)',       bg: 'rgba(0,210,110,0.12)',   border: 'rgba(0,210,110,0.3)' };
  if (payment_status === 'not_required') return { label: 'No Payment Required',       color: '#BFFF00',              bg: 'rgba(191,255,0,0.12)',   border: 'rgba(191,255,0,0.3)' };
  if (payment_status === 'pending' && hasSlip)
                                         return { label: 'Awaiting Payment Approval', color: 'rgb(255,140,0)',       bg: 'rgba(255,140,0,0.12)',   border: 'rgba(255,140,0,0.3)' };
  if (payment_status === 'pending')      return { label: 'Awaiting Payment',          color: 'rgba(255,200,80,1)',   bg: 'rgba(255,200,80,0.12)', border: 'rgba(255,200,80,0.3)' };
  if (payment_status === 'refunded')     return { label: 'Refunded',                  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' };
  return                                        { label: payment_status || '—',       color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: valueColor || 'rgba(255,255,255,0.9)', margin: '2px 0 0', wordBreak: 'break-all' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Search score — higher = better match ─────────────────────────────────────
function scoreReg(reg, q) {
  const ql = q.toLowerCase();
  if (reg.bib_number?.toLowerCase() === ql)   return 100;
  if (reg.user_email?.toLowerCase() === ql)   return 80;
  const fullName = `${reg.first_name} ${reg.last_name}`.toLowerCase();
  if (fullName === ql)                         return 60;
  if (fullName.includes(ql))                  return 40;
  if (reg.user_email?.toLowerCase().includes(ql)) return 20;
  return 0;
}

// ─── Result row card ──────────────────────────────────────────────────────────
function ResultRow({ reg, catMap, onClick }) {
  const cat = catMap[reg.category_id];
  const payInfo = getPayLabel(reg.payment_status, false);

  const statusStyle = {
    confirmed:  { color: 'rgb(0,210,110)',       bg: 'rgba(0,210,110,0.1)' },
    pending:    { color: 'rgba(255,200,80,1)',   bg: 'rgba(255,200,80,0.1)' },
    rejected:   { color: 'rgba(255,100,100,1)', bg: 'rgba(255,80,80,0.1)' },
    cancelled:  { color: 'rgba(255,100,100,1)', bg: 'rgba(255,80,80,0.1)' },
  }[reg.status] || { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.12s ease',
      }}
    >
      {/* Bib */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.2)' }}>
          {reg.bib_number || '—'}
        </span>
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>
            {reg.first_name} {reg.last_name}
          </p>
          {reg.checked_in && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: 'rgba(191,255,0,0.1)', color: '#BFFF00' }}>✓ In</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {cat && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{cat.name}</span>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize' }}>
            {reg.status}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: payInfo.bg, color: payInfo.color }}>
            {payInfo.label}
          </span>
        </div>
      </div>

      <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
    </button>
  );
}

// ─── Scan/Search controls — always visible (except SUCCESS) ──────────────────
function ScanControls({ state, input, setInput, onSearch, onScanClick, inputRef }) {
  const isSearching = state === S.SEARCHING;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        onClick={onScanClick}
        style={{ width: '100%', padding: '14px 0', borderRadius: 16, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: '#BFFF00', color: '#0A0A0A', border: 'none' }}
      >
        <Camera style={{ width: 20, height: 20 }} /> Scan QR with Camera
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isSearching && onSearch()}
          placeholder="Bib, name, or email…"
          autoComplete="off"
          style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, outline: 'none' }}
        />
        <button
          onClick={onSearch}
          disabled={isSearching || !input.trim()}
          style={{
            padding: '12px 18px', borderRadius: 14, fontWeight: 800, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            cursor: isSearching || !input.trim() ? 'not-allowed' : 'pointer',
            ...(input.trim() && !isSearching
              ? { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }),
          }}
        >
          {isSearching
            ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            : <Search style={{ width: 16, height: 16 }} />
          }
          {isSearching ? '…' : 'Find'}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StrideCheckin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const [input, setInput]             = useState('');
  const [state, setState]             = useState(S.IDLE);
  const [results, setResults]         = useState([]);   // list for RESULTS state
  const [catMap, setCatMap]           = useState({});   // id → category for list
  const [foundReg, setFoundReg]       = useState(null);
  const [foundEvent, setFoundEvent]   = useState(null);
  const [foundCat, setFoundCat]       = useState(null);
  const [hasSlip, setHasSlip]         = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: boothStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['my-booth-staff', user?.email],
    queryFn: () => base44.entities.BoothStaff.filter({ user_id: user.email, is_active: true }),
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const isAdmin = user?.role === 'admin';
  const isLoadingAccess = loadingUser || (!isAdmin && loadingStaff);
  const hasAccess = isAdmin || boothStaff.length > 0;

  // ── Check-in mutation ──────────────────────────────────────────────────────
  const checkinMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await base44.entities.EventRegistration.update(foundReg.id, {
        checked_in: true,
        checked_in_at: now,
        checked_in_by: user.email,
      });
      await base44.entities.EventCheckinLog.create({
        event_id: foundReg.event_id,
        registration_id: foundReg.id,
        user_email: foundReg.user_email,
        bib_number: foundReg.bib_number || '',
        scanned_by: user.email,
        scanned_at: now,
        result: 'success',
      });
      const existingRewards = await base44.entities.EventRewardUnlock.filter({ registration_id: foundReg.id });
      if (existingRewards.length === 0) {
        await base44.entities.EventRewardUnlock.create({
          registration_id: foundReg.id, event_id: foundReg.event_id,
          user_email: foundReg.user_email, reward_type: 'badge',
          reward_label: 'Finisher Badge', status: 'unlocked', unlocked_at: now,
        });
        const eventCoupons = await base44.entities.Coupon.filter({ event_id: foundReg.event_id });
        for (const coupon of eventCoupons) {
          await base44.entities.EventRewardUnlock.create({
            registration_id: foundReg.id, event_id: foundReg.event_id,
            user_email: foundReg.user_email, reward_type: 'coupon',
            reward_id: coupon.id, reward_label: coupon.title,
            status: 'unlocked', unlocked_at: now,
          });
        }
      }
    },
    onSuccess: () => {
      setState(S.SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    },
  });

  // ── Resolve a single registration into the correct result state ────────────
  const resolveReg = async (reg) => {
    const [evs, cats, payments] = await Promise.all([
      base44.entities.StrideEvent.filter({ id: reg.event_id }),
      reg.category_id && reg.category_id !== 'rsvp'
        ? base44.entities.EventCategory.filter({ id: reg.category_id })
        : Promise.resolve([]),
      reg.payment_status === 'pending'
        ? base44.entities.EventPayment.filter({ registration_id: reg.id })
        : Promise.resolve([]),
    ]);

    setFoundReg(reg);
    setFoundEvent(evs[0] || null);
    setFoundCat(cats[0] || null);
    const slip = payments.length > 0 && !!payments[0]?.slip_image_url;
    setHasSlip(slip);

    if (reg.checked_in) {
      await base44.entities.EventCheckinLog.create({
        event_id: reg.event_id, registration_id: reg.id, user_email: reg.user_email,
        bib_number: reg.bib_number || '', scanned_by: user.email,
        scanned_at: new Date().toISOString(), result: 'already_checked_in',
      });
      setState(S.ALREADY);
      return;
    }
    if (reg.status === 'rejected' || reg.status === 'cancelled' || reg.status !== 'confirmed') {
      setState(S.BLOCKED); return;
    }
    if (reg.payment_status !== 'paid' && reg.payment_status !== 'not_required') {
      setState(S.PAYMENT); return;
    }
    setState(S.READY);
  };

  // ── Main search — QR exact → bib exact → multi-field fuzzy ────────────────
  const handleSearchWithValue = async (q) => {
    q = (q || '').trim();
    if (!q) return;
    setState(S.SEARCHING);
    setFoundReg(null); setFoundEvent(null); setFoundCat(null);
    setHasSlip(false); setResults([]);

    // 1. QR code exact
    let regs = await base44.entities.EventRegistration.filter({ qr_code: q });

    // 2. Bib exact
    if (!regs.length) regs = await base44.entities.EventRegistration.filter({ bib_number: q.toUpperCase() });

    // 3. Broad fetch + client-side filter by name / email
    if (!regs.length) {
      const all = await base44.entities.EventRegistration.list('-created_date', 500);
      const ql = q.toLowerCase();
      regs = all.filter(r =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(ql) ||
        r.user_email?.toLowerCase().includes(ql)
      );
    }

    if (!regs.length) { setState(S.NOT_FOUND); return; }

    // If single exact result, go straight to resolve
    if (regs.length === 1) {
      await resolveReg(regs[0]);
      return;
    }

    // Sort by score descending
    const sorted = [...regs].sort((a, b) => scoreReg(b, q) - scoreReg(a, q));

    // Build a catMap for the result rows
    const catIds = [...new Set(sorted.map(r => r.category_id).filter(Boolean))];
    const cats = await Promise.all(catIds.map(id => base44.entities.EventCategory.filter({ id })));
    const newCatMap = {};
    cats.flat().forEach(c => { newCatMap[c.id] = c; });

    setResults(sorted);
    setCatMap(newCatMap);
    setState(S.RESULTS);
  };

  const handleSearch = ()  => handleSearchWithValue(input);
  const handleQRScan = (v) => { setShowScanner(false); setInput(v); handleSearchWithValue(v); };
  const handleReset  = ()  => {
    setInput(''); setState(S.IDLE);
    setFoundReg(null); setFoundEvent(null); setFoundCat(null);
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (isLoadingAccess) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );

  const payLabelDisplay = foundReg ? getPayLabel(foundReg.payment_status, hasSlip) : null;

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="sticky top-0 z-50 px-5 pt-10 pb-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Stride</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Check-In Scanner</h1>
        </div>
        {state !== S.IDLE && state !== S.SUCCESS && (
          <button onClick={handleReset} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Access denied */}
      {!hasAccess && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 96, paddingLeft: 32, paddingRight: 32, textAlign: 'center', gap: 16 }}>
          <ShieldOff style={{ width: 56, height: 56, color: 'rgba(255,80,80,0.5)' }} />
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Access Denied</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>You need staff or admin access to use check-in.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 8, padding: '12px 32px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none' }}>Go Back</button>
        </div>
      )}

      {hasAccess && (
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Always-visible scan/search controls */}
          {state !== S.SUCCESS && (
            <ScanControls
              state={state}
              input={input}
              setInput={setInput}
              onSearch={handleSearch}
              onScanClick={() => setShowScanner(true)}
              inputRef={inputRef}
            />
          )}

          {/* ── IDLE ── */}
          {state === S.IDLE && (
            <div style={{ textAlign: 'center', padding: '32px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <ScanLine style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.12)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Scan a QR code or search by bib, name, or email</p>
            </div>
          )}

          {/* ── NOT FOUND ── */}
          {state === S.NOT_FOUND && (
            <div style={{ borderRadius: 20, padding: 20, background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,80,80,0.25)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,80,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle style={{ width: 20, height: 20, color: 'rgba(255,100,100,1)' }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>No Participant Found</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>No registration matches this bib, name, or email. Double-check and try again.</p>
              </div>
            </div>
          )}

          {/* ── RESULTS LIST ── */}
          {state === S.RESULTS && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {results.length} result{results.length !== 1 ? 's' : ''} — tap to select
              </p>
              {results.map(reg => (
                <ResultRow
                  key={reg.id}
                  reg={reg}
                  catMap={catMap}
                  onClick={async () => {
                    setState(S.SEARCHING);
                    await resolveReg(reg);
                  }}
                />
              ))}
            </div>
          )}

          {/* ── BLOCKED ── */}
          {state === S.BLOCKED && foundReg && (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,80,80,0.3)', background: 'rgba(255,60,60,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <UserX style={{ width: 22, height: 22, color: 'rgba(255,100,100,1)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Registration Not Eligible</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,100,100,0.7)', margin: '3px 0 0' }}>
                    Status: <span style={{ fontWeight: 800, textTransform: 'capitalize' }}>{foundReg.status}</span> — not eligible for check-in.
                  </p>
                </div>
              </div>
              <div style={{ padding: '8px 20px 16px' }}>
                <InfoRow icon={Hash}     label="Name"       value={`${foundReg.first_name} ${foundReg.last_name}`} />
                <InfoRow icon={Hash}     label="Bib Number" value={foundReg.bib_number} valueColor="rgba(255,255,255,0.5)" />
                {foundEvent && <InfoRow icon={Calendar} label="Event" value={foundEvent.title} />}
              </div>
            </div>
          )}

          {/* ── AWAITING PAYMENT ── */}
          {state === S.PAYMENT && foundReg && (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,180,0,0.3)', background: 'rgba(255,160,0,0.05)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CreditCard style={{ width: 22, height: 22, color: 'rgba(255,200,80,1)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{payLabelDisplay?.label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,200,80,0.7)', margin: '3px 0 0' }}>Payment must be approved before check-in.</p>
                </div>
              </div>
              <div style={{ padding: '8px 20px 16px' }}>
                <InfoRow icon={Hash}     label="Name"       value={`${foundReg.first_name} ${foundReg.last_name}`} />
                <InfoRow icon={Hash}     label="Bib Number" value={foundReg.bib_number} valueColor="#BFFF00" />
                {foundEvent && <InfoRow icon={Calendar} label="Event"    value={foundEvent.title} />}
                {foundCat  && <InfoRow icon={ScanLine}  label="Category" value={foundCat.name} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Payment</p>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: payLabelDisplay?.bg, color: payLabelDisplay?.color, marginTop: 3, display: 'inline-block' }}>{payLabelDisplay?.label}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ALREADY CHECKED IN ── */}
          {state === S.ALREADY && foundReg && (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Already Checked In</p>
                  {foundReg.checked_in_at && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      {format(new Date(foundReg.checked_in_at), 'h:mm a · MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ padding: '8px 20px 4px' }}>
                <InfoRow icon={Hash}     label="Name"       value={`${foundReg.first_name} ${foundReg.last_name}`} />
                <InfoRow icon={Hash}     label="Bib Number" value={foundReg.bib_number} valueColor="rgba(255,255,255,0.5)" />
                {foundEvent && <InfoRow icon={Calendar} label="Event"    value={foundEvent.title} />}
                {foundCat  && <InfoRow icon={ScanLine}  label="Category" value={foundCat.name} />}
                {foundReg.checked_in_by && <InfoRow icon={Hash} label="Checked In By" value={foundReg.checked_in_by} />}
              </div>
              <div style={{ padding: '8px 20px 16px' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '10px 0', background: 'rgba(255,255,255,0.03)', borderRadius: 12, margin: 0 }}>
                  This participant has already checked in.
                </p>
              </div>
            </div>
          )}

          {/* ── READY TO CHECK IN ── */}
          {state === S.READY && foundReg && (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,210,110,0.3)', background: 'rgba(0,210,110,0.04)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,210,110,0.06)' }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 }}>{foundReg.first_name} {foundReg.last_name}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{foundReg.user_email}</p>
              </div>
              <div style={{ padding: '4px 20px 8px' }}>
                {foundEvent && <InfoRow icon={Calendar} label="Event"      value={foundEvent.title} />}
                {foundCat  && <InfoRow icon={ScanLine}  label="Category"   value={foundCat.name} />}
                <InfoRow icon={Hash} label="Bib Number" value={foundReg.bib_number || 'Pending'} valueColor={foundReg.bib_number ? '#BFFF00' : undefined} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Payment</p>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: payLabelDisplay?.bg, color: payLabelDisplay?.color, marginTop: 3, display: 'inline-block' }}>{payLabelDisplay?.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Registration</p>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,210,110,0.12)', color: 'rgb(0,210,110)', marginTop: 3, display: 'inline-block' }}>Confirmed</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '4px 20px 20px' }}>
                <button
                  onClick={() => checkinMutation.mutate()}
                  disabled={checkinMutation.isPending}
                  style={{ width: '100%', padding: '18px 0', borderRadius: 16, fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: checkinMutation.isPending ? 'not-allowed' : 'pointer', background: '#BFFF00', color: '#0A0A0A', border: 'none', opacity: checkinMutation.isPending ? 0.7 : 1 }}
                >
                  {checkinMutation.isPending
                    ? <><Loader2 style={{ width: 22, height: 22, animation: 'spin 1s linear infinite' }} /> Checking in…</>
                    : <><CheckCircle2 style={{ width: 22, height: 22 }} /> Confirm Check-In</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {state === S.SUCCESS && foundReg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderRadius: 20, padding: 28, textAlign: 'center', background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(191,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ width: 40, height: 40, color: '#BFFF00' }} />
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Check-In Complete!</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#BFFF00', margin: '6px 0 0' }}>{foundReg.first_name} {foundReg.last_name}</p>
                  {foundReg.bib_number && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Bib #{foundReg.bib_number}</p>}
                  {foundEvent && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{foundEvent.title}</p>}
                </div>
                <div style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(191,255,0,0.7)', margin: 0 }}>🎁 Finisher rewards unlocked in their account</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{ width: '100%', padding: '18px 0', borderRadius: 16, fontWeight: 900, fontSize: 17, background: '#BFFF00', color: '#0A0A0A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Camera style={{ width: 20, height: 20 }} /> Scan Next Runner
              </button>
            </div>
          )}

        </div>
      )}

      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
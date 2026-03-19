import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ScanLine, Search, CheckCircle2, XCircle,
  AlertCircle, Loader2, ShieldOff, User, Shirt, CreditCard, Hash, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const S = { IDLE: 'idle', SEARCHING: 'searching', FOUND: 'found', SUCCESS: 'success', NOT_FOUND: 'not_found', ALREADY: 'already', PAYMENT: 'payment', NOT_CONFIRMED: 'not_confirmed' };

function InfoRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
        <p className="font-bold text-sm text-white" style={valueColor ? { color: valueColor } : {}}>{value || '—'}</p>
      </div>
    </div>
  );
}

function PaymentBadge({ status }) {
  const map = {
    approved: { label: 'Payment Approved', color: 'rgb(0,210,110)', bg: 'rgba(0,210,110,0.1)', border: 'rgba(0,210,110,0.25)' },
    not_required: { label: 'Free Entry', color: '#BFFF00', bg: 'rgba(191,255,0,0.1)', border: 'rgba(191,255,0,0.2)' },
    pending: { label: 'Payment Pending', color: 'rgba(255,200,80,1)', bg: 'rgba(255,200,80,0.1)', border: 'rgba(255,200,80,0.25)' },
    rejected: { label: 'Payment Rejected', color: 'rgba(255,80,80,1)', bg: 'rgba(255,80,80,0.1)', border: 'rgba(255,80,80,0.25)' },
  };
  const s = map[status] || { label: status || 'Unknown', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

export default function StrideCheckin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [input, setInput] = useState('');
  const [state, setState] = useState(S.IDLE);
  const [foundReg, setFoundReg] = useState(null);
  const [foundEvent, setFoundEvent] = useState(null);
  const [foundCat, setFoundCat] = useState(null);

  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: boothStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['my-booth-staff', user?.email],
    queryFn: () => base44.entities.BoothStaff.filter({ user_id: user.email, is_active: true }),
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const isAdmin = user?.role === 'admin';
  const isLoadingAccess = loadingUser || (!isAdmin && loadingStaff);
  const hasAccess = isAdmin || boothStaff.length > 0;

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
      // Unlock rewards only once
      const existingRewards = await base44.entities.EventRewardUnlock.filter({ registration_id: foundReg.id });
      if (existingRewards.length === 0) {
        await base44.entities.EventRewardUnlock.create({
          registration_id: foundReg.id,
          event_id: foundReg.event_id,
          user_email: foundReg.user_email,
          reward_type: 'badge',
          reward_label: 'Finisher Badge',
          status: 'unlocked',
          unlocked_at: now,
        });
        const eventCoupons = await base44.entities.Coupon.filter({ event_id: foundReg.event_id });
        for (const coupon of eventCoupons) {
          await base44.entities.EventRewardUnlock.create({
            registration_id: foundReg.id,
            event_id: foundReg.event_id,
            user_email: foundReg.user_email,
            reward_type: 'coupon',
            reward_id: coupon.id,
            reward_label: coupon.title,
            status: 'unlocked',
            unlocked_at: now,
          });
        }
      }
    },
    onSuccess: () => {
      setState(S.SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    },
  });

  const handleSearch = async () => {
    const q = input.trim();
    if (!q) return;
    setState(S.SEARCHING);
    setFoundReg(null);
    setFoundEvent(null);
    setFoundCat(null);

    let regs = await base44.entities.EventRegistration.filter({ qr_code: q });
    if (!regs.length) regs = await base44.entities.EventRegistration.filter({ bib_number: q.toUpperCase() });

    if (!regs.length) { setState(S.NOT_FOUND); return; }

    const reg = regs[0];
    const [evs, cats] = await Promise.all([
      base44.entities.StrideEvent.filter({ id: reg.event_id }),
      reg.category_id && reg.category_id !== 'rsvp'
        ? base44.entities.EventCategory.filter({ id: reg.category_id })
        : Promise.resolve([]),
    ]);

    setFoundReg(reg);
    setFoundEvent(evs[0] || null);
    setFoundCat(cats[0] || null);

    // Log duplicate scan
    if (reg.checked_in) {
      await base44.entities.EventCheckinLog.create({
        event_id: reg.event_id,
        registration_id: reg.id,
        user_email: reg.user_email,
        bib_number: reg.bib_number || '',
        scanned_by: user.email,
        scanned_at: new Date().toISOString(),
        result: 'already_checked_in',
      });
      setState(S.ALREADY);
      return;
    }

    if (reg.status !== 'confirmed') { setState(S.NOT_CONFIRMED); return; }
    if (reg.payment_status !== 'approved' && reg.payment_status !== 'not_required') { setState(S.PAYMENT); return; }

    setState(S.FOUND);
  };

  const handleReset = () => {
    setInput('');
    setState(S.IDLE);
    setFoundReg(null);
    setFoundEvent(null);
    setFoundCat(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (isLoadingAccess) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
          <h1 className="text-xl font-bold">Check-In Scanner</h1>
        </div>
      </div>

      {/* No access */}
      {!hasAccess && (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center space-y-4">
          <ShieldOff className="w-14 h-14" style={{ color: 'rgba(255,80,80,0.5)' }} />
          <p className="text-xl font-bold">Access Denied</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You need staff or admin access to use check-in.</p>
          <button onClick={() => navigate(-1)} className="mt-4 py-3 px-8 rounded-2xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            Go Back
          </button>
        </div>
      )}

      {hasAccess && (
        <div className="px-5 pt-6 space-y-4">

          {/* Scanner prompt */}
          {state === S.IDLE && (
            <div className="rounded-2xl p-5 text-center space-y-2" style={{ background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.12)' }}>
              <ScanLine className="w-9 h-9 mx-auto" style={{ color: '#BFFF00' }} />
              <p className="text-sm font-semibold text-white">Scan QR or enter Bib Number</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Use a QR scanner app or type the bib number below</p>
            </div>
          )}

          {/* Input + search — always visible unless success */}
          {state !== S.SUCCESS && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && state !== S.SEARCHING && handleSearch()}
                placeholder="QR code or Bib number..."
                autoFocus
                className="w-full px-5 py-4 rounded-2xl text-center text-white font-bold text-xl tracking-wider outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}
              />
              <button
                onClick={handleSearch}
                disabled={state === S.SEARCHING || !input.trim()}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                style={input.trim() && state !== S.SEARCHING
                  ? { background: '#BFFF00', color: '#0A0A0A' }
                  : { background: 'rgba(191,255,0,0.15)', color: 'rgba(255,255,255,0.3)' }
                }
              >
                {state === S.SEARCHING
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                  : <><Search className="w-5 h-5" /> Find Participant</>
                }
              </button>
            </div>
          )}

          {/* ── NOT FOUND ── */}
          {state === S.NOT_FOUND && (
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)' }}>
              <XCircle className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,100,100,1)' }} />
              <div>
                <p className="font-bold text-white text-base">Not Found</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>No registration matches this QR code or bib number. Double-check and try again.</p>
              </div>
            </div>
          )}

          {/* ── NOT CONFIRMED ── */}
          {state === S.NOT_CONFIRMED && foundReg && (
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <AlertCircle className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,200,80,1)' }} />
              <div>
                <p className="font-bold text-white text-base">Registration Not Confirmed</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {foundReg.first_name} {foundReg.last_name}'s registration status is <span className="font-bold capitalize">{foundReg.status}</span>. Only <span className="font-bold">confirmed</span> registrations can check in.
                </p>
              </div>
            </div>
          )}

          {/* ── PAYMENT PENDING ── */}
          {state === S.PAYMENT && foundReg && (
            <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <CreditCard className="w-8 h-8 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,200,80,1)' }} />
              <div>
                <p className="font-bold text-white text-base">Payment Not Approved</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {foundReg.first_name} {foundReg.last_name}'s payment is <span className="font-bold capitalize">{foundReg.payment_status}</span>. Payment must be approved before check-in.
                </p>
              </div>
            </div>
          )}

          {/* ── ALREADY CHECKED IN ── */}
          {state === S.ALREADY && foundReg && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,200,80,0.06)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <AlertCircle className="w-7 h-7 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
                <div>
                  <p className="font-bold text-white">Already Checked In</p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {foundReg.checked_in_at ? `at ${format(new Date(foundReg.checked_in_at), 'h:mm a · MMM d')}` : ''}
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 space-y-0.5">
                <InfoRow icon={User} label="Name" value={`${foundReg.first_name} ${foundReg.last_name}`} />
                <InfoRow icon={Hash} label="Bib Number" value={foundReg.bib_number} valueColor="#BFFF00" />
                {foundEvent && <InfoRow icon={Calendar} label="Event" value={foundEvent.title} />}
              </div>
            </div>
          )}

          {/* ── FOUND — ready to check in ── */}
          {state === S.FOUND && foundReg && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0,210,110,0.05)', border: '1px solid rgba(0,210,110,0.25)' }}>
              {/* Runner header */}
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xl font-black text-white">{foundReg.first_name} {foundReg.last_name}</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{foundReg.user_email}</p>
              </div>

              {/* Details */}
              <div className="px-5 py-1">
                {foundEvent && <InfoRow icon={Calendar} label="Event" value={foundEvent.title} />}
                {foundCat && <InfoRow icon={ScanLine} label="Category" value={foundCat.name} />}
                <InfoRow icon={Hash} label="Bib Number" value={foundReg.bib_number || 'Pending'} valueColor={foundReg.bib_number ? '#BFFF00' : undefined} />
                <InfoRow icon={Shirt} label="Shirt Size" value={foundReg.shirt_size} />
                <div className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <CreditCard className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Payment</p>
                    <PaymentBadge status={foundReg.payment_status} />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 pt-2">
                <button
                  onClick={() => checkinMutation.mutate()}
                  disabled={checkinMutation.isPending}
                  className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{ background: 'rgb(0,210,110)', color: '#0A0A0A' }}
                >
                  {checkinMutation.isPending
                    ? <><Loader2 className="w-6 h-6 animate-spin" /> Checking in...</>
                    : <><CheckCircle2 className="w-6 h-6" /> Confirm Check-In</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {state === S.SUCCESS && foundReg && (
            <div className="rounded-2xl p-6 text-center space-y-4" style={{ background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.25)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(191,255,0,0.12)' }}>
                <CheckCircle2 className="w-10 h-10" style={{ color: '#BFFF00' }} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">Check-In Complete!</p>
                <p className="text-base font-bold mt-1" style={{ color: '#BFFF00' }}>
                  {foundReg.first_name} {foundReg.last_name}
                </p>
                {foundReg.bib_number && (
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Bib #{foundReg.bib_number}</p>
                )}
                {foundEvent && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{foundEvent.title}</p>
                )}
              </div>
              <div className="py-3 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs" style={{ color: 'rgba(191,255,0,0.7)' }}>🎁 Finisher rewards unlocked in their account</p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
                style={{ background: '#BFFF00', color: '#0A0A0A' }}
              >
                Scan Next Runner
              </button>
            </div>
          )}

          {/* Reset link for error states */}
          {[S.NOT_FOUND, S.NOT_CONFIRMED, S.PAYMENT, S.ALREADY].includes(state) && (
            <button
              onClick={handleReset}
              className="w-full text-center text-sm font-semibold py-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Try a different code
            </button>
          )}

        </div>
      )}
    </div>
  );
}
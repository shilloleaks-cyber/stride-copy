import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ScanLine, Search, CheckCircle2, XCircle, AlertCircle, Loader2, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';

const RESULT = { IDLE: 'idle', FOUND: 'found', SUCCESS: 'success', ALREADY: 'already', NOT_FOUND: 'not_found', NO_ACCESS: 'no_access' };

export default function StrideCheckin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(RESULT.IDLE);
  const [foundReg, setFoundReg] = useState(null);
  const [foundEvent, setFoundEvent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: boothStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['my-booth-staff', user?.email],
    queryFn: () => base44.entities.BoothStaff.filter({ user_id: user.email, is_active: true }),
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const isAdmin = user?.role === 'admin';
  const isLoadingAccess = loadingUser || (!isAdmin && !user?.email ? false : !isAdmin && loadingStaff);
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
    },
    onSuccess: () => {
      setResult(RESULT.SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    },
  });

  const handleSearch = async () => {
    const q = input.trim();
    if (!q) return;
    setIsSearching(true);
    setResult(RESULT.IDLE);
    setFoundReg(null);
    setFoundEvent(null);

    // Try QR code first, then bib number
    let regs = await base44.entities.EventRegistration.filter({ qr_code: q });
    if (!regs.length) regs = await base44.entities.EventRegistration.filter({ bib_number: q.toUpperCase() });

    if (!regs.length) { setResult(RESULT.NOT_FOUND); setIsSearching(false); return; }

    const reg = regs[0];
    const evs = await base44.entities.StrideEvent.filter({ id: reg.event_id });

    setFoundReg(reg);
    setFoundEvent(evs[0] || null);

    if (reg.checked_in) {
      setResult(RESULT.ALREADY);
      // Log duplicate scan attempt
      await base44.entities.EventCheckinLog.create({
        event_id: reg.event_id,
        registration_id: reg.id,
        user_email: reg.user_email,
        bib_number: reg.bib_number || '',
        scanned_by: user.email,
        scanned_at: new Date().toISOString(),
        result: 'already_checked_in',
      });
    } else if (reg.status !== 'confirmed') {
      setResult(RESULT.NO_ACCESS);
    } else {
      setResult(RESULT.FOUND);
    }
    setIsSearching(false);
  };

  const handleReset = () => { setInput(''); setResult(RESULT.IDLE); setFoundReg(null); setFoundEvent(null); };

  if (loadingUser || isLoadingAccess) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}><Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} /></div>;

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
          <h1 className="text-xl font-bold">Check-In Scanner</h1>
        </div>
      </div>

      {!hasAccess && (
        <div className="flex flex-col items-center justify-center pt-20 px-8 text-center space-y-4">
          <ShieldOff className="w-14 h-14" style={{ color: 'rgba(255,80,80,0.5)' }} />
          <p className="text-xl font-bold">Access Denied</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>You need staff or admin access to use check-in.</p>
          <button onClick={() => navigate(-1)} className="mt-4 py-3 px-8 rounded-2xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>Go Back</button>
        </div>
      )}

      {hasAccess && (
        <div className="px-6 pt-6 space-y-5">
          <div className="rounded-2xl p-5 text-center space-y-2" style={{ background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.12)' }}>
            <ScanLine className="w-8 h-8 mx-auto" style={{ color: '#BFFF00' }} />
            <p className="text-sm font-semibold text-white">Scan QR or enter Bib Number</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Use a QR scanner app or type the bib number manually</p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="QR code or Bib number..."
              autoFocus
              className="w-full px-4 py-4 rounded-2xl text-center text-white font-bold text-lg tracking-wider outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !input.trim()}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={input.trim() ? { background: '#BFFF00', color: '#0A0A0A' } : { background: 'rgba(191,255,0,0.2)', color: 'rgba(255,255,255,0.3)' }}
            >
              {isSearching ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</> : <><Search className="w-5 h-5" /> Find Participant</>}
            </button>
          </div>

          {/* Results */}
          {result === RESULT.NO_ACCESS && foundReg && (
            <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <AlertCircle className="w-7 h-7 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
              <div>
                <p className="font-bold text-white">Registration Not Confirmed</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {foundReg.first_name} {foundReg.last_name}'s registration is <span className="capitalize font-semibold">{foundReg.status}</span>. Only confirmed registrations can check in.
                </p>
              </div>
            </div>
          )}

          {result === RESULT.NOT_FOUND && (
            <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)' }}>
              <XCircle className="w-7 h-7 flex-shrink-0" style={{ color: 'rgba(255,100,100,1)' }} />
              <div>
                <p className="font-bold text-white">Not Found</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>No registration matches this code or bib.</p>
              </div>
            </div>
          )}

          {result === RESULT.ALREADY && foundReg && (
            <div className="rounded-2xl p-5 space-y-2" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.25)' }}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-7 h-7 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
                <div>
                  <p className="font-bold text-white">Already Checked In</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {foundReg.first_name} {foundReg.last_name} checked in at {foundReg.checked_in_at ? format(new Date(foundReg.checked_in_at), 'h:mm a') : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {result === RESULT.FOUND && foundReg && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(0,210,110,0.06)', border: '1px solid rgba(0,200,100,0.25)' }}>
              <div className="px-5 py-4 space-y-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="font-bold text-white text-lg">{foundReg.first_name} {foundReg.last_name}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{foundReg.user_email}</p>
                {foundEvent && <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{foundEvent.title}</p>}
              </div>
              <div className="px-5 py-3 flex items-center gap-4">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Bib</p>
                  <p className="text-2xl font-black" style={{ color: '#BFFF00' }}>{foundReg.bib_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Shirt</p>
                  <p className="font-bold text-white">{foundReg.shirt_size || '—'}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</p>
                  <p className="font-bold capitalize text-white">{foundReg.status}</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => checkinMutation.mutate()}
                  disabled={checkinMutation.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                  style={{ background: 'rgb(0,210,110)', color: '#0A0A0A' }}
                >
                  {checkinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {checkinMutation.isPending ? 'Checking in...' : 'Confirm Check-In'}
                </button>
              </div>
            </div>
          )}

          {result === RESULT.SUCCESS && (
            <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.2)' }}>
              <CheckCircle2 className="w-14 h-14 mx-auto" style={{ color: '#BFFF00' }} />
              <p className="text-xl font-bold text-white">Check-In Successful!</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {foundReg?.first_name} {foundReg?.last_name} · Bib {foundReg?.bib_number}
              </p>
              <button onClick={handleReset} className="w-full py-3.5 rounded-2xl font-bold text-sm" style={{ background: '#BFFF00', color: '#0A0A0A' }}>
                Scan Next
              </button>
            </div>
          )}

          {result !== RESULT.IDLE && result !== RESULT.SUCCESS && (
            <button onClick={handleReset} className="w-full text-center text-sm font-semibold py-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Try a different code
            </button>
          )}
        </div>
      )}
    </div>
  );
}
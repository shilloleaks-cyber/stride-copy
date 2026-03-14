import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';

const RESULT = {
  IDLE: 'idle',
  FOUND: 'found',
  ALREADY_REDEEMED: 'already_redeemed',
  EXPIRED: 'expired',
  INVALID: 'invalid',
  WRONG_SPONSOR: 'wrong_sponsor',
  SUCCESS: 'success',
};

export default function StaffRedeem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [resultState, setResultState] = useState(RESULT.IDLE);
  const [foundUserCoupon, setFoundUserCoupon] = useState(null);
  const [foundCoupon, setFoundCoupon] = useState(null);
  const [foundSponsor, setFoundSponsor] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user is booth staff
  const { data: boothStaffRecords = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['my-booth-staff', user?.email],
    queryFn: () => base44.entities.BoothStaff.filter({ user_id: user.email, is_active: true }),
    enabled: !!user?.email && user?.role !== 'admin',
  });

  const isAdmin = user?.role === 'admin';
  const myStaffRecord = boothStaffRecords[0] || null;
  const hasAccess = isAdmin || !!myStaffRecord;
  const myRestrictedSponsorId = isAdmin ? null : myStaffRecord?.sponsor_id || null;

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await base44.entities.UserCoupon.update(foundUserCoupon.id, {
        status: 'redeemed',
        redeemed_at: now,
        redeemed_by_user_id: user?.email || '',
        redeemed_by_sponsor_id: foundCoupon?.sponsor_id || '',
      });
    },
    onSuccess: () => {
      setResultState(RESULT.SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['my-rewards'] });
    },
  });

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setIsSearching(true);
    setResultState(RESULT.IDLE);
    setFoundUserCoupon(null);
    setFoundCoupon(null);
    setFoundSponsor(null);

    const results = await base44.entities.UserCoupon.filter({ redeem_code: trimmed });

    if (!results || results.length === 0) {
      setResultState(RESULT.INVALID);
      setIsSearching(false);
      return;
    }

    const uc = results[0];
    const coupons = await base44.entities.Coupon.filter({ id: uc.coupon_id });
    const coupon = coupons[0] || null;

    let sponsor = null;
    if (coupon?.sponsor_id) {
      const sponsors = await base44.entities.Sponsor.filter({ id: coupon.sponsor_id });
      sponsor = sponsors[0] || null;
    }

    setFoundUserCoupon(uc);
    setFoundCoupon(coupon);
    setFoundSponsor(sponsor);

    // Sponsor restriction check for booth staff
    if (myRestrictedSponsorId && coupon?.sponsor_id !== myRestrictedSponsorId) {
      setResultState(RESULT.WRONG_SPONSOR);
      setIsSearching(false);
      return;
    }

    if (uc.status === 'redeemed') {
      setResultState(RESULT.ALREADY_REDEEMED);
    } else if (uc.status === 'expired') {
      setResultState(RESULT.EXPIRED);
    } else if (coupon?.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      setResultState(RESULT.EXPIRED);
    } else {
      setResultState(RESULT.FOUND);
    }

    setIsSearching(false);
  };

  const handleReset = () => {
    setCode('');
    setResultState(RESULT.IDLE);
    setFoundUserCoupon(null);
    setFoundCoupon(null);
    setFoundSponsor(null);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '16px',
    color: 'white',
    padding: '16px 20px',
    width: '100%',
    outline: 'none',
    fontSize: '20px',
    fontWeight: 800,
    letterSpacing: '0.2em',
    textAlign: 'center',
    textTransform: 'uppercase',
  };

  const isLoadingAccess = loadingUser || (user && !isAdmin && loadingStaff);

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4"
        style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {isAdmin ? 'Admin' : 'Booth Staff'}
          </p>
          <h1 className="text-xl font-bold text-white leading-tight">Redeem Coupon</h1>
        </div>
        {myStaffRecord && !isAdmin && (
          <div
            className="ml-auto text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(138,43,226,0.3)' }}
          >
            {myStaffRecord.sponsor_id}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoadingAccess && (
        <div className="flex items-center justify-center pt-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#BFFF00' }} />
        </div>
      )}

      {/* Access Denied */}
      {!isLoadingAccess && !hasAccess && (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center space-y-4">
          <ShieldOff className="w-16 h-16" style={{ color: 'rgba(255,80,80,0.6)' }} />
          <p className="text-xl font-bold text-white">Access Denied</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            You are not registered as booth staff. Please contact the event administrator.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 py-3 px-8 rounded-2xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
          >
            Go Back
          </button>
        </div>
      )}

      {/* Main redeem form */}
      {!isLoadingAccess && hasAccess && (
        <div className="px-6 pt-6 space-y-5">

          {/* Sponsor restriction badge */}
          {myRestrictedSponsorId && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: '#BFFF00' }} />
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                You can only redeem coupons from your assigned sponsor
              </p>
            </div>
          )}

          {/* Code input */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Enter Redeem Code
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. A7X2B9"
              maxLength={10}
              style={inputStyle}
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !code.trim()}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={!code.trim()
              ? { background: 'rgba(191,255,0,0.2)', color: 'rgba(255,255,255,0.3)' }
              : { background: '#BFFF00', color: '#0A0A0A' }
            }
          >
            {isSearching
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
              : <><Search className="w-5 h-5" /> Find Coupon</>
            }
          </button>

          {/* Results */}
          {resultState === RESULT.INVALID && (
            <ResultCard
              icon={<XCircle className="w-8 h-8" style={{ color: 'rgba(255,100,100,1)' }} />}
              title="Invalid Code"
              subtitle="No coupon found with this code. Please check and try again."
              color="rgba(255,80,80,0.15)"
              border="rgba(255,80,80,0.25)"
            />
          )}

          {resultState === RESULT.WRONG_SPONSOR && (
            <ResultCard
              icon={<ShieldOff className="w-8 h-8" style={{ color: 'rgba(255,100,100,1)' }} />}
              title="Wrong Sponsor"
              subtitle="This coupon belongs to a different sponsor. You can only redeem coupons from your assigned booth."
              color="rgba(255,80,80,0.12)"
              border="rgba(255,80,80,0.25)"
            />
          )}

          {resultState === RESULT.EXPIRED && (
            <ResultCard
              icon={<Clock className="w-8 h-8" style={{ color: 'rgba(255,200,80,1)' }} />}
              title="Coupon Expired"
              subtitle="This coupon has already expired and cannot be redeemed."
              color="rgba(255,200,80,0.08)"
              border="rgba(255,200,80,0.2)"
              coupon={foundCoupon}
              sponsor={foundSponsor}
            />
          )}

          {resultState === RESULT.ALREADY_REDEEMED && (
            <ResultCard
              icon={<AlertCircle className="w-8 h-8" style={{ color: '#BFFF00' }} />}
              title="Already Redeemed"
              subtitle={foundUserCoupon?.redeemed_at
                ? `Redeemed on ${format(new Date(foundUserCoupon.redeemed_at), 'MMM d, yyyy · h:mm a')}`
                : 'This coupon has already been redeemed.'
              }
              color="rgba(138,43,226,0.1)"
              border="rgba(138,43,226,0.25)"
              coupon={foundCoupon}
              sponsor={foundSponsor}
              redeemedBy={foundUserCoupon?.redeemed_by_user_id}
            />
          )}

          {resultState === RESULT.FOUND && foundCoupon && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,200,100,0.06)', border: '1px solid rgba(0,200,100,0.25)' }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  {foundSponsor?.logo ? (
                    <img src={foundSponsor.logo} alt={foundSponsor.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00' }}
                    >
                      {(foundSponsor?.name || '?')[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold">{foundSponsor?.name || 'Sponsor'}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Sponsor</p>
                  </div>
                </div>
                {foundCoupon.discount_text && (
                  <span className="text-sm font-black px-3 py-1.5 rounded-full" style={{ background: '#BFFF00', color: '#0A0A0A' }}>
                    {foundCoupon.discount_text}
                  </span>
                )}
              </div>

              <div className="px-5 py-4 space-y-3">
                <div>
                  <p className="text-white font-bold text-lg">{foundCoupon.title}</p>
                  {foundCoupon.description && (
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{foundCoupon.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(0,220,120)' }} />
                  <span className="text-sm font-bold" style={{ color: 'rgb(0,220,120)' }}>Valid · Ready to Redeem</span>
                </div>
                <div
                  className="py-2 px-4 rounded-xl text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Code</p>
                  <p className="text-xl font-black tracking-widest" style={{ color: '#BFFF00' }}>
                    {foundUserCoupon.redeem_code}
                  </p>
                </div>
                {foundCoupon.expiry_date && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Expires: {format(new Date(foundCoupon.expiry_date), 'MMM d, yyyy')}
                  </p>
                )}
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Holder: {foundUserCoupon.user_id}
                </p>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => redeemMutation.mutate()}
                  disabled={redeemMutation.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'rgb(0,210,110)', color: '#0A0A0A' }}
                >
                  {redeemMutation.isPending
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    : <><CheckCircle2 className="w-5 h-5" /> Confirm Redeem</>
                  }
                </button>
              </div>
            </div>
          )}

          {resultState === RESULT.SUCCESS && (
            <div
              className="rounded-2xl p-6 text-center space-y-3"
              style={{ background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-14 h-14" style={{ color: '#BFFF00' }} />
              </div>
              <p className="text-white font-bold text-xl">Redeemed Successfully!</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {foundCoupon?.title} has been marked as redeemed.
              </p>
              <button
                onClick={handleReset}
                className="mt-2 w-full py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: '#BFFF00', color: '#0A0A0A' }}
              >
                Redeem Another Coupon
              </button>
            </div>
          )}

          {resultState !== RESULT.IDLE && resultState !== RESULT.SUCCESS && (
            <button
              onClick={handleReset}
              className="w-full text-center text-sm font-semibold py-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Try a different code
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ icon, title, subtitle, color, border, coupon, sponsor, redeemedBy }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: color, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-white font-bold text-base">{title}</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{subtitle}</p>
        </div>
      </div>
      {coupon && (
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sponsor?.logo ? (
            <img src={sponsor.logo} alt={sponsor.name} className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {(sponsor?.name || '?')[0]}
            </div>
          )}
          <p className="text-sm font-semibold text-white">{coupon.title}</p>
          {coupon.discount_text && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              {coupon.discount_text}
            </span>
          )}
        </div>
      )}
      {redeemedBy && (
        <p className="text-xs pt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Redeemed by: {redeemedBy}</p>
      )}
    </div>
  );
}
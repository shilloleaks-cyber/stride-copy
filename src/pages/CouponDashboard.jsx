import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Users, Gift, Tag, ChevronDown, ChevronUp } from 'lucide-react';

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-black" style={{ color }}>{value}</span>
      <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
}

function EventGroup({ event, coupons, sponsors, userCoupons }) {
  const [expanded, setExpanded] = useState(true);

  const eventCoupons = coupons.filter(c => c.event_id === event.id);
  if (eventCoupons.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(191,255,0,0.12)', background: 'rgba(255,255,255,0.03)' }}>
      {/* Event header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
      >
        <div className="text-left">
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Official Event</p>
          <p className="text-white font-bold text-base">{event.title}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
        }
      </button>

      {expanded && (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {eventCoupons.map(coupon => {
            const sponsor = sponsors.find(s => s.id === coupon.sponsor_id);
            const couponUCs = userCoupons.filter(uc => uc.coupon_id === coupon.id);
            const total = coupon.total_quantity || 0;
            const unlocked = couponUCs.filter(uc => uc.status === 'unlocked').length;
            const redeemed = couponUCs.filter(uc => uc.status === 'redeemed').length;
            const remaining = total > 0 ? Math.max(0, total - unlocked - redeemed) : null;

            return (
              <div key={coupon.id} className="px-5 py-4 space-y-3">
                {/* Sponsor + coupon title */}
                <div className="flex items-center gap-3">
                  {sponsor?.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00' }}
                    >
                      {(sponsor?.name || '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{sponsor?.name || 'Unknown Sponsor'}</p>
                    <p className="text-white font-bold text-sm truncate">{coupon.title}</p>
                  </div>
                  {coupon.discount_text && (
                    <span
                      className="ml-auto text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: '#BFFF00', color: '#0A0A0A' }}
                    >
                      {coupon.discount_text}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div
                  className="flex items-center justify-around py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {total > 0 && <StatPill label="Total" value={total} color="rgba(255,255,255,0.7)" />}
                  <StatPill label="Unlocked" value={unlocked} color="#BFFF00" />
                  <StatPill label="Redeemed" value={redeemed} color="rgb(138,43,226)" />
                  {remaining !== null && <StatPill label="Remaining" value={remaining} color="rgba(255,255,255,0.5)" />}
                </div>

                {/* Recent redemptions */}
                {redeemed > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Recent Redemptions</p>
                    {couponUCs
                      .filter(uc => uc.status === 'redeemed')
                      .slice(0, 3)
                      .map(uc => (
                        <div
                          key={uc.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{ background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.15)' }}
                        >
                          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            {uc.user_id}
                          </span>
                          <div className="text-right">
                            {uc.redeemed_at && (
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {new Date(uc.redeemed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {uc.redeemed_by_user_id && (
                              <p className="text-xs" style={{ color: 'rgba(191,255,0,0.5)' }}>
                                by {uc.redeemed_by_user_id}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    {couponUCs.filter(uc => uc.status === 'redeemed').length > 3 && (
                      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        +{couponUCs.filter(uc => uc.status === 'redeemed').length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CouponDashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['official-events-dash'],
    queryFn: () => base44.entities.Event.filter({ event_kind: 'official' }, '-start_at', 50),
    enabled: user?.role === 'admin',
  });

  const { data: coupons = [], isLoading: loadingCoupons } = useQuery({
    queryKey: ['all-coupons-dash'],
    queryFn: () => base44.entities.Coupon.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ['all-sponsors-dash'],
    queryFn: () => base44.entities.Sponsor.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const { data: userCoupons = [], isLoading: loadingUC } = useQuery({
    queryKey: ['all-user-coupons-dash'],
    queryFn: () => base44.entities.UserCoupon.list('-unlocked_at', 500),
    enabled: user?.role === 'admin',
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold mb-2">Access Denied</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin only</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  const isLoading = loadingEvents || loadingCoupons || loadingUC;

  // Summary totals
  const totalUnlocked = userCoupons.filter(uc => uc.status === 'unlocked').length;
  const totalRedeemed = userCoupons.filter(uc => uc.status === 'redeemed').length;

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
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</p>
          <h1 className="text-xl font-bold text-white leading-tight">Coupon Dashboard</h1>
        </div>
        <button
          onClick={() => navigate(createPageUrl('StaffManagement'))}
          className="ml-auto text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          style={{ background: 'rgba(138,43,226,0.15)', color: '#BFFF00', border: '1px solid rgba(138,43,226,0.3)' }}
        >
          <Users className="w-3.5 h-3.5" /> Staff
        </button>
      </div>

      <div className="px-6 pt-5 space-y-5">
        {/* Summary */}
        <div
          className="flex items-center justify-around py-4 rounded-2xl"
          style={{ background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.12)' }}
        >
          <StatPill label="Events" value={events.length} color="rgba(255,255,255,0.7)" />
          <StatPill label="Coupons" value={coupons.length} color="rgba(255,255,255,0.7)" />
          <StatPill label="Unlocked" value={totalUnlocked} color="#BFFF00" />
          <StatPill label="Redeemed" value={totalRedeemed} color="rgb(138,43,226)" />
        </div>

        {isLoading && (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm font-semibold text-white mb-1">No official events yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Create official events with coupons to see stats here</p>
          </div>
        )}

        {!isLoading && events.map(event => (
          <EventGroup
            key={event.id}
            event={event}
            coupons={coupons}
            sponsors={sponsors}
            userCoupons={userCoupons}
          />
        ))}
      </div>
    </div>
  );
}
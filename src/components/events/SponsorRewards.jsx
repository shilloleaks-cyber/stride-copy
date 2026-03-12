import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function CouponCard({ userCoupon, coupon, sponsor }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(191,255,0,0.15)' }}
    >
      {/* Top: sponsor logo + discount badge */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(191,255,0,0.04)' }}
      >
        <div className="flex items-center gap-2">
          {sponsor?.logo ? (
            <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00' }}
            >
              {(sponsor?.name || '?')[0]}
            </div>
          )}
          <span className="text-sm font-semibold text-white">{sponsor?.name || 'Sponsor'}</span>
        </div>
        {coupon?.discount_text && (
          <span
            className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: '#BFFF00', color: '#0A0A0A' }}
          >
            {coupon.discount_text}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-white font-bold text-sm">{coupon?.title}</p>
        {coupon?.description && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{coupon.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {coupon?.expiry_date ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Expires {format(new Date(coupon.expiry_date), 'MMM d, yyyy')}
              </span>
            </div>
          ) : <div />}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,200,100,0.15)', color: 'rgb(0,220,120)', border: '1px solid rgba(0,200,100,0.2)' }}
          >
            Unlocked
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SponsorRewards({ eventId, userEmail }) {
  const { data: userCoupons = [] } = useQuery({
    queryKey: ['user-coupons-event', eventId, userEmail],
    queryFn: () => base44.entities.UserCoupon.filter({ event_id: eventId, user_id: userEmail }),
    enabled: !!eventId && !!userEmail,
  });

  const couponIds = userCoupons.map(uc => uc.coupon_id);

  const { data: allCoupons = [] } = useQuery({
    queryKey: ['coupons-for-event', eventId],
    queryFn: () => base44.entities.Coupon.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const sponsorIds = [...new Set(allCoupons.map(c => c.sponsor_id).filter(Boolean))];

  const { data: allSponsors = [] } = useQuery({
    queryKey: ['sponsors-for-event', sponsorIds.join(',')],
    queryFn: () => base44.entities.Sponsor.list('-created_date', 100),
    enabled: sponsorIds.length > 0,
  });

  const couponMap = Object.fromEntries(allCoupons.map(c => [c.id, c]));
  const sponsorMap = Object.fromEntries(allSponsors.map(s => [s.id, s]));

  const myUnlockedCoupons = userCoupons.filter(uc => uc.status === 'unlocked' && couponIds.includes(uc.coupon_id));

  if (myUnlockedCoupons.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4" style={{ color: '#BFFF00' }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Sponsor Rewards
        </p>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00' }}
        >
          {myUnlockedCoupons.length}
        </span>
      </div>
      <div className="space-y-3">
        {myUnlockedCoupons.map(uc => {
          const coupon = couponMap[uc.coupon_id];
          const sponsor = coupon ? sponsorMap[coupon.sponsor_id] : null;
          return <CouponCard key={uc.id} userCoupon={uc} coupon={coupon} sponsor={sponsor} />;
        })}
      </div>
    </div>
  );
}
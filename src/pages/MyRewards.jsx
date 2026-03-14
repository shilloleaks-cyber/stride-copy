import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gift, Tag, Calendar, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import CouponDetailSheet from '@/components/coupons/CouponDetailSheet';

const TABS = [
  { key: 'unlocked', label: 'Available' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'expired',  label: 'Expired' },
];

function CouponWalletCard({ userCoupon, coupon, sponsor, event, onClick }) {
  const isRedeemed = userCoupon.status === 'redeemed';
  const isExpired = userCoupon.status === 'expired';

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden transition-all cursor-pointer active:scale-95"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: isRedeemed
          ? '1px solid rgba(138,43,226,0.25)'
          : isExpired
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid rgba(191,255,0,0.15)',
        opacity: isExpired ? 0.55 : 1,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: isRedeemed ? 'rgba(138,43,226,0.06)' : isExpired ? 'transparent' : 'rgba(191,255,0,0.04)',
        }}
      >
        <div className="flex items-center gap-2">
          {sponsor?.logo ? (
            <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              {(sponsor?.name || '?')[0]}
            </div>
          )}
          <span className="text-sm font-semibold text-white">{sponsor?.name || 'Sponsor'}</span>
        </div>

        <div className="flex items-center gap-2">
          {coupon?.discount_text && !isExpired && (
            <span
              className="text-xs font-black px-2.5 py-1 rounded-full"
              style={isRedeemed
                ? { background: 'rgba(138,43,226,0.25)', color: '#BFFF00' }
                : { background: '#BFFF00', color: '#0A0A0A' }
              }
            >
              {coupon.discount_text}
            </span>
          )}
          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-white font-bold text-sm">{coupon?.title}</p>
        {coupon?.description && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{coupon.description}</p>
        )}

        {event && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.title}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {coupon?.expiry_date ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isExpired ? 'Expired' : 'Expires'} {format(new Date(coupon.expiry_date), 'MMM d, yyyy')}
              </span>
            </div>
          ) : <div />}

          {userCoupon.status === 'unlocked' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,200,100,0.15)', color: 'rgb(0,220,120)', border: '1px solid rgba(0,200,100,0.2)' }}>
              Available
            </span>
          )}
          {userCoupon.status === 'redeemed' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(138,43,226,0.3)' }}>
              <CheckCircle2 className="w-3 h-3" /> Redeemed
            </span>
          )}
          {userCoupon.status === 'expired' && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
              <Clock className="w-3 h-3" /> Expired
            </span>
          )}
        </div>

        {userCoupon.redeemed_at && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Redeemed on {format(new Date(userCoupon.redeemed_at), 'MMM d, yyyy · h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MyRewards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unlocked');
  const [selectedUC, setSelectedUC] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userCoupons = [], isLoading } = useQuery({
    queryKey: ['my-rewards', user?.email],
    queryFn: () => base44.entities.UserCoupon.filter({ user_id: user.email }, '-unlocked_at', 100),
    enabled: !!user?.email,
  });

  const couponIds = [...new Set(userCoupons.map(uc => uc.coupon_id))];
  const eventIds = [...new Set(userCoupons.map(uc => uc.event_id))];

  const { data: allCoupons = [] } = useQuery({
    queryKey: ['coupons-for-wallet', couponIds.join(',')],
    queryFn: () => base44.entities.Coupon.list('-created_date', 200),
    enabled: couponIds.length > 0,
  });

  const { data: allSponsors = [] } = useQuery({
    queryKey: ['sponsors-for-wallet'],
    queryFn: () => base44.entities.Sponsor.list('-created_date', 100),
    enabled: couponIds.length > 0,
  });

  const { data: allEvents = [] } = useQuery({
    queryKey: ['events-for-wallet', eventIds.join(',')],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-start_at', 100),
    enabled: eventIds.length > 0,
  });

  const couponMap = Object.fromEntries(allCoupons.map(c => [c.id, c]));
  const sponsorMap = Object.fromEntries(allSponsors.map(s => [s.id, s]));
  const eventMap = Object.fromEntries(allEvents.map(e => [e.id, e]));

  const filtered = userCoupons.filter(uc => uc.status === activeTab);
  const counts = {
    unlocked: userCoupons.filter(uc => uc.status === 'unlocked').length,
    redeemed: userCoupons.filter(uc => uc.status === 'redeemed').length,
    expired: userCoupons.filter(uc => uc.status === 'expired').length,
  };

  // Detail sheet data
  const selectedCoupon = selectedUC ? couponMap[selectedUC.coupon_id] : null;
  const selectedSponsor = selectedCoupon ? sponsorMap[selectedCoupon.sponsor_id] : null;
  const selectedEvent = selectedUC ? eventMap[selectedUC.event_id] : null;

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
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>My</p>
          <h1 className="text-xl font-bold text-white leading-tight">Rewards</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate(createPageUrl('StaffRedeem'))}
              className="text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              Staff Redeem
            </button>
          )}
          <Gift className="w-5 h-5" style={{ color: '#BFFF00' }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-5 pb-2">
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative"
              style={activeTab === tab.key
                ? { background: '#BFFF00', color: '#0A0A0A' }
                : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-black"
                  style={activeTab === tab.key
                    ? { background: '#0A0A0A', color: '#BFFF00' }
                    : { background: 'rgba(191,255,0,0.3)', color: '#BFFF00' }
                  }
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-4">
        {isLoading && (
          <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
          >
            <p className="text-3xl mb-3">🎁</p>
            <p className="text-sm font-semibold text-white mb-1">
              {activeTab === 'unlocked' ? 'No rewards yet' : `No ${activeTab} coupons`}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {activeTab === 'unlocked' ? 'Check in to official events to unlock sponsor rewards' : ''}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(uc => {
              const coupon = couponMap[uc.coupon_id];
              const sponsor = coupon ? sponsorMap[coupon.sponsor_id] : null;
              const event = eventMap[uc.event_id];
              return (
                <CouponWalletCard
                  key={uc.id}
                  userCoupon={uc}
                  coupon={coupon}
                  sponsor={sponsor}
                  event={event}
                  onClick={() => setSelectedUC(uc)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Coupon Detail Sheet */}
      {selectedUC && (
        <CouponDetailSheet
          userCoupon={selectedUC}
          coupon={selectedCoupon}
          sponsor={selectedSponsor}
          event={selectedEvent}
          onClose={() => setSelectedUC(null)}
        />
      )}
    </div>
  );
}
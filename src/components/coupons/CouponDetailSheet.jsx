import React from 'react';
import { X, Calendar, Tag, CheckCircle2, Clock, Hash } from 'lucide-react';
import { format } from 'date-fns';

export default function CouponDetailSheet({ userCoupon, coupon, sponsor, event, onClose }) {
  if (!userCoupon || !coupon) return null;

  const isRedeemed = userCoupon.status === 'redeemed';
  const isExpired = userCoupon.status === 'expired';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            {sponsor?.logo ? (
              <img src={sponsor.logo} alt={sponsor.name} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00' }}
              >
                {(sponsor?.name || '?')[0]}
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm">{sponsor?.name || 'Sponsor'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Sponsor Reward</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">

          {/* Discount badge + title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-white font-bold text-lg leading-tight">{coupon.title}</p>
              {coupon.description && (
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{coupon.description}</p>
              )}
            </div>
            {coupon.discount_text && (
              <span
                className="text-sm font-black px-3 py-1.5 rounded-full flex-shrink-0"
                style={isRedeemed
                  ? { background: 'rgba(138,43,226,0.2)', color: '#BFFF00' }
                  : isExpired
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                    : { background: '#BFFF00', color: '#0A0A0A' }
                }
              >
                {coupon.discount_text}
              </span>
            )}
          </div>

          {/* Status */}
          <div
            className="flex items-center justify-center gap-2 py-3 rounded-xl"
            style={isRedeemed
              ? { background: 'rgba(138,43,226,0.12)', border: '1px solid rgba(138,43,226,0.2)' }
              : isExpired
                ? { background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }
                : { background: 'rgba(0,200,100,0.08)', border: '1px solid rgba(0,200,100,0.2)' }
            }
          >
            {isRedeemed && <CheckCircle2 className="w-4 h-4" style={{ color: '#BFFF00' }} />}
            {isExpired && <Clock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />}
            {!isRedeemed && !isExpired && (
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(0,220,120)' }} />
            )}
            <span
              className="text-sm font-bold"
              style={isRedeemed
                ? { color: '#BFFF00' }
                : isExpired
                  ? { color: 'rgba(255,255,255,0.35)' }
                  : { color: 'rgb(0,220,120)' }
              }
            >
              {isRedeemed ? 'Redeemed' : isExpired ? 'Expired' : 'Available to Redeem'}
            </span>
          </div>

          {/* Redeem Code — only for unlocked coupons */}
          {!isExpired && userCoupon.redeem_code && (
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(191,255,0,0.04)', border: '1px solid rgba(191,255,0,0.12)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3.5 h-3.5" style={{ color: 'rgba(191,255,0,0.6)' }} />
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Redeem Code
                </p>
              </div>
              <p
                className="text-3xl font-black tracking-widest text-center py-2"
                style={{ color: '#BFFF00', letterSpacing: '0.25em', textShadow: '0 0 20px rgba(191,255,0,0.3)' }}
              >
                {userCoupon.redeem_code}
              </p>
              {!isRedeemed && (
                <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Show this code to booth staff to redeem
                </p>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-2.5">
            {event && (
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{event.title}</span>
              </div>
            )}
            {coupon.expiry_date && (
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {isExpired ? 'Expired' : 'Expires'} {format(new Date(coupon.expiry_date), 'MMMM d, yyyy')}
                </span>
              </div>
            )}
            {userCoupon.redeemed_at && (
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(191,255,0,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Redeemed on {format(new Date(userCoupon.redeemed_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Safe area bottom padding */}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: 16 }} />
      </div>
    </div>
  );
}
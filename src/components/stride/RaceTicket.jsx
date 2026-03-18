import React from 'react';
import { Calendar, MapPin, QrCode, CheckCircle2, Clock, XCircle, Shirt, User, CreditCard, ScanLine } from 'lucide-react';
import { format } from 'date-fns';
import PaymentUpload from './PaymentUpload';
import RewardSection from './RewardSection';
import PostEventResult from './PostEventResult';

const STATUS_CFG = {
  pending:   { label: 'Awaiting Approval', color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)',  Icon: Clock },
  confirmed: { label: 'Confirmed',         color: '#BFFF00',             bg: 'rgba(191,255,0,0.1)',   border: 'rgba(191,255,0,0.25)',   Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled',         color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
  rejected:  { label: 'Rejected',          color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
};

const PAYMENT_CFG = {
  pending:      { label: 'Awaiting Payment Approval', color: 'rgba(255,200,80,1)',      bg: 'rgba(255,200,80,0.08)',  border: 'rgba(255,200,80,0.2)' },
  paid:         { label: 'Payment Confirmed',         color: '#BFFF00',                bg: 'rgba(191,255,0,0.08)',  border: 'rgba(191,255,0,0.2)' },
  not_required: { label: 'Free Entry',                color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  refunded:     { label: 'Refunded',                  color: 'rgba(138,43,226,0.9)',   bg: 'rgba(138,43,226,0.08)', border: 'rgba(138,43,226,0.2)' },
};

function TearLine() {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginLeft: -10, background: '#0A0A0A', zIndex: 1 }} />
      <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.1)' }} />
      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginRight: -10, background: '#0A0A0A', zIndex: 1 }} />
    </div>
  );
}

function Pill({ label, color, bg, border, Icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 99,
      background: bg, border: `1px solid ${border}`,
      color, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </span>
  );
}

export default function RaceTicket({ reg, event, category, onShowQR }) {
  const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;
  const payCfg = PAYMENT_CFG[reg.payment_status] || PAYMENT_CFG.not_required;
  const isConfirmed = reg.status === 'confirmed';
  const isCancelled = reg.status === 'cancelled' || reg.status === 'rejected';
  const hasQR = !!reg.qr_code && !isCancelled;

  const cardBorder = isConfirmed
    ? 'rgba(191,255,0,0.22)'
    : isCancelled
      ? 'rgba(255,80,80,0.15)'
      : 'rgba(255,255,255,0.09)';

  const cardGlow = isConfirmed
    ? '0 0 40px rgba(191,255,0,0.07), 0 4px 24px rgba(0,0,0,0.5)'
    : '0 4px 24px rgba(0,0,0,0.4)';

  const userName = [reg.first_name, reg.last_name].filter(Boolean).join(' ') || '—';

  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', background: '#111114', border: `1px solid ${cardBorder}`, boxShadow: cardGlow }}>

      {/* Banner */}
      <div style={{ position: 'relative', height: 120 }}>
        {event?.banner_image
          ? <img src={event.banner_image} alt={event?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(138,43,226,0.5) 0%, rgba(191,255,0,0.25) 100%)' }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111114 0%, rgba(17,17,20,0.15) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <Pill label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} Icon={cfg.Icon} />
        </div>
        {reg.checked_in && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Pill label="Checked In" color="#BFFF00" bg="rgba(191,255,0,0.15)" border="rgba(191,255,0,0.4)" Icon={ScanLine} />
          </div>
        )}
      </div>

      {/* Event info */}
      <div style={{ padding: '4px 20px 14px' }}>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>
          {event?.title || '—'}
        </p>
        {category && (
          <p style={{ fontSize: 12, fontWeight: 700, color: category.color || '#BFFF00', margin: '0 0 10px', letterSpacing: '0.04em' }}>
            {category.name}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {event?.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
                {event.start_time && <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {event.start_time}</span>}
              </span>
            </div>
          )}
          {event?.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{event.location_name}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{userName}</span>
          </div>
        </div>
      </div>

      <TearLine />

      {/* Bib + QR */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Bib Number
          </p>
          <p style={{
            fontSize: reg.bib_number ? 56 : 40,
            fontWeight: 900,
            color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.15)',
            lineHeight: 1, margin: 0, letterSpacing: '-1px',
            textShadow: reg.bib_number ? '0 0 24px rgba(191,255,0,0.4)' : 'none',
          }}>
            {reg.bib_number || '—'}
          </p>
        </div>
        <button
          onClick={() => hasQR && onShowQR(reg)}
          disabled={!hasQR}
          style={{
            width: 76, height: 76, borderRadius: 18,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: hasQR ? 'rgba(191,255,0,0.1)' : 'rgba(255,255,255,0.03)',
            border: hasQR ? '1.5px solid rgba(191,255,0,0.3)' : '1px solid rgba(255,255,255,0.07)',
            boxShadow: hasQR ? '0 0 20px rgba(191,255,0,0.1)' : 'none',
            cursor: hasQR ? 'pointer' : 'default',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <QrCode style={{ width: 26, height: 26, color: hasQR ? '#BFFF00' : 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: hasQR ? '#BFFF00' : 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
            {hasQR ? 'SHOW QR' : 'NO QR'}
          </span>
        </button>
      </div>

      {/* Status row */}
      <div style={{
        margin: '0 20px 18px', padding: '12px 14px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 120 }}>
          <CreditCard style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: payCfg.color }}>{payCfg.label}</span>
        </div>
        {reg.shirt_size && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shirt style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Size <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{reg.shirt_size}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Payment upload */}
      {category?.price > 0 && reg.payment_status !== 'paid' && !isCancelled && (
        <div style={{ margin: '0 20px 16px', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <PaymentUpload registration={reg} category={category} />
        </div>
      )}

      {/* Post-event result */}
      {isConfirmed && event && (
        <PostEventResult registrationId={reg.id} userEmail={reg.user_email} event={event} />
      )}

      {/* Rewards */}
      {reg.checked_in && (
        <RewardSection registrationId={reg.id} userEmail={reg.user_email} />
      )}
    </div>
  );
}
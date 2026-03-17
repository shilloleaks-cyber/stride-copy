import React from 'react';
import { Calendar, MapPin, QrCode, CheckCircle2, Clock, XCircle, Shirt } from 'lucide-react';
import { format } from 'date-fns';
import PaymentUpload from './PaymentUpload';
import RewardSection from './RewardSection';
import PostEventResult from './PostEventResult';

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)',  Icon: Clock },
  confirmed: { label: 'Confirmed', color: 'rgb(0,210,110)',      bg: 'rgba(0,200,100,0.1)',   border: 'rgba(0,200,100,0.25)',   Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)',  border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
  rejected:  { label: 'Rejected',  color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)',  border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
};

const PAYMENT_CFG = {
  pending:      { label: 'Awaiting Approval', color: 'rgba(255,200,80,1)' },
  paid:         { label: 'Paid',              color: 'rgb(0,210,110)' },
  not_required: { label: 'Free Entry',        color: 'rgba(255,255,255,0.4)' },
  refunded:     { label: 'Refunded',          color: 'rgba(138,43,226,0.9)' },
};

export default function RaceTicket({ reg, event, category, onShowQR }) {
  const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.Icon;
  const payCfg = PAYMENT_CFG[reg.payment_status] || PAYMENT_CFG.pending;
  const isConfirmed = reg.status === 'confirmed';
  const isCancelled = reg.status === 'cancelled' || reg.status === 'rejected';

  return (
    <div className="rounded-3xl overflow-hidden" style={{
      background: 'rgba(18,18,18,1)',
      border: `1px solid ${isConfirmed ? 'rgba(191,255,0,0.2)' : isCancelled ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.1)'}`,
      boxShadow: isConfirmed ? '0 0 40px rgba(191,255,0,0.05)' : 'none',
    }}>

      {/* Banner */}
      <div className="relative" style={{ height: 110 }}>
        {event?.banner_image
          ? <img src={event.banner_image} alt={event?.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(138,43,226,0.4), rgba(191,255,0,0.2))' }} />
        }
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0.3) 60%, transparent 100%)' }} />
        {/* Status badge top-right */}
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(8px)' }}>
            <StatusIcon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>
      </div>

      {/* Main ticket body */}
      <div className="px-5 pb-1 -mt-2">
        <p className="text-lg font-black text-white leading-tight">{event?.title || '—'}</p>
        {category && (
          <p className="text-xs font-bold mt-0.5" style={{ color: category.color || '#BFFF00' }}>{category.name}</p>
        )}
      </div>

      {/* Event meta */}
      <div className="px-5 py-3 flex flex-col gap-1.5">
        {event?.event_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
              {event.start_time && ` · ${event.start_time}`}
            </span>
          </div>
        )}
        {event?.location_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.location_name}</span>
          </div>
        )}
      </div>

      {/* Ticket tear line */}
      <div className="relative flex items-center mx-0 my-1">
        <div className="w-5 h-5 rounded-full flex-shrink-0 -ml-2.5" style={{ background: '#0A0A0A' }} />
        <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <div className="w-5 h-5 rounded-full flex-shrink-0 -mr-2.5" style={{ background: '#0A0A0A' }} />
      </div>

      {/* Bib + QR row */}
      <div className="px-5 py-4 flex items-center gap-4">
        {/* Bib */}
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Bib No.</p>
          <p className="text-4xl font-black tracking-tight mt-0.5" style={{ color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>
            {reg.bib_number || '—'}
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.08)' }} />

        {/* Shirt + payment */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Shirt className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{reg.shirt_size || '—'}</span>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: payCfg.color }}>{payCfg.label}</p>
          </div>
          {reg.checked_in && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: 'rgb(0,210,110)' }} />
              <span className="text-xs font-bold" style={{ color: 'rgb(0,210,110)' }}>Checked In</span>
            </div>
          )}
        </div>

        {/* QR button */}
        {reg.qr_code && !isCancelled && (
          <button
            onClick={() => onShowQR(reg)}
            className="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl"
            style={{ background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            <QrCode className="w-5 h-5" style={{ color: '#BFFF00' }} />
            <span className="text-xs font-bold" style={{ color: '#BFFF00', fontSize: 9 }}>QR</span>
          </button>
        )}
      </div>

      {/* Payment upload section */}
      {category?.price > 0 && reg.payment_status !== 'paid' && !isCancelled && (
        <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <PaymentUpload registration={reg} category={category} />
        </div>
      )}

      {/* Post-event result (shown after event date if result exists) */}
      {isConfirmed && event && (
        <PostEventResult registrationId={reg.id} userEmail={reg.user_email} event={event} />
      )}

      {/* Rewards section */}
      {reg.checked_in && (
        <div className="px-5 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <RewardSection registrationId={reg.id} userEmail={reg.user_email} />
        </div>
      )}
    </div>
  );
}
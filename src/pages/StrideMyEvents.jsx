import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, QrCode, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import QRModal from '@/components/stride/QRModal';

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)', Icon: Clock },
  confirmed: { label: 'Confirmed', color: 'rgb(0,210,110)',      bg: 'rgba(0,200,100,0.1)',   border: 'rgba(0,200,100,0.25)', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)',  border: 'rgba(255,80,80,0.2)',  Icon: XCircle },
  rejected:  { label: 'Rejected',  color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)',  border: 'rgba(255,80,80,0.2)',  Icon: XCircle },
};

function RegCard({ reg, event, category, onShowQR }) {
  const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;
  const Icon = cfg.Icon;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {event?.banner_image && (
        <img src={event.banner_image} alt={event.title} className="w-full object-cover" style={{ height: 80 }} />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base leading-tight">{event?.title || 'Loading...'}</p>
            {category && <p className="text-xs mt-0.5 font-semibold" style={{ color: '#BFFF00' }}>{category.name}</p>}
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
        </div>

        {event && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {format(new Date(event.event_date), 'EEE, MMM d, yyyy')}
              </span>
            </div>
            {event.location_name && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.location_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Bib + Check-in row */}
        <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Bib Number</p>
            <p className="text-lg font-black" style={{ color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.3)' }}>
              {reg.bib_number || '—'}
            </p>
          </div>
          {reg.checked_in && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,210,110,0.1)', border: '1px solid rgba(0,210,110,0.2)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'rgb(0,210,110)' }} />
              <span className="text-xs font-bold" style={{ color: 'rgb(0,210,110)' }}>Checked In</span>
            </div>
          )}
          {reg.qr_code && (reg.status === 'confirmed' || reg.status === 'pending') && (
            <button
              onClick={() => onShowQR(reg)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs"
              style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              <QrCode className="w-4 h-4" /> QR Code
            </button>
          )}
        </div>

        {reg.shirt_size && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Shirt: <span className="text-white font-semibold">{reg.shirt_size}</span></p>
        )}
      </div>
    </div>
  );
}

export default function StrideMyEvents() {
  const navigate = useNavigate();
  const [qrReg, setQrReg] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['my-stride-regs', user?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ user_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const eventIds = [...new Set(regs.map(r => r.event_id))];
  const categoryIds = [...new Set(regs.map(r => r.category_id))];

  const { data: events = [] } = useQuery({
    queryKey: ['stride-events-my', eventIds.join(',')],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 100),
    enabled: eventIds.length > 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['stride-cats-my', categoryIds.join(',')],
    queryFn: () => base44.entities.EventCategory.list('-created_date', 200),
    enabled: categoryIds.length > 0,
  });

  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const qrEvent = qrReg ? eventMap[qrReg.event_id] : null;
  const qrCat = qrReg ? catMap[qrReg.category_id] : null;

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
          <h1 className="text-xl font-bold">My Registrations</h1>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} /></div>
        )}
        {!isLoading && regs.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-3xl mb-3">🏅</p>
            <p className="text-sm font-semibold text-white mb-1">No registrations yet</p>
            <button onClick={() => navigate('/StrideEvents')} className="mt-3 text-sm font-bold" style={{ color: '#BFFF00' }}>Browse Events →</button>
          </div>
        )}
        {regs.map(reg => (
          <RegCard
            key={reg.id}
            reg={reg}
            event={eventMap[reg.event_id]}
            category={catMap[reg.category_id]}
            onShowQR={setQrReg}
          />
        ))}
      </div>

      {qrReg && (
        <QRModal
          registration={qrReg}
          event={qrEvent}
          category={qrCat}
          onClose={() => setQrReg(null)}
        />
      )}
    </div>
  );
}
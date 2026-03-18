import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import QRModal from '@/components/stride/QRModal';
import RaceTicket from '@/components/stride/RaceTicket.jsx';

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
          <RaceTicket
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
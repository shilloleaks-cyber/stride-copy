import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import QRModal from '@/components/stride/QRModal';
import RaceTicket from '@/components/stride/RaceTicket.jsx';
import RSVPCard from '@/components/stride/RSVPCard.jsx';

export default function StrideMyEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrReg, setQrReg] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['my-stride-regs', user?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ user_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  // Split registrations into official tickets vs community RSVPs
  const officialRegs = regs.filter(r => r.category_id !== 'rsvp' && r.status !== 'cancelled');
  const rsvpRegs = regs.filter(r => r.category_id === 'rsvp' && r.status !== 'cancelled');

  const eventIds = [...new Set(regs.map(r => r.event_id))];
  const categoryIds = [...new Set(officialRegs.map(r => r.category_id))];

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

  const cancelRsvpMutation = useMutation({
    mutationFn: (regId) => base44.entities.EventRegistration.update(regId, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stride-regs', user?.email] });
    },
  });

  const qrEvent = qrReg ? eventMap[qrReg.event_id] : null;
  const qrCat = qrReg ? catMap[qrReg.category_id] : null;

  const isEmpty = !isLoading && officialRegs.length === 0 && rsvpRegs.length === 0;

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
          <h1 className="text-xl font-bold">My Events</h1>
        </div>
      </div>

      <div className="px-6 pt-5">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
          </div>
        )}

        {isEmpty && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-3xl mb-3">🏅</p>
            <p className="text-sm font-semibold text-white mb-1">No events yet</p>
            <button onClick={() => navigate('/StrideEvents')} className="mt-3 text-sm font-bold" style={{ color: '#BFFF00' }}>
              Browse Events →
            </button>
          </div>
        )}

        {/* Official Event Tickets */}
        {officialRegs.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              My Event Tickets
            </p>
            <div className="space-y-4">
              {officialRegs.map(reg => (
                <RaceTicket
                  key={reg.id}
                  reg={reg}
                  event={eventMap[reg.event_id]}
                  category={catMap[reg.category_id]}
                  onShowQR={setQrReg}
                />
              ))}
            </div>
          </div>
        )}

        {/* Community RSVPs */}
        {rsvpRegs.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
              My Community RSVPs
            </p>
            <div className="space-y-3">
              {rsvpRegs.map(reg => (
                <RSVPCard
                  key={reg.id}
                  reg={reg}
                  event={eventMap[reg.event_id]}
                  onCancel={() => cancelRsvpMutation.mutate(reg.id)}
                  isCancelling={cancelRsvpMutation.isPending && cancelRsvpMutation.variables === reg.id}
                />
              ))}
            </div>
          </div>
        )}
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
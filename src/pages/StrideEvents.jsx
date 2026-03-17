import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Search, ChevronRight, Star } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLE = {
  open:      { label: 'Open',      bg: 'rgba(0,210,110,0.15)',  color: 'rgb(0,210,110)',     border: 'rgba(0,210,110,0.3)' },
  closed:    { label: 'Closed',    bg: 'rgba(255,80,80,0.12)',  color: 'rgba(255,120,120,1)',border: 'rgba(255,80,80,0.25)' },
  completed: { label: 'Completed', bg: 'rgba(138,43,226,0.15)', color: '#BFFF00',            border: 'rgba(138,43,226,0.3)' },
  draft:     { label: 'Draft',     bg: 'rgba(255,255,255,0.06)',color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
  cancelled: { label: 'Cancelled', bg: 'rgba(255,80,80,0.08)',  color: 'rgba(255,100,100,0.6)', border: 'rgba(255,80,80,0.15)' },
};

function EventCard({ event, myRegistration, onClick }) {
  const s = STATUS_STYLE[event.status] || STATUS_STYLE.draft;
  const isRegistered = !!myRegistration;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {event.banner_image ? (
        <img src={event.banner_image} alt={event.title} className="w-full object-cover" style={{ height: 140 }} />
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 100, background: 'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(191,255,0,0.1))' }}>
          <Star className="w-10 h-10" style={{ color: 'rgba(191,255,0,0.2)' }} />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-white text-base leading-tight flex-1">{event.title}</p>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
              {s.label}
            </span>
            {isRegistered && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }}>
                Registered
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
              {event.start_time ? ` · ${event.start_time}` : ''}
            </span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{event.location_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {event.total_registered || 0} registered
              {event.max_participants > 0 ? ` · ${event.max_participants} max` : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StrideEvents() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['stride-events'],
    queryFn: () => base44.entities.StrideEvent.filter({ status: 'open' }, '-event_date', 50),
  });

  const { data: myRegs = [] } = useQuery({
    queryKey: ['my-stride-regs', user?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myRegMap = Object.fromEntries(myRegs.map(r => [r.event_id, r]));

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-10 pb-4" style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Stride</p>
            <h1 className="text-2xl font-bold text-white">Events</h1>
          </div>
          <button
            onClick={() => navigate('/StrideMyEvents')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            My Events
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      </div>

      <div className="px-6 pt-5 space-y-4">
        {isLoading && (
          <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading events...</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-3xl mb-3">🏃</p>
            <p className="text-sm font-semibold text-white mb-1">No open events</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Check back soon for upcoming races</p>
          </div>
        )}
        {filtered.map(event => (
          <EventCard
            key={event.id}
            event={event}
            myRegistration={myRegMap[event.id]}
            onClick={() => navigate(`/StrideEventDetail?id=${event.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
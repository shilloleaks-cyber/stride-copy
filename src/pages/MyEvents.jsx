import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Star, CalendarDays, CheckCircle2, Gift, Ticket } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_BADGE = {
  joined:     { label: 'Joined',      bg: 'rgba(138,43,226,0.2)',  color: '#BFFF00',              border: 'rgba(191,255,0,0.2)' },
  registered: { label: 'Registered',  bg: 'rgba(191,255,0,0.12)', color: '#BFFF00',              border: 'rgba(191,255,0,0.3)' },
  checked_in: { label: 'Checked In',  bg: 'rgba(0,200,100,0.15)', color: 'rgb(0,220,120)',        border: 'rgba(0,200,100,0.3)' },
  cancelled:  { label: 'Cancelled',   bg: 'rgba(255,80,80,0.12)', color: 'rgba(255,120,120,1)',   border: 'rgba(255,80,80,0.25)' },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.joined;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status === 'checked_in' && <CheckCircle2 className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

function MyEventCard({ event, participation, onClick }) {
  const isOfficial = event.event_kind === 'official';
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all flex"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: isOfficial ? '1px solid rgba(191,255,0,0.15)' : '1px solid rgba(255,255,255,0.08)',
        minHeight: '110px',
      }}
    >
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isOfficial && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              <Star className="w-3 h-3" />
              Official
            </span>
          )}
          <StatusBadge status={participation.status} />
        </div>

        <p className="font-bold text-white text-sm leading-tight mb-2 line-clamp-2">{event.title}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {format(new Date(event.start_at), 'EEE, MMM d · h:mm a')}
            </span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.location_name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 w-20 m-3 rounded-xl overflow-hidden" style={{ minHeight: '86px' }}>
        {event.banner_image ? (
          <img src={event.banner_image} alt={event.title} className="w-full h-full object-cover" style={{ minHeight: '86px' }} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: isOfficial ? 'rgba(191,255,0,0.07)' : 'rgba(255,255,255,0.05)', minHeight: '86px' }}
          >
            {isOfficial
              ? <Star className="w-6 h-6" style={{ color: 'rgba(191,255,0,0.25)' }} />
              : <CalendarDays className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.15)' }} />
            }
          </div>
        )}
      </div>
    </button>
  );
}

export default function MyEvents() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // All my participations
  const { data: myParticipations = [], isLoading } = useQuery({
    queryKey: ['my-participations', user?.email],
    queryFn: () => base44.entities.EventParticipant.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const activeParticipations = myParticipations.filter(p => p.status !== 'cancelled');
  const eventIds = [...new Set(activeParticipations.map(p => p.event_id))];

  // Fetch all relevant events
  const { data: allEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['my-events-detail', eventIds.join(',')],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-start_at', 100),
    enabled: eventIds.length > 0,
  });

  const myEventMap = Object.fromEntries(allEvents.filter(e => eventIds.includes(e.id)).map(e => [e.id, e]));
  const participationMap = Object.fromEntries(activeParticipations.map(p => [p.event_id, p]));

  const officialEntries = activeParticipations.filter(p => {
    const ev = myEventMap[p.event_id];
    return ev && ev.event_kind === 'official' && (p.status === 'registered' || p.status === 'checked_in');
  });

  const communityEntries = activeParticipations.filter(p => {
    const ev = myEventMap[p.event_id];
    return ev && ev.event_kind === 'group' && p.status === 'joined';
  });

  const goToDetail = (id) => navigate(createPageUrl('EventDetail') + '?id=' + id);
  const stillLoading = isLoading || loadingEvents;

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
          <h1 className="text-xl font-bold text-white leading-tight">Events</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate('/StrideMyEvents')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs"
            style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.35)' }}
          >
            <Ticket className="w-3.5 h-3.5" />
            E-Ticket
          </button>
          <button
            onClick={() => navigate(createPageUrl('MyRewards'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs"
            style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            <Gift className="w-3.5 h-3.5" />
            Rewards
          </button>
        </div>
      </div>

      {stillLoading && (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>
      )}

      {!stillLoading && (
        <div className="px-6 pt-6 space-y-8">

          {/* Official Events */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Official Events</p>
              {officialEntries.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  {officialEntries.length}
                </span>
              )}
            </div>
            {officialEntries.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(191,255,0,0.03)', border: '1px dashed rgba(191,255,0,0.1)' }}>
                <p className="text-2xl mb-2">🏅</p>
                <p className="text-sm font-semibold text-white mb-1">No official events yet</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Register for an official event to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {officialEntries.map(p => {
                  const ev = myEventMap[p.event_id];
                  if (!ev) return null;
                  return <MyEventCard key={p.id} event={ev} participation={p} onClick={() => goToDetail(ev.id)} />;
                })}
              </div>
            )}
          </div>

          {/* Community Events */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Community Events</p>
              {communityEntries.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  {communityEntries.length}
                </span>
              )}
            </div>
            {communityEntries.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                <p className="text-2xl mb-2">🏃</p>
                <p className="text-sm font-semibold text-white mb-1">No community events</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Join a group event to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {communityEntries.map(p => {
                  const ev = myEventMap[p.event_id];
                  if (!ev) return null;
                  return <MyEventCard key={p.id} event={ev} participation={p} onClick={() => goToDetail(ev.id)} />;
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
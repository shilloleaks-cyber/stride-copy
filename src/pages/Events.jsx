import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Users, Calendar, CalendarDays, Star, Bookmark } from 'lucide-react';
import { format } from 'date-fns';

function EventCard({ event, groupMap, onClick }) {
  const isOfficial = event.event_kind === 'official';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all flex"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: isOfficial
          ? '1px solid rgba(191,255,0,0.18)'
          : '1px solid rgba(255,255,255,0.08)',
        minHeight: '130px',
      }}
    >
      {/* Left: info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isOfficial && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.3)' }}
            >
              <Star className="w-3 h-3" />
              Official
            </span>
          )}
          {!isOfficial && groupMap[event.group_id] && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block"
              style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              {groupMap[event.group_id]}
            </span>
          )}
        </div>

        <p className="font-bold text-white text-base leading-tight mb-2 line-clamp-2">{event.title}</p>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {format(new Date(event.start_at), 'EEE, MMM d · h:mm a')}
            </span>
          </div>
          {event.location_name && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.location_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {event.attendee_count || 0} {isOfficial ? 'registered' : 'joined'}
              {event.max_attendees ? ` · max ${event.max_attendees}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Right: banner thumbnail */}
      <div className="flex-shrink-0 w-24 m-3 rounded-xl overflow-hidden" style={{ minHeight: '104px' }}>
        {event.banner_image ? (
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ minHeight: '104px' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: isOfficial
                ? 'rgba(191,255,0,0.07)'
                : 'rgba(255,255,255,0.06)',
              minHeight: '104px',
            }}
          >
            {isOfficial
              ? <Star className="w-7 h-7" style={{ color: 'rgba(191,255,0,0.3)' }} />
              : <CalendarDays className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
            }
          </div>
        )}
      </div>
    </button>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {title}
      </p>
      {count > 0 && (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['group-memberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const groupIds = memberships.map(m => m.group_id);

  // Official events: fetch all public/published official events
  const { data: officialEvents = [], isLoading: loadingOfficial } = useQuery({
    queryKey: ['official-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'published', event_kind: 'official' }, '-start_at', 50),
    enabled: !!user,
  });

  // Community (group) events: only from user's groups
  const { data: allGroupEvents = [], isLoading: loadingGroup } = useQuery({
    queryKey: ['group-events', groupIds.join(',')],
    queryFn: () => base44.entities.Event.filter({ status: 'published', event_kind: 'group' }, '-start_at', 50),
    enabled: groupIds.length > 0,
  });

  const groupEvents = allGroupEvents.filter(e => groupIds.includes(e.group_id));

  const { data: groups = [] } = useQuery({
    queryKey: ['groups-for-events'],
    queryFn: () => base44.entities.Group.list('-created_date', 100),
    enabled: groupIds.length > 0,
  });

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
  const isLoading = loadingOfficial || loadingGroup;

  const goToDetail = (id) => navigate(createPageUrl('EventDetail') + '?id=' + id);

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Discover</p>
            <h1 className="text-3xl font-bold text-white">Events</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('MyEvents'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Mine
            </button>
            <button
              onClick={() => navigate(createPageUrl('CreateOfficialEvent'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs"
              style={{ backgroundColor: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }}
            >
              <Star className="w-3.5 h-3.5" />
              Official
            </button>
            <button
              onClick={() => navigate(createPageUrl('CreateEvent'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs"
              style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Group
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading events...</div>
      )}

      {!isLoading && (
        <div className="px-6 space-y-8">

          {/* Official Events Section */}
          <div>
            <SectionHeader title="Official Events" count={officialEvents.length} />
            {officialEvents.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(191,255,0,0.04)', border: '1px dashed rgba(191,255,0,0.12)' }}
              >
                <p className="text-2xl mb-2">🏅</p>
                <p className="text-sm font-semibold text-white mb-1">No official events yet</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Official races and events will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {officialEvents.map(event => (
                  <EventCard key={event.id} event={event} groupMap={groupMap} onClick={() => goToDetail(event.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Community Events Section */}
          <div>
            <SectionHeader title="Community Events" count={groupEvents.length} />
            {groupEvents.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
              >
                <p className="text-2xl mb-2">🏃</p>
                <p className="text-sm font-semibold text-white mb-1">No community events</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {groupIds.length === 0 ? 'Join a group to see community events' : 'Create your first group event'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupEvents.map(event => (
                  <EventCard key={event.id} event={event} groupMap={groupMap} onClick={() => goToDetail(event.id)} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
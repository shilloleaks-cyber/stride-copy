import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, MapPin, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Events() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Get all groups the user is a member of
  const { data: memberships = [] } = useQuery({
    queryKey: ['group-memberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const groupIds = memberships.map(m => m.group_id);

  // Fetch all published events, then filter to user's groups
  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['events', groupIds.join(',')],
    queryFn: () => base44.entities.Event.filter({ status: 'published' }, '-start_at', 50),
    enabled: groupIds.length > 0,
  });

  const events = allEvents.filter(e => groupIds.includes(e.group_id));

  // Fetch group names for display
  const { data: groups = [] } = useQuery({
    queryKey: ['groups-for-events'],
    queryFn: () => base44.entities.Group.list('-created_date', 100),
    enabled: groupIds.length > 0,
  });

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Community</p>
            <h1 className="text-3xl font-bold text-white">Events</h1>
          </div>
          <button
            onClick={() => navigate(createPageUrl('CreateEvent'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 space-y-4">
        {isLoading && (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading events...</div>
        )}

        {!isLoading && events.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-3xl mb-3">🏃</p>
            <p className="font-semibold text-white mb-1">No upcoming events</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Join a group or create your first event
            </p>
          </div>
        )}

        {events.map(event => (
          <button
            key={event.id}
            onClick={() => navigate(createPageUrl(`EventDetail?id=${event.id}`))}
            className="w-full text-left rounded-2xl p-5 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Group badge */}
            {groupMap[event.group_id] && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full mb-3 inline-block"
                style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
              >
                {groupMap[event.group_id]}
              </span>
            )}

            <h3 className="text-lg font-bold text-white mb-3">{event.title}</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#BFFF00' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {format(new Date(event.start_at), 'EEE, MMM d · h:mm a')}
                </span>
              </div>
              {event.location_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{event.location_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {event.attendee_count || 0} joined
                  {event.max_attendees ? ` · max ${event.max_attendees}` : ''}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const results = await base44.entities.Event.filter({ id: eventId });
      return results[0] || null;
    },
    enabled: !!eventId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: () => base44.entities.EventParticipant.filter({ event_id: eventId, status: 'joined' }),
    enabled: !!eventId,
  });

  const { data: group } = useQuery({
    queryKey: ['event-group', event?.group_id],
    queryFn: async () => {
      const results = await base44.entities.Group.filter({ id: event.group_id });
      return results[0] || null;
    },
    enabled: !!event?.group_id,
  });

  const alreadyJoined = participants.some(p => p.user_email === user?.email);
  const isFull = event?.max_attendees > 0 && participants.length >= event.max_attendees;

  const handleJoin = async () => {
    if (!user || alreadyJoined || isFull) return;
    setIsJoining(true);

    await base44.entities.EventParticipant.create({
      event_id: eventId,
      user_email: user.email,
      user_name: user.full_name,
      status: 'joined',
    });

    await base44.entities.Event.update(eventId, {
      attendee_count: (event.attendee_count || 0) + 1,
    });

    queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    setIsJoining(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#BFFF00' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-lg">Event not found</p>
        <button onClick={() => navigate(createPageUrl('Events'))} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>
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
        <h1 className="text-lg font-bold truncate">{event.title}</h1>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Group badge */}
        {group && (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
            style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            {group.name}
          </span>
        )}

        {/* Title */}
        <h2 className="text-2xl font-bold text-white">{event.title}</h2>

        {/* Meta */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(191,255,0,0.12)' }}>
              <Calendar className="w-5 h-5" style={{ color: '#BFFF00' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Date & Time</p>
              <p className="text-white font-semibold">{format(new Date(event.start_at), 'EEEE, MMMM d · h:mm a')}</p>
            </div>
          </div>

          {event.location_name && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(138,43,226,0.12)' }}>
                <MapPin className="w-5 h-5" style={{ color: '#8A2BE2' }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Location</p>
                <p className="text-white font-semibold">{event.location_name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <Users className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Attendees</p>
              <p className="text-white font-semibold">
                {participants.length} joined
                {event.max_attendees > 0 ? ` · ${event.max_attendees} max` : ' · Unlimited'}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>About</p>
            <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{event.description}</p>
          </div>
        )}

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Participants ({participants.length})
            </p>
            <div className="space-y-2">
              {participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(138,43,226,0.3)', color: '#BFFF00' }}
                  >
                    {(p.user_name || p.user_email || '?')[0].toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-white">{p.user_name || p.user_email}</p>
                  {p.user_email === event.created_by_user_email && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00' }}>
                      Organizer
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Join Button */}
      {event.status === 'published' && (
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-2">
          <button
            onClick={handleJoin}
            disabled={isJoining || alreadyJoined || isFull}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={
              alreadyJoined
                ? { background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }
                : isFull
                ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
                : { background: '#BFFF00', color: '#0A0A0A' }
            }
          >
            {isJoining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : alreadyJoined ? (
              <><CheckCircle2 className="w-5 h-5" /> You're in!</>
            ) : isFull ? (
              'Event Full'
            ) : (
              'Join Event'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
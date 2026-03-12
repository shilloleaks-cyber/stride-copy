import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Loader2, CheckCircle2, CalendarDays, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isActing, setIsActing] = useState(false);

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

  const isOfficial = event?.event_kind === 'official';

  // Fetch participants - for official events also look for "registered" status
  const { data: participants = [] } = useQuery({
    queryKey: ['event-participants', eventId],
    queryFn: () => base44.entities.EventParticipant.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const activeParticipants = participants.filter(p => p.status === 'joined' || p.status === 'registered');

  const { data: group } = useQuery({
    queryKey: ['event-group', event?.group_id],
    queryFn: async () => {
      const results = await base44.entities.Group.filter({ id: event.group_id });
      return results[0] || null;
    },
    enabled: !!event?.group_id,
  });

  const alreadyParticipating = activeParticipants.some(p => p.user_email === user?.email);
  const isFull = event?.max_attendees > 0 && activeParticipants.length >= event.max_attendees;

  const handleAction = async () => {
    if (!user || alreadyParticipating || isFull) return;
    setIsActing(true);

    const participantStatus = isOfficial ? 'registered' : 'joined';

    await base44.entities.EventParticipant.create({
      event_id: eventId,
      user_email: user.email,
      user_name: user.full_name,
      status: participantStatus,
    });

    await base44.entities.Event.update(eventId, {
      attendee_count: (event.attendee_count || 0) + 1,
    });

    queryClient.invalidateQueries({ queryKey: ['event-participants', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    setIsActing(false);
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

  // Button state
  const actionLabel = isOfficial ? 'Register' : 'Join Event';
  const confirmedLabel = isOfficial ? 'Registered!' : "You're in!";

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Banner */}
      <div className="relative w-full" style={{ height: '220px' }}>
        {event.banner_image ? (
          <img src={event.banner_image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: isOfficial
                ? 'linear-gradient(135deg, rgba(191,255,0,0.15) 0%, rgba(10,10,10,1) 100%)'
                : 'linear-gradient(135deg, rgba(138,43,226,0.25) 0%, rgba(10,10,10,1) 100%)',
            }}
          >
            {isOfficial
              ? <Star className="w-16 h-16" style={{ color: 'rgba(191,255,0,0.15)' }} />
              : <CalendarDays className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.12)' }} />
            }
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(10,10,10,0.9) 100%)' }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-6 pt-4 space-y-6">
        {/* Kind + Group badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOfficial ? (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1"
              style={{ background: 'rgba(191,255,0,0.15)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.3)' }}
            >
              <Star className="w-3 h-3" />
              Official Event
            </span>
          ) : group ? (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
              style={{ background: 'rgba(138,43,226,0.2)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
            >
              {group.name}
            </span>
          ) : null}
          {event.registration_required && isOfficial && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Registration Required
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white">{event.title}</h2>

        {/* Meta card */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(191,255,0,0.12)' }}>
              <Calendar className="w-5 h-5" style={{ color: '#BFFF00' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Start</p>
              <p className="text-white font-semibold">{format(new Date(event.start_at), 'EEEE, MMMM d · h:mm a')}</p>
            </div>
          </div>

          {event.end_at && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(138,43,226,0.12)' }}>
                <Clock className="w-5 h-5" style={{ color: '#8A2BE2' }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>End</p>
                <p className="text-white font-semibold">{format(new Date(event.end_at), 'EEEE, MMMM d · h:mm a')}</p>
              </div>
            </div>
          )}

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
              <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isOfficial ? 'Registered' : 'Attendees'}
              </p>
              <p className="text-white font-semibold">
                {activeParticipants.length} {isOfficial ? 'registered' : 'joined'}
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
        {activeParticipants.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isOfficial ? 'Registered Participants' : 'Participants'} ({activeParticipants.length})
            </p>
            <div className="space-y-2">
              {activeParticipants.map(p => (
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

      {/* Action Button */}
      {event.status === 'published' && (
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-2">
          <button
            onClick={handleAction}
            disabled={isActing || alreadyParticipating || isFull}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={
              alreadyParticipating
                ? { background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }
                : isFull
                ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }
                : { background: '#BFFF00', color: '#0A0A0A' }
            }
          >
            {isActing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : alreadyParticipating ? (
              <><CheckCircle2 className="w-5 h-5" /> {confirmedLabel}</>
            ) : isFull ? (
              'Event Full'
            ) : (
              actionLabel
            )}
          </button>
        </div>
      )}
    </div>
  );
}
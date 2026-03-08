import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isAfter, parseISO } from 'date-fns';
import { toast } from 'sonner';

function EventCard({ event, currentUser, groupId }) {
  const queryClient = useQueryClient();
  const isUpcoming = isAfter(parseISO(event.event_date), new Date());
  const attendees = event.attendee_emails || [];
  const isJoined = attendees.includes(currentUser?.email);
  const isFull = event.max_attendees && attendees.length >= event.max_attendees;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const updated = isJoined
        ? attendees.filter(e => e !== currentUser.email)
        : [...attendees, currentUser.email];
      await base44.entities.GroupEvent.update(event.id, { attendee_emails: updated });
    },
    onSuccess: () => {
      toast.success(isJoined ? 'Left event' : 'Joined event!');
      queryClient.invalidateQueries({ queryKey: ['groupEvents', groupId] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: isUpcoming ? 'rgba(30,30,30,0.7)' : 'rgba(20,20,20,0.5)',
        border: isUpcoming ? '1px solid rgba(138,43,226,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: isUpcoming ? '#8A2BE2' : 'rgba(255,255,255,0.3)' }} />
            <h4 className="text-white font-bold text-sm truncate">{event.title}</h4>
            {!isUpcoming && (
              <span className="text-xs px-2 py-0.5 rounded-full ml-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>Past</span>
            )}
          </div>
          {event.description && <p className="text-xs ml-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.description}</p>}
        </div>

        {isUpcoming && currentUser && (
          <Button
            size="sm"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending || (isFull && !isJoined)}
            className="ml-2 flex-shrink-0 h-8 text-xs font-bold"
            style={{
              background: isJoined ? 'rgba(255,255,255,0.1)' : '#8A2BE2',
              color: isJoined ? 'rgba(255,255,255,0.7)' : 'white',
              border: isJoined ? '1px solid rgba(255,255,255,0.15)' : 'none',
            }}
          >
            {isJoined ? 'Leave' : isFull ? 'Full' : 'Join'}
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 ml-6">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-white text-xs">{format(parseISO(event.event_date), 'EEE, MMM d yyyy • h:mm a')}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-xs text-white">{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {attendees.length} attending
            {event.max_attendees ? ` / ${event.max_attendees} max` : ''}
          </span>
          {isJoined && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#BFFF00' }} />}
        </div>
      </div>

      {/* Attendee avatars */}
      {attendees.length > 0 && (
        <div className="flex items-center gap-1 mt-3 ml-6">
          {attendees.slice(0, 6).map((email, i) => (
            <div
              key={email}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 -ml-1 first:ml-0"
              style={{
                background: 'linear-gradient(135deg, #8A2BE2, #5B1FA0)',
                borderColor: '#0A0A0A',
                zIndex: 6 - i,
              }}
            >
              {email[0].toUpperCase()}
            </div>
          ))}
          {attendees.length > 6 && (
            <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>+{attendees.length - 6}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function EventsTab({ groupId, currentUser, onCreateEvent }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: groupId }, 'event_date'),
    enabled: !!groupId,
  });

  const upcoming = events.filter(e => e.event_date && isAfter(parseISO(e.event_date), new Date()));
  const past = events.filter(e => !upcoming.includes(e));

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#8A2BE2', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-3">
      <Button onClick={onCreateEvent} className="w-full h-12" style={{ background: '#8A2BE2', color: 'white' }}>
        <Calendar className="w-4 h-4 mr-2" />
        Schedule Event
      </Button>

      {upcoming.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#8A2BE2' }}>Upcoming</p>
          {upcoming.map(e => <EventCard key={e.id} event={e} currentUser={currentUser} groupId={groupId} />)}
        </>
      )}

      {past.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Past</p>
          {past.map(e => <EventCard key={e.id} event={e} currentUser={currentUser} groupId={groupId} />)}
        </>
      )}

      {events.length === 0 && (
        <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-4xl mb-3">📅</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No events yet</p>
        </div>
      )}
    </div>
  );
}
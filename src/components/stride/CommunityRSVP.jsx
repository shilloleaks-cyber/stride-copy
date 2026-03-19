import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunityRSVP({ event, user, myReg }) {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState(false);

  const rsvpMutation = useMutation({
    mutationFn: () => base44.entities.EventRegistration.create({
      event_id: event.id,
      category_id: 'rsvp',          // sentinel — not a real category
      user_email: user.email,
      first_name: user.full_name?.split(' ')[0] || user.email,
      last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
      status: 'confirmed',
      payment_status: 'not_required',
      qr_code: `rsvp-${event.id}-${user.email}-${Date.now()}`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reg', event.id, user.email] });
      queryClient.invalidateQueries({ queryKey: ['rsvp-count', event.id] });
      toast.success("You're going! 🎉");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => base44.entities.EventRegistration.update(myReg.id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reg', event.id, user.email] });
      queryClient.invalidateQueries({ queryKey: ['rsvp-count', event.id] });
      setLeaving(false);
      toast.success('RSVP cancelled');
    },
  });

  const { data: rsvpCount = 0 } = useQuery({
    queryKey: ['rsvp-count', event.id],
    queryFn: async () => {
      const r = await base44.entities.EventRegistration.filter({ event_id: event.id, status: 'confirmed' });
      return r.length;
    },
    enabled: !!event.id,
  });

  const isGoing = myReg?.status === 'confirmed';
  const isCancelled = myReg?.status === 'cancelled';

  return (
    <div>
      {/* Attendee count */}
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} going
        </span>
      </div>

      {/* Already going */}
      {isGoing && !leaving && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.22)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#BFFF00' }} />
            <p className="text-sm font-bold text-white">You're going!</p>
          </div>
          <button
            onClick={() => setLeaving(true)}
            className="text-xs font-semibold"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Can't make it? Cancel RSVP
          </button>
        </div>
      )}

      {/* Confirm cancel */}
      {isGoing && leaving && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.2)' }}>
          <p className="text-sm font-bold text-white mb-3">Cancel your RSVP?</p>
          <div className="flex gap-2">
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,80,80,0.15)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.25)' }}
            >
              {cancelMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Yes, cancel'}
            </button>
            <button
              onClick={() => setLeaving(false)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {/* CTA button */}
      {event.status === 'open' && (!myReg || isCancelled) && (
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-2">
          <button
            onClick={() => rsvpMutation.mutate()}
            disabled={rsvpMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={{ background: '#BFFF00', color: '#0A0A0A' }}
          >
            {rsvpMutation.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : "✋ I'm Going"
            }
          </button>
        </div>
      )}
    </div>
  );
}

// Need useQuery imported
import { useQuery } from '@tanstack/react-query';
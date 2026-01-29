import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CreateEventDialog({ open, onClose, groupId, user }) {
  const queryClient = useQueryClient();
  const [event, setEvent] = useState({
    title: '',
    description: '',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    max_attendees: null,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupEvent.create({
        group_id: groupId,
        ...event,
        creator_email: user.email,
        creator_name: user.full_name,
        attendee_emails: [user.email],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupEvents']);
      toast.success('Event created!');
      onClose();
      setEvent({
        title: '',
        description: '',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        location: '',
        max_attendees: null,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Event Title</label>
            <Input
              value={event.title}
              onChange={(e) => setEvent({ ...event, title: e.target.value })}
              placeholder="e.g., Saturday Morning Run"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <Textarea
              value={event.description}
              onChange={(e) => setEvent({ ...event, description: e.target.value })}
              placeholder="Event details..."
              className="bg-white/5 border-white/10 text-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Location</label>
            <Input
              value={event.location}
              onChange={(e) => setEvent({ ...event, location: e.target.value })}
              placeholder="e.g., Lumphini Park"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Date & Time</label>
            <Input
              type="datetime-local"
              value={event.event_date}
              onChange={(e) => setEvent({ ...event, event_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Max Attendees (optional)</label>
            <Input
              type="number"
              value={event.max_attendees || ''}
              onChange={(e) => setEvent({ ...event, max_attendees: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="No limit"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!event.title || !event.location || createMutation.isPending}
            className="w-full h-12"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            Create Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
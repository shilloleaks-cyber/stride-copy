import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function RSVPCard({ reg, event, onCancel, isCancelling }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (!event) return null;

  const eventDate = event.event_date ? format(new Date(event.event_date), 'EEE, MMM d, yyyy') : null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/StrideEventDetail?id=${event.id}`)}
            className="text-left"
          >
            <p className="font-bold text-white text-base leading-tight">{event.title}</p>
          </button>
        </div>
        {/* RSVP badge */}
        <span
          className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: 'rgba(191,255,0,0.12)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.25)' }}
        >
          <CheckCircle2 className="w-3 h-3" /> Going
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 mb-4">
        {eventDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {eventDate}{event.start_time ? ` · ${event.start_time}` : ''}
            </span>
          </div>
        )}
        {event.location_name && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{event.location_name}</span>
          </div>
        )}
      </div>

      {/* Cancel action */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-semibold"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Can't make it? Cancel RSVP
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => { onCancel(); setConfirming(false); }}
            disabled={isCancelling}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center"
            style={{ background: 'rgba(255,80,80,0.12)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.22)' }}
          >
            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, cancel'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
          >
            Never mind
          </button>
        </div>
      )}
    </div>
  );
}
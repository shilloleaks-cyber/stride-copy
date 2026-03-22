import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Star } from 'lucide-react';

/**
 * Shared EventCard component used across the entire app.
 * Props:
 *   event       - StrideEvent record
 *   isRegistered - boolean (optional)
 *   onClick     - override default navigate (optional)
 */
export default function EventCard({ event, isRegistered, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    navigate(`/StrideEventDetail?id=${event.id}`);
  };

  // Badge
  const isOfficial = event.event_type === 'official' || !event.event_type;
  const badgeLabel = isOfficial ? 'Official' : 'Group';
  const badgeStyle = isOfficial
    ? { background: 'rgba(191,255,0,0.15)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00' }
    : { background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)', color: 'rgba(180,120,255,1)' };

  // Date string
  let dateStr = '';
  try {
    if (event.event_date) {
      const d = new Date(event.event_date);
      dateStr = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
      if (event.start_time) dateStr += ` · ${event.start_time}`;
    }
  } catch (_) {}

  return (
    <button
      onClick={handleClick}
      className="w-full text-left transition-all active:scale-[0.98]"
      style={{
        background: '#1A1A1A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 44,
      }}
    >
      {/* Left: event info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 700,
            padding: '4px 10px', borderRadius: 99,
            ...badgeStyle,
          }}>
            {isOfficial && <Star style={{ width: 10, height: 10, fill: '#BFFF00' }} />}
            {badgeLabel}
          </span>
          {isRegistered && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.25)',
              color: '#BFFF00', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 99,
            }}>
              Registered
            </span>
          )}
        </div>

        {/* Title */}
        <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.25 }}>
          {event.title}
        </p>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Calendar style={{ width: 13, height: 13, color: '#BFFF00', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dateStr}
              </span>
            </div>
          )}
          {event.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.location_name}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Users style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {event.total_registered || 0} registered
              {event.max_participants > 0 ? ` · max ${event.max_participants}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Right: portrait poster — fixed size, never affected by image ratio */}
      <div style={{
        flexShrink: 0,
        width: 100,
        height: 140,
        borderRadius: 18,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        alignSelf: 'center',
      }}>
        {event.banner_image
          ? <img
              src={event.banner_image}
              alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          : <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, rgba(138,43,226,0.3), rgba(191,255,0,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Star style={{ width: 28, height: 28, color: 'rgba(191,255,0,0.25)' }} />
            </div>
        }
      </div>
    </button>
  );
}
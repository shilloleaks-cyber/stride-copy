import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Settings } from 'lucide-react';
import { isEventOwner } from '@/lib/eventOwner';

export default function StrideAdminEvents() {
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  // Fetch all events where creator_email matches — also falls back client-side via isEventOwner
  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['admin-all-events', user?.email],
    queryFn: () => base44.entities.StrideEvent.list('-created_date', 100),
    enabled: !!user?.email,
  });

  // Filter client-side using the robust isEventOwner helper
  const myEvents = allEvents.filter(ev => isEventOwner(ev, user));

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Events
        </button>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(191,255,0,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Admin Hub
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>My Events</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Manage events you've created
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
        ) : myEvents.length === 0 ? (
          <div style={{
            borderRadius: 20, padding: '40px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🗂️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>No events yet</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Events you create will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myEvents.map(ev => (
              <EventAdminCard key={ev.id} event={ev} onOpen={() => navigate(`/EventWorkspace?event_id=${ev.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventAdminCard({ event, onOpen }) {
  const statusColors = {
    draft:     { bg: 'rgba(255,180,0,0.1)',   border: 'rgba(255,180,0,0.25)',   color: 'rgba(255,180,0,0.9)' },
    open:      { bg: 'rgba(191,255,0,0.08)',  border: 'rgba(191,255,0,0.25)',   color: '#BFFF00' },
    closed:    { bg: 'rgba(255,255,255,0.06)',border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' },
    completed: { bg: 'rgba(138,43,226,0.1)',  border: 'rgba(138,43,226,0.3)',   color: 'rgba(180,100,255,0.9)' },
    cancelled: { bg: 'rgba(255,60,60,0.08)',  border: 'rgba(255,60,60,0.2)',    color: 'rgba(255,100,100,0.85)' },
  };
  const sc = statusColors[event.status] || statusColors.draft;

  return (
    <div style={{
      borderRadius: 18, padding: '16px',
      background: 'rgba(22,22,22,0.9)', border: '1px solid rgba(138,43,226,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {event.status}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {event.event_type || 'official'}
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>{event.title}</p>
          {event.event_date && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>📅 {event.event_date}</p>}
          {event.location_name && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>📍 {event.location_name}</p>}
        </div>
        <button
          onClick={onOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 12, flexShrink: 0,
            background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)',
            color: '#BFFF00', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Settings style={{ width: 13, height: 13 }} />
          Open Admin
        </button>
      </div>
      {event.total_registered > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{event.total_registered}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registered</p>
        </div>
      )}
    </div>
  );
}
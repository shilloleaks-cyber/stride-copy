import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Settings, CalendarDays, MapPin, Plus } from 'lucide-react';
import { isEventOwner } from '@/lib/eventOwner';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

const STATUS_CFG = {
  draft:     { bg: 'rgba(255,180,0,0.1)',   border: 'rgba(255,180,0,0.25)',   color: 'rgba(255,180,0,0.9)',   label: 'Draft' },
  open:      { bg: 'rgba(191,255,0,0.08)',  border: 'rgba(191,255,0,0.25)',   color: '#BFFF00',               label: 'Open' },
  closed:    { bg: 'rgba(255,255,255,0.06)',border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)',label: 'Closed' },
  completed: { bg: 'rgba(138,43,226,0.1)',  border: 'rgba(138,43,226,0.3)',   color: 'rgba(180,100,255,0.9)', label: 'Completed' },
  cancelled: { bg: 'rgba(255,60,60,0.08)',  border: 'rgba(255,60,60,0.2)',    color: 'rgba(255,100,100,0.85)',label: 'Cancelled' },
};

function EventAdminCard({ event, onOpen, liveCount }) {
  const sc = STATUS_CFG[event.status] || STATUS_CFG.draft;
  const hasDate = !!event.event_date;

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: 'rgba(22,22,22,0.95)',
      border: '1px solid rgba(191,255,0,0.12)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      {/* Banner */}
      {event.banner_image ? (
        <div style={{ height: 88, overflow: 'hidden', position: 'relative' }}>
          <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(22,22,22,0.97))' }} />
          <span style={{
            position: 'absolute', bottom: 8, left: 12,
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
            background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{sc.label}</span>
        </div>
      ) : (
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${sc.color}40, transparent)`,
        }} />
      )}

      <div style={{ padding: '14px 16px' }}>
        {/* Status + type (no banner case) */}
        {!event.banner_image && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
              background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{sc.label}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {event.event_type || 'official'}
            </span>
          </div>
        )}

        <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>{event.title}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 12 }}>
          {hasDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays style={{ width: 11, height: 11, color: '#BFFF00' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {format(new Date(event.event_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {event.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin style={{ width: 11, height: 11, color: 'rgba(138,43,226,0.8)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{event.location_name}</span>
            </div>
          )}
        </div>

        {/* Stats row + Open Admin */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {(() => {
              const displayCount = liveCount != null ? liveCount.total : (event.total_registered || 0);
              if (displayCount === 0) return null;
              return (
                <div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>{displayCount}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registered</p>
                </div>
              );
            })()}
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
      </div>
    </div>
  );
}

export default function StrideAdminEvents() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['admin-all-events', user?.email],
    queryFn: () => base44.entities.StrideEvent.list('-created_date', 100),
    enabled: !!user?.email,
  });

  const myEvents = allEvents.filter(ev => isEventOwner(ev, user));

  // Live registration counts — overrides stale event.total_registered
  const { data: liveCountsData } = useQuery({
    queryKey: ['admin-events-live-counts', myEvents.map(e => e.id).join(',')],
    queryFn: () => base44.functions.invoke('getEventRegistrationCounts', { event_ids: myEvents.map(e => e.id) }).then(r => r.data?.counts || {}),
    enabled: myEvents.length > 0,
    staleTime: 30000,
  });
  const liveCounts = liveCountsData || {};

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 18, padding: 0,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          {t('nav_events')}
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(191,255,0,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('admin_hub')}
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>
              {t('admin_hub')}
              {myEvents.length > 0 && (
                <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(191,255,0,0.6)', marginLeft: 10 }}>
                  {myEvents.length}
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{t('admin_hub_subtitle')}</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/CreateOfficialEvent')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                padding: '9px 14px', borderRadius: 12,
                background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)',
                color: '#BFFF00', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
        ) : myEvents.length === 0 ? (
          <div style={{
            borderRadius: 20, padding: '48px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🗂️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{t('no_admin_events')}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 20 }}>Events you create will appear here</p>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/CreateOfficialEvent')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '11px 20px', borderRadius: 12,
                  background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)',
                  color: '#BFFF00', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                {t('create_official_event')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myEvents.map(ev => (
              <EventAdminCard key={ev.id} event={ev} onOpen={() => navigate(`/EventWorkspace?event_id=${ev.id}`)} liveCount={liveCounts[ev.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import EventCard from '@/components/stride/EventCard';
import { useAuthGate } from '@/hooks/useAuthGate';
import LoginGateModal from '@/components/auth/LoginGateModal';
import { getTrendingCommunityEvents } from '@/lib/trendingScore';
import { useLanguage } from '@/lib/LanguageContext';
import { isEventOwner } from '@/lib/eventOwner';

function SectionHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {count > 0 && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '2px 7px',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default function StrideEvents() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { showGate, setShowGate, requireAuth } = useAuthGate(user);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['stride-events'],
    queryFn: () => base44.entities.StrideEvent.filter({ status: 'open' }, '-event_date', 50),
  });

  const { data: draftEvents = [] } = useQuery({
    queryKey: ['stride-events-drafts'],
    queryFn: () => base44.entities.StrideEvent.filter({ status: 'draft' }, '-created_date', 50),
    enabled: !!user && user.role === 'admin',
  });

  const { data: myRegs = [] } = useQuery({
    queryKey: ['my-stride-regs', user?.email],
    queryFn: () => base44.entities.EventRegistration.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Admin Hub visibility: check if user owns any event
  const { data: allEventsForOwnerCheck = [] } = useQuery({
    queryKey: ['admin-owned-check', user?.email],
    queryFn: () => base44.entities.StrideEvent.list('-created_date', 100),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  // Staff button visibility: any accepted assignment
  const { data: myStaffAssignments = [] } = useQuery({
    queryKey: ['staff-assignments-check', user?.email],
    queryFn: () => base44.entities.EventStaffAssignment.filter({ staff_email: user.email, status: 'accepted' }, '-accepted_at', 1),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  // Live registration counts for all visible events — overrides stale event.total_registered
  const allVisibleEventIds = [...events.map(e => e.id), ...draftEvents.map(e => e.id)];
  const { data: liveCountsData } = useQuery({
    queryKey: ['events-live-counts', allVisibleEventIds.join(',')],
    queryFn: () => base44.functions.invoke('getEventRegistrationCounts', { event_ids: allVisibleEventIds }).then(r => r.data?.counts || {}),
    enabled: allVisibleEventIds.length > 0,
    staleTime: 30000,
  });
  const liveCounts = liveCountsData || {};

  const myRegMap = Object.fromEntries(myRegs.map(r => [r.event_id, r]));
  const isAdmin = user?.role === 'admin';
  const showAdminHub = allEventsForOwnerCheck.some(ev => isEventOwner(ev, user));
  const showStaff = myStaffAssignments.length > 0;

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location_name?.toLowerCase().includes(search.toLowerCase())
  );

  const officialEvents = filtered.filter(e => e.event_type === 'official' || !e.event_type);
  const communityEvents = useMemo(() => getTrendingCommunityEvents(filtered), [filtered]);

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0D0D0D' }}>

      {/* Header */}
      <div style={{ padding: '52px 20px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {t('event_discover')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>{t('event_events')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {user && <NotificationCenter user={user} />}
            {showStaff && (
              <button
                onClick={() => navigate('/StrideStaffDashboard')}
                style={{
                  background: 'rgba(138,43,226,0.12)', border: '1px solid rgba(138,43,226,0.35)',
                  color: 'rgba(180,100,255,0.95)', fontSize: 12, fontWeight: 700,
                  padding: '7px 13px', borderRadius: 99, minHeight: 34,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                🎟️ Staff
              </button>
            )}
            {showAdminHub && (
              <button
                onClick={() => navigate('/StrideAdminEvents')}
                style={{
                  background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.3)',
                  color: '#BFFF00', fontSize: 12, fontWeight: 700,
                  padding: '7px 13px', borderRadius: 99, minHeight: 34,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => navigate('/StrideMyEvents')}
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700,
                padding: '7px 13px', borderRadius: 99, minHeight: 34,
                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t('event_my_events')}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 20px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 34, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('event_search')}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 14, padding: '11px 14px 11px 38px',
            color: 'white', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          {t('event_loading')}
        </div>
      )}

      {!isLoading && (
        <div style={{ padding: '0 20px' }}>

          {/* Official Events */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {t('event_official')}
                </span>
                {officialEvents.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '2px 7px',
                  }}>
                    {officialEvents.length}
                  </span>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => navigate('/CreateOfficialEvent')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700, padding: '7px 13px', borderRadius: 10,
                    background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)',
                    color: '#BFFF00', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> {t('event_new_official')}
                </button>
              )}
            </div>
            {officialEvents.length === 0 ? (
              <div style={{
                borderRadius: 18, padding: '32px 20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>🏃</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('event_no_open')}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{t('event_check_back')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {officialEvents.map(event => (
                  <EventCard key={event.id} event={event} isRegistered={!!myRegMap[event.id]} liveCount={liveCounts[event.id]} />
                ))}
              </div>
            )}
          </div>

          {/* Admin: Draft Events */}
          {isAdmin && draftEvents.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,180,0,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Drafts</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,180,0,0.7)', background: 'rgba(255,180,0,0.1)', borderRadius: 99, padding: '2px 7px' }}>
                  {draftEvents.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {draftEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => navigate(`/CreateOfficialEvent?event_id=${ev.id}`)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 16,
                      background: 'rgba(255,180,0,0.04)', border: '1px solid rgba(255,180,0,0.18)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,180,0,0.12)', color: 'rgba(255,180,0,0.9)', border: '1px solid rgba(255,180,0,0.25)' }}>DRAFT</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{ev.title}</p>
                      {ev.event_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>{ev.event_date}</p>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,180,0,0.8)', flexShrink: 0 }}>{t('event_continue')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Community Events */}
          <div style={{ marginBottom: 16 }}>
            <SectionHeader label={t('event_community')} count={communityEvents.length} />
            {communityEvents.length === 0 ? (
              <div style={{
                borderRadius: 18, padding: '40px 20px', textAlign: 'center',
                background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 34, marginBottom: 10 }}>🏃‍♂️</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{t('event_no_community')}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{t('event_join_group')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {communityEvents.map(event => (
                  <EventCard key={event.id} event={event} liveCount={liveCounts[event.id]} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <LoginGateModal open={showGate} onClose={() => setShowGate(false)} />
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarDays, MapPin, Users, Clock, CheckCircle2, AlertCircle, Plus, ChevronRight, LayoutDashboard, Zap } from 'lucide-react';

const BG = '#050f08';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';
const ACCENT = '#00e676';
const ACCENT_DIM = 'rgba(0,230,118,0.15)';

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: 'rgba(255,180,0,0.9)',  bg: 'rgba(255,180,0,0.1)',   border: 'rgba(255,180,0,0.2)' },
  open:      { label: 'Published', color: '#00e676',              bg: 'rgba(0,230,118,0.1)',   border: 'rgba(0,230,118,0.25)' },
  closed:    { label: 'Closed',    color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)',  bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)' },
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 100),
    enabled: user?.role === 'admin',
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['admin-regs-summary'],
    queryFn: () => base44.entities.EventRegistration.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payments-summary'],
    queryFn: () => base44.entities.EventPayment.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  if (user && user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p style={{ fontSize: 40 }}>🚫</p>
        <p style={{ fontSize: 18, fontWeight: 800, margin: '12px 0 8px' }}>Admin Only</p>
        <button onClick={() => navigate(-1)} style={{ color: ACCENT, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  // Compute per-event stats
  const eventStats = (eventId) => {
    const regs = registrations.filter(r => r.event_id === eventId);
    const pending = regs.filter(r => r.status === 'pending').length;
    const confirmed = regs.filter(r => r.status === 'confirmed').length;
    const checkedIn = regs.filter(r => r.checked_in).length;
    const pendingPayments = payments.filter(p => {
      const reg = registrations.find(r => r.id === p.registration_id);
      return reg?.event_id === eventId && p.status === 'pending';
    }).length;
    return { total: regs.length, pending, confirmed, checkedIn, pendingPayments };
  };

  const officialEvents = events.filter(e => e.event_type === 'official');
  const filtered = filter === 'all' ? officialEvents
    : filter === 'draft' ? officialEvents.filter(e => e.status === 'draft')
    : officialEvents.filter(e => e.status !== 'draft');

  return (
    <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,15,8,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
        padding: 'max(env(safe-area-inset-top,0px),20px) 20px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: ACCENT_DIM, border: `1px solid rgba(0,230,118,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard style={{ width: 16, height: 16, color: ACCENT }} />
            </div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,230,118,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>Admin</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>Events</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/CreateOfficialEvent')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: ACCENT, color: '#050f08', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            <Plus style={{ width: 14, height: 14 }} /> New Event
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All Events'], ['draft', 'Drafts'], ['published', 'Published']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                ...(filter === key
                  ? { background: ACCENT, color: '#050f08' }
                  : { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.6)', border: '1px solid rgba(0,230,118,0.15)' }
                ),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Loading events...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: CARD_BG, border: `1px dashed ${BORDER}`, borderRadius: 20 }}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>🏁</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: 0 }}>No events found</p>
          </div>
        )}

        {filtered.map(ev => {
          const stats = eventStats(ev.id);
          const statusCfg = STATUS_CFG[ev.status] || STATUS_CFG.open;
          const isDraft = ev.status === 'draft';

          return (
            <div
              key={ev.id}
              style={{
                background: CARD_BG,
                border: `1px solid ${isDraft ? 'rgba(255,180,0,0.15)' : BORDER}`,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: isDraft ? 'none' : '0 0 24px rgba(0,230,118,0.04)',
              }}
            >
              {/* Event banner */}
              {ev.banner_image && (
                <div style={{ height: 100, overflow: 'hidden', position: 'relative' }}>
                  <img src={ev.banner_image} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,15,8,1) 0%, rgba(5,15,8,0.3) 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)', lineHeight: 1.2 }}>{ev.title}</h2>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, flexShrink: 0, marginLeft: 8 }}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ padding: 16 }}>
                {!ev.banner_image && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{ev.title}</h2>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, flexShrink: 0, marginLeft: 8 }}>
                      {statusCfg.label}
                    </span>
                  </div>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: 14 }}>
                  {ev.event_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CalendarDays style={{ width: 12, height: 12, color: 'rgba(0,230,118,0.6)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                        {format(new Date(ev.event_date), 'EEE, MMM d yyyy')}
                      </span>
                    </div>
                  )}
                  {ev.location_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin style={{ width: 12, height: 12, color: 'rgba(0,230,118,0.6)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{ev.location_name}</span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Total', value: stats.total, color: '#fff' },
                    { label: 'Pending', value: stats.pending, color: stats.pending > 0 ? 'rgba(255,200,80,1)' : 'rgba(255,255,255,0.3)' },
                    { label: 'Confirmed', value: stats.confirmed, color: stats.confirmed > 0 ? '#00e676' : 'rgba(255,255,255,0.3)' },
                    { label: 'Checked In', value: stats.checkedIn, color: stats.checkedIn > 0 ? 'rgb(100,200,255)' : 'rgba(255,255,255,0.3)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(0,230,118,0.07)' }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {stats.pendingPayments > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.2)', marginBottom: 12 }}>
                    <AlertCircle style={{ width: 12, height: 12, color: 'rgba(255,180,0,0.9)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,180,0,0.9)', fontWeight: 600 }}>{stats.pendingPayments} payment{stats.pendingPayments !== 1 ? 's' : ''} awaiting review</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => navigate(`/StrideAdminDashboard?event_id=${ev.id}`)}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none',
                    ...(isDraft
                      ? { background: 'rgba(255,180,0,0.1)', color: 'rgba(255,180,0,0.9)', border: '1px solid rgba(255,180,0,0.25)' }
                      : { background: ACCENT, color: '#050f08' }
                    ),
                  }}
                >
                  {isDraft ? <><Zap style={{ width: 14, height: 14 }} /> Continue Setup</> : <><LayoutDashboard style={{ width: 14, height: 14 }} /> Manage Event</>}
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
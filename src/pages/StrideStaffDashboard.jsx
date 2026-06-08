import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ScanLine, CreditCard, Users, Tag,
  BarChart2, UserCog, CalendarDays, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';

// ── BoomX palette ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0D0D0D',
  card: 'rgba(22,22,22,0.95)',
  purple: '#8A2BE2',
  purpleDim: 'rgba(138,43,226,0.15)',
  purpleBorder: 'rgba(138,43,226,0.3)',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.07)',
  limeBorder: 'rgba(191,255,0,0.25)',
  muted: 'rgba(255,255,255,0.35)',
  text: '#fff',
  line: 'rgba(255,255,255,0.07)',
};

// ── Role → Tool config ─────────────────────────────────────────────────────────
const TOOL_CONFIG = {
  checkin: {
    labelKey: 'role_checkin',
    descKey: 'tool_checkin_desc',
    icon: ScanLine,
    color: '#BFFF00',
    bg: 'rgba(191,255,0,0.07)',
    border: 'rgba(191,255,0,0.2)',
    tab: 'checkin',
  },
  payments: {
    labelKey: 'role_payments',
    descKey: 'tool_payments_desc',
    icon: CreditCard,
    color: '#00e676',
    bg: 'rgba(0,230,118,0.07)',
    border: 'rgba(0,230,118,0.2)',
    tab: 'payments',
  },
  registrations: {
    labelKey: 'role_registrations',
    descKey: 'tool_registrations_desc',
    icon: Users,
    color: 'rgba(100,180,255,1)',
    bg: 'rgba(100,180,255,0.07)',
    border: 'rgba(100,180,255,0.2)',
    tab: 'registrations',
  },
  categories: {
    labelKey: 'role_categories',
    descKey: 'tool_categories_desc',
    icon: Tag,
    color: 'rgba(255,180,60,1)',
    bg: 'rgba(255,180,60,0.07)',
    border: 'rgba(255,180,60,0.2)',
    tab: 'categories',
  },
  analytics: {
    labelKey: 'role_analytics',
    descKey: 'tool_analytics_desc',
    icon: BarChart2,
    color: 'rgba(180,100,255,1)',
    bg: 'rgba(180,100,255,0.07)',
    border: 'rgba(180,100,255,0.2)',
    tab: 'overview',
  },
  staff_management: {
    labelKey: 'role_staff_management',
    descKey: 'tool_staff_management_desc',
    icon: UserCog,
    color: 'rgba(255,120,100,1)',
    bg: 'rgba(255,120,100,0.07)',
    border: 'rgba(255,120,100,0.2)',
    tab: 'staffs',
  },
};

const FULL_ADMIN_TOOLS = ['checkin', 'payments', 'registrations', 'categories', 'analytics', 'staff_management'];

// ── Tool Card ──────────────────────────────────────────────────────────────────
function ToolCard({ toolKey, onPress, t }) {
  const cfg = TOOL_CONFIG[toolKey];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '14px 14px 12px', borderRadius: 16,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        cursor: 'pointer', textAlign: 'left',
        WebkitTapHighlightColor: 'transparent', width: '100%',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 12, marginBottom: 10,
        background: `${cfg.color}18`, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 17, height: 17, color: cfg.color }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: '0 0 3px', lineHeight: 1.2 }}>
        {t(cfg.labelKey)}
      </p>
      <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.4 }}>
        {t(cfg.descKey)}
      </p>
    </button>
  );
}

// ── Role chip ──────────────────────────────────────────────────────────────────
function RoleChip({ role, t }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
      background: C.limeDim, border: `1px solid ${C.limeBorder}`,
      color: C.lime, textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>{t(`role_${role}`) || role}</span>
  );
}

// ── Event Selector Chip ────────────────────────────────────────────────────────
function EventChip({ assignment, event, isSelected, onClick }) {
  const title = event?.title || assignment.event_title || 'Event';
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '8px 16px',
        borderRadius: 20,
        border: isSelected ? `1.5px solid ${C.lime}` : `1.5px solid rgba(255,255,255,0.1)`,
        background: isSelected ? 'rgba(191,255,0,0.12)' : 'rgba(255,255,255,0.04)',
        color: isSelected ? C.lime : 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: isSelected ? 800 : 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.18s ease',
        boxShadow: isSelected ? '0 0 12px rgba(191,255,0,0.15)' : 'none',
      }}
    >
      {title}
    </button>
  );
}

// ── Active Event Summary Card ──────────────────────────────────────────────────
function ActiveEventCard({ assignment, event, t }) {
  const roles = assignment.roles || [];
  const isFull = roles.includes('full_admin_view');

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: C.card,
      border: `1px solid ${C.purpleBorder}`,
      boxShadow: '0 4px 20px rgba(138,43,226,0.12)',
    }}>
      {event?.banner_image && (
        <div style={{ height: 110, overflow: 'hidden', position: 'relative' }}>
          <img
            src={event.banner_image}
            alt={event?.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(22,22,22,0.97))' }} />
        </div>
      )}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Role badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
            background: C.purpleDim, border: `1px solid ${C.purpleBorder}`,
            color: 'rgba(180,100,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>{t('staff')}</span>
          {isFull ? (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)',
              color: '#00e676', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>{t('role_full_admin_view')}</span>
          ) : (
            roles.map(r => <RoleChip key={r} role={r} t={t} />)
          )}
        </div>

        <p style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: '0 0 8px', lineHeight: 1.2 }}>
          {event?.title || assignment.event_title || 'Event'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {event?.event_date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays style={{ width: 11, height: 11, color: C.lime }} />
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                {format(new Date(event.event_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {event?.location_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin style={{ width: 11, height: 11, color: C.lime }} />
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{event.location_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StrideStaffDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const normalizedEmail = user?.email ? user.email.toLowerCase().trim() : null;

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['staff-assignments', normalizedEmail],
    queryFn: async () => {
      const records = await base44.entities.EventStaffAssignment.filter(
        { staff_email: normalizedEmail },
        '-invited_at', 100
      );
      return records.filter(r => r.status === 'accepted' || r.status === 'active');
    },
    enabled: !!normalizedEmail,
  });

  const eventIds = assignments.map(a => a.event_id).filter(Boolean);
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['staff-events', eventIds.join(',')],
    queryFn: () => Promise.all(
      eventIds.map(id =>
        base44.entities.StrideEvent.filter({ id }).then(r => r[0] || null)
      )
    ).then(results => results.filter(Boolean)),
    enabled: eventIds.length > 0,
  });

  const isLoading = assignLoading || eventsLoading;
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

  const activeAssignment = assignments[selectedIdx] || null;
  const activeEvent = activeAssignment ? eventMap[activeAssignment.event_id] || null : null;
  const activeRoles = activeAssignment?.roles || [];
  const isFull = activeRoles.includes('full_admin_view');
  const toolKeys = isFull ? FULL_ADMIN_TOOLS : activeRoles.filter(r => TOOL_CONFIG[r]);

  const handleTool = (toolKey) => {
    const cfg = TOOL_CONFIG[toolKey];
    if (!cfg || !activeAssignment) return;
    if (toolKey === 'checkin') {
      navigate(`/StrideCheckin?event_id=${activeAssignment.event_id}&from=staff`);
    } else {
      navigate(`/EventWorkspace?event_id=${activeAssignment.event_id}&from=staff&tab=${cfg.tab}`);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.bg, color: C.text, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 16px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: C.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 18, padding: 0,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          {t('nav_events')}
        </button>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(138,43,226,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          {t('staff')}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: '0 0 2px' }}>
          {t('staff')}
          {assignments.length > 0 && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(138,43,226,0.7)', marginLeft: 10 }}>
              {assignments.length}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{t('staff_dashboard_subtitle')}</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: C.muted, fontSize: 14 }}>Loading…</div>
      ) : assignments.length === 0 ? (
        <div style={{ margin: '0 20px' }}>
          <div style={{
            borderRadius: 20, padding: '48px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: `1px dashed ${C.line}`,
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🎟️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
              {t('no_staff_events')}
            </p>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Accepted staff invitations will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Sticky event selector */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 50,
            backgroundColor: C.bg,
            borderBottom: `1px solid ${C.line}`,
            padding: '10px 20px 12px',
          }}>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}>
              {assignments.map((a, idx) => (
                <EventChip
                  key={a.id}
                  assignment={a}
                  event={eventMap[a.event_id] || null}
                  isSelected={idx === selectedIdx}
                  onClick={() => setSelectedIdx(idx)}
                />
              ))}
            </div>
          </div>

          {/* Active event content */}
          {activeAssignment && (
            <div style={{ padding: '16px 20px 0' }}>
              {/* Event summary card */}
              <ActiveEventCard assignment={activeAssignment} event={activeEvent} t={t} />

              {/* Tools */}
              <div style={{ marginTop: 20 }}>
                {toolKeys.length === 0 ? (
                  <div style={{
                    borderRadius: 16, padding: '20px', textAlign: 'center',
                    background: 'rgba(255,255,255,0.03)', border: `1px dashed ${C.line}`,
                  }}>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>No tools assigned yet</p>
                  </div>
                ) : (
                  <>
                    <p style={{
                      fontSize: 10, fontWeight: 700, color: C.muted,
                      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
                    }}>
                      Your Tools
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 10,
                    }}>
                      {toolKeys.map(key => (
                        <ToolCard key={key} toolKey={key} t={t} onPress={() => handleTool(key)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
import React from 'react';
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

// ── Event Staff Card ───────────────────────────────────────────────────────────
function StaffEventCard({ assignment, event, navigate, t }) {
  const roles = assignment.roles || [];
  const isFull = roles.includes('full_admin_view');
  const toolKeys = isFull ? FULL_ADMIN_TOOLS : roles.filter(r => TOOL_CONFIG[r]);

  const handleTool = (toolKey) => {
    const cfg = TOOL_CONFIG[toolKey];
    if (!cfg) return;
    navigate(`/EventWorkspace?event_id=${assignment.event_id}&from=staff&tab=${cfg.tab}`);
  };

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: C.card,
      border: `1px solid ${C.purpleBorder}`,
      boxShadow: '0 4px 20px rgba(138,43,226,0.1)',
    }}>
      {/* Banner */}
      {event?.banner_image && (
        <div style={{ height: 80, overflow: 'hidden', position: 'relative' }}>
          <img src={event.banner_image} alt={event?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(22,22,22,0.97))' }} />
        </div>
      )}

      {/* Event info */}
      <div style={{ padding: '14px 16px 0' }}>
        {/* Chips */}
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

        <p style={{ fontSize: 17, fontWeight: 900, color: C.text, margin: '0 0 6px', lineHeight: 1.2 }}>
          {event?.title || assignment.event_title || 'Event'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px', marginBottom: 10 }}>
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

        {assignment.accepted_at && (
          <p style={{ fontSize: 10, color: 'rgba(191,255,0,0.5)', marginBottom: 14 }}>
            ✓ {t('accept_invite')}d {format(new Date(assignment.accepted_at), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Tool grid */}
      <div style={{ padding: '0 16px 16px' }}>
        {toolKeys.length === 0 ? (
          <div style={{
            borderRadius: 12, padding: '14px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: `1px dashed ${C.line}`,
          }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>No tools assigned yet</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Your Tools
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: toolKeys.length === 1 ? '1fr' : 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {toolKeys.map(key => (
                <ToolCard key={key} toolKey={key} t={t} onPress={() => handleTool(key)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StrideStaffDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['staff-assignments', user?.email],
    queryFn: () => base44.entities.EventStaffAssignment.filter(
      { staff_email: user.email, status: 'accepted' },
      '-accepted_at', 50
    ),
    enabled: !!user?.email,
  });

  const eventIds = assignments.map(a => a.event_id);
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['staff-events', eventIds.join(',')],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 200),
    enabled: eventIds.length > 0,
  });

  const isLoading = assignLoading || eventsLoading;
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]));

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.bg, color: C.text, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 20px' }}>
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
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: '0 0 4px' }}>
          {t('staff')}
          {assignments.length > 0 && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(138,43,226,0.7)', marginLeft: 10 }}>
              {assignments.length}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{t('staff_dashboard_subtitle')}</p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14 }}>Loading…</div>
        ) : assignments.length === 0 ? (
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignments.map(a => (
              <StaffEventCard
                key={a.id}
                assignment={a}
                event={eventMap[a.event_id] || null}
                navigate={navigate}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, ChevronRight, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import EventWorkspaceTabs from '@/components/admin/EventWorkspaceTabs';
import EventOverviewPanel from '@/components/admin/EventOverviewPanel';
import EventRegistrationsPanel from '@/components/admin/EventRegistrationsPanel';
import EventPaymentsPanel from '@/components/admin/EventPaymentsPanel';
import EventCategoriesPanel from '@/components/admin/EventCategoriesPanel';
import EventCheckinPanel from '@/components/admin/EventCheckinPanel';
import EventStaffsPanel from '@/components/admin/EventStaffsPanel';
import EventSettingsPanel from '@/components/admin/EventSettingsPanel';
import EventActivityPanel from '@/components/admin/EventActivityPanel';
import { useEventRole } from '@/hooks/useEventRole';

const BG = '#050f08';
const ACCENT = '#00e676';
const BORDER = 'rgba(0,200,80,0.12)';

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: 'rgba(255,180,0,0.9)',   bg: 'rgba(255,180,0,0.1)' },
  open:      { label: 'Published', color: ACCENT,                  bg: 'rgba(0,230,118,0.1)' },
  closed:    { label: 'Closed',    color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)',   bg: 'rgba(255,80,80,0.08)' },
};

function AccessDenied({ onBack }) {
  return (
    <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 24, textAlign: 'center' }}>
      <ShieldAlert style={{ width: 40, height: 40, color: 'rgba(255,80,80,0.7)', marginBottom: 16 }} />
      <p style={{ fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>Access Denied</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>You don't have permission to access this event workspace.</p>
      <button onClick={onBack} style={{ color: ACCENT, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Go Back</button>
    </div>
  );
}

export default function EventWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const eventIdParam = params.get('event_id');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  // Role resolution (event-scoped)
  const { role, can, visibleTabs, defaultTab, isLoading: roleLoading } = useEventRole(eventIdParam, user);

  const [activeTab, setActiveTab] = useState(null); // set once role is known

  // Set default tab once role is resolved
  useEffect(() => {
    if (defaultTab && !activeTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Fetch event data only if user has some access
  const hasAnyAccess = !!role;

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 100),
    enabled: !!user,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-cats-admin'],
    queryFn: () => base44.entities.EventCategory.list('-created_date', 200),
    enabled: hasAnyAccess,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['all-regs-admin'],
    queryFn: () => base44.entities.EventRegistration.list('-created_date', 500),
    enabled: hasAnyAccess,
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['all-payments-admin'],
    queryFn: () => base44.entities.EventPayment.list('-created_date', 500),
    enabled: can('payments'),
  });

  const event = events.find(e => e.id === eventIdParam);

  useEffect(() => {
    if (!eventIdParam || (!event && events.length > 0 && user?.role === 'admin')) {
      navigate('/AdminEvents', { replace: true });
    }
  }, [eventIdParam, event, events.length, user?.role]);

  // Loading state
  if (!user || roleLoading || !event) {
    return <div style={{ minHeight: '100dvh', background: BG }} />;
  }

  // No access at all
  if (!role) {
    return <AccessDenied onBack={() => navigate(-1)} />;
  }

  const categories = allCategories.filter(c => c.event_id === event.id);

  const pendingRegs = can('registrations')
    ? registrations.filter(r => r.event_id === event.id && r.status === 'pending').length
    : 0;
  const pendingPayments = can('payments')
    ? allPayments.filter(p => {
        const reg = registrations.find(r => r.id === p.registration_id);
        return reg?.event_id === event.id && p.status === 'pending';
      }).length
    : 0;

  const statusCfg = STATUS_CFG[event.status] || STATUS_CFG.open;

  // Role badge shown in header for non-full-admin staff
  const ROLE_LABEL = { full: null, registrations: 'Registrations', payments: 'Payments', checkin: 'Check-in' };
  const roleBadge = ROLE_LABEL[role];

  return (
    <div style={{ minHeight: '100dvh', background: BG, paddingBottom: 100 }}>
      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,15,8,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
        padding: 'max(env(safe-area-inset-top,0px),20px) 16px 0',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <button onClick={() => navigate('/AdminEvents')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft style={{ width: 14, height: 14, color: 'rgba(0,230,118,0.6)' }} />
            <span style={{ fontSize: 12, color: 'rgba(0,230,118,0.6)', fontWeight: 700 }}>Events</span>
          </button>
          <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {event.title}
          </span>
          {roleBadge && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: 'rgba(138,43,226,0.15)', color: 'rgba(190,140,255,1)', border: '1px solid rgba(138,43,226,0.3)', flexShrink: 0 }}>
              {roleBadge}
            </span>
          )}
        </div>

        {/* Event identity bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          {event.banner_image && (
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `1px solid rgba(0,230,118,0.2)` }}>
              <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.title}
              </h1>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: statusCfg.bg, color: statusCfg.color, flexShrink: 0 }}>
                {statusCfg.label}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginTop: 4 }}>
              {event.event_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarDays style={{ width: 11, height: 11, color: 'rgba(0,230,118,0.5)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {event.location_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin style={{ width: 11, height: 11, color: 'rgba(0,230,118,0.5)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                    {event.location_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace tabs — filtered by role */}
        {activeTab && (
          <EventWorkspaceTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            visibleTabs={visibleTabs}
            badges={{ registrations: pendingRegs, payments: pendingPayments }}
          />
        )}
      </div>

      {/* ── Tab content ── */}
      <div style={{ paddingTop: 20 }}>
        {activeTab === 'overview' && can('overview') && (
          <EventOverviewPanel
            event={event}
            registrations={registrations}
            payments={allPayments}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'registrations' && can('registrations') && (
          <EventRegistrationsPanel
            event={event}
            registrations={registrations}
            categories={categories}
            canApprove={can('registrations')}
            canReject={can('registrations')}
            actorEmail={user?.email}
            onRegsUpdated={() => queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] })}
          />
        )}
        {activeTab === 'payments' && can('payments') && (
          <EventPaymentsPanel
            event={event}
            registrations={registrations}
            payments={allPayments}
            categories={categories}
            canReview={can('payments')}
            actorEmail={user?.email}
            onDone={() => queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] })}
          />
        )}
        {activeTab === 'categories' && can('categories') && (
          <EventCategoriesPanel
            event={event}
            categories={categories}
            canManage={role === 'full'}
          />
        )}
        {activeTab === 'checkin' && can('checkin') && (
          <EventCheckinPanel
            event={event}
            registrations={registrations}
            categories={categories}
            canBulkCheckin={can('checkin')}
            actorEmail={user?.email}
            onRegsUpdated={() => queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] })}
          />
        )}
        {activeTab === 'staffs' && can('staffs') && (
          <EventStaffsPanel event={event} user={user} eventRole={role} />
        )}
        {activeTab === 'settings' && can('settings') && (
          <EventSettingsPanel
            event={event}
            actorEmail={user?.email}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin-events-list'] })}
          />
        )}
        {activeTab === 'activity' && can('activity') && (
          <EventActivityPanel event={event} />
        )}
      </div>
    </div>
  );
}
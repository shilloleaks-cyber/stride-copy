import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import EventWorkspaceTabs from '@/components/admin/EventWorkspaceTabs';
import EventOverviewPanel from '@/components/admin/EventOverviewPanel';
import EventRegistrationsPanel from '@/components/admin/EventRegistrationsPanel';
import EventPaymentsPanel from '@/components/admin/EventPaymentsPanel';
import EventCategoriesPanel from '@/components/admin/EventCategoriesPanel';
import EventCheckinPanel from '@/components/admin/EventCheckinPanel';
import EventStaffsPanel from '@/components/admin/EventStaffsPanel';
import EventSettingsPanel from '@/components/admin/EventSettingsPanel';

const BG = '#050f08';
const ACCENT = '#00e676';
const BORDER = 'rgba(0,200,80,0.12)';

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: 'rgba(255,180,0,0.9)',   bg: 'rgba(255,180,0,0.1)' },
  open:      { label: 'Published', color: ACCENT,                  bg: 'rgba(0,230,118,0.1)' },
  closed:    { label: 'Closed',    color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)',   bg: 'rgba(255,80,80,0.08)' },
};

export default function EventWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const params = new URLSearchParams(window.location.search);
  const eventIdParam = params.get('event_id');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => base44.entities.StrideEvent.list('-event_date', 100),
    enabled: user?.role === 'admin',
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-cats-admin'],
    queryFn: () => base44.entities.EventCategory.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['all-regs-admin'],
    queryFn: () => base44.entities.EventRegistration.list('-created_date', 500),
    enabled: user?.role === 'admin',
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['all-payments-admin'],
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

  // No event_id or event not found → redirect to event list
  const event = events.find(e => e.id === eventIdParam);

  if (!eventIdParam || (!event && events.length > 0)) {
    navigate('/AdminEvents', { replace: true });
    return null;
  }

  // Still loading events
  if (!event) {
    return <div style={{ minHeight: '100dvh', background: BG }} />;
  }

  const categories = allCategories.filter(c => c.event_id === event.id);

  const pendingRegs = registrations.filter(r => r.event_id === event.id && r.status === 'pending').length;
  const pendingPayments = allPayments.filter(p => {
    const reg = registrations.find(r => r.id === p.registration_id);
    return reg?.event_id === event.id && p.status === 'pending';
  }).length;

  const statusCfg = STATUS_CFG[event.status] || STATUS_CFG.open;

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
          <button
            onClick={() => navigate('/AdminEvents')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft style={{ width: 14, height: 14, color: 'rgba(0,230,118,0.6)' }} />
            <span style={{ fontSize: 12, color: 'rgba(0,230,118,0.6)', fontWeight: 700 }}>Events</span>
          </button>
          <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
            {event.title}
          </span>
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

        {/* Workspace tabs */}
        <EventWorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badges={{ registrations: pendingRegs, payments: pendingPayments }}
        />
      </div>

      {/* ── Tab content ── */}
      <div style={{ paddingTop: 20 }}>
        {activeTab === 'overview' && (
          <EventOverviewPanel
            event={event}
            registrations={registrations}
            payments={allPayments}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'registrations' && (
          <EventRegistrationsPanel
            event={event}
            registrations={registrations}
            categories={categories}
            onRegsUpdated={() => queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] })}
          />
        )}
        {activeTab === 'payments' && (
          <EventPaymentsPanel
            event={event}
            registrations={registrations}
            payments={allPayments}
            categories={categories}
            onDone={() => queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] })}
          />
        )}
        {activeTab === 'categories' && (
          <EventCategoriesPanel event={event} categories={categories} />
        )}
        {activeTab === 'checkin' && (
          <EventCheckinPanel event={event} registrations={registrations} categories={categories} />
        )}
        {activeTab === 'staffs' && (
          <EventStaffsPanel event={event} />
        )}
        {activeTab === 'settings' && (
          <EventSettingsPanel
            event={event}
            onUpdated={() => queryClient.invalidateQueries({ queryKey: ['admin-events-list'] })}
          />
        )}
      </div>
    </div>
  );
}
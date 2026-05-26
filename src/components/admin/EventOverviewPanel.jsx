import React from 'react';
import { Users, CheckCircle2, Clock, CreditCard, Tag, ScanLine, UserCog, Settings } from 'lucide-react';

const LIME   = '#B6FF00';
const PURPLE = '#8A2BE2';
const CARD   = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.09)';

function DebugRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ color: 'rgba(0,220,255,0.9)', fontWeight: 700 }}>{String(value ?? '—')}</span>
    </div>
  );
}

export default function EventOverviewPanel({ event, registrations, payments, onTabChange, debugMode, usingInjectedData, directRegistrationsCount }) {
  // registrations are already event-scoped from the parent — no need to re-filter
  // (re-filtering by event_id here was the bug: if injected data has correct event_id it passes,
  //  but we keep it as a safety guard and expose it in debug)
  const regs = registrations.filter(r => r.event_id === event.id);
  const total    = regs.length;
  const pending  = regs.filter(r => r.status === 'pending').length;
  const confirmed = regs.filter(r => r.status === 'confirmed').length;
  const checkedIn = regs.filter(r => r.checked_in).length;
  const pendingPayments = payments.filter(p => {
    const reg = registrations.find(r => r.id === p.registration_id);
    return reg?.event_id === event.id && p.status === 'pending';
  }).length;

  const statCards = [
    { label: 'Total',      value: total,     color: '#fff',                       bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
    { label: 'Pending',    value: pending,   color: 'rgba(255,200,80,1)',         bg: 'rgba(255,200,80,0.07)', border: 'rgba(255,200,80,0.2)'  },
    { label: 'Confirmed',  value: confirmed, color: LIME,                          bg: 'rgba(182,255,0,0.07)',  border: 'rgba(182,255,0,0.2)'   },
    { label: 'Checked In', value: checkedIn, color: 'rgba(130,200,255,1)',        bg: 'rgba(130,200,255,0.07)',border: 'rgba(130,200,255,0.2)' },
  ];

  const quickActions = [
    { label: 'Categories', desc: 'Manage race categories',   Icon: Tag,      tab: 'categories', color: LIME },
    { label: 'Payments',   desc: `${pendingPayments} pending`, Icon: CreditCard, tab: 'payments', color: pendingPayments > 0 ? 'rgba(255,180,0,0.9)' : LIME },
    { label: 'Check-in',   desc: 'Event day tools',           Icon: ScanLine, tab: 'checkin',    color: LIME },
    { label: 'Staffs',     desc: 'Manage team access',        Icon: UserCog,  tab: 'staffs',     color: `rgba(190,140,255,1)` },
  ];

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Temporary debug banner for staff data verification ── */}
      {debugMode && (
        <div style={{ background: 'rgba(0,200,255,0.07)', border: '1px solid rgba(0,200,255,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,200,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>📊 Overview Debug</span>
          <DebugRow label="usingInjectedData" value={String(usingInjectedData)} />
          <DebugRow label="staffRegistrationsCount" value={registrations.length} />
          <DebugRow label="regsAfterEventIdFilter" value={regs.length} />
          <DebugRow label="directRegistrationsCount" value={directRegistrationsCount ?? '—'} />
          <DebugRow label="displayedTotal" value={total} />
          <DebugRow label="event.id" value={event.id} />
          <DebugRow label="sampleEventIdFromReg" value={registrations[0]?.event_id ?? 'n/a'} />
        </div>
      )}

      {/* Stats */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(182,255,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          Registration Stats
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {statCards.map(s => (
            <div key={s.label} style={{
              padding: '16px 14px', background: s.bg,
              border: `1px solid ${s.border}`, borderRadius: 18, textAlign: 'center',
            }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(182,255,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>
          Quick Access
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {quickActions.map(({ label, desc, Icon, tab, color }) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                padding: '14px', background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 15, height: 15, color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings quick link */}
      <button
        onClick={() => onTabChange('settings')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 18, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings style={{ width: 16, height: 16, color: 'rgba(182,255,0,0.55)' }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Event Settings</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>Edit title, date, location, banner, publish</p>
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(182,255,0,0.5)', fontWeight: 700 }}>→</span>
      </button>
    </div>
  );
}
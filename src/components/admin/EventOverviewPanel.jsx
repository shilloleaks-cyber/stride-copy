import React from 'react';
import { Users, CheckCircle2, Clock, CreditCard, Tag, ScanLine, UserCog, Settings } from 'lucide-react';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

export default function EventOverviewPanel({ event, registrations, payments, onTabChange }) {
  const regs = registrations.filter(r => r.event_id === event.id);
  const total = regs.length;
  const pending = regs.filter(r => r.status === 'pending').length;
  const confirmed = regs.filter(r => r.status === 'confirmed').length;
  const checkedIn = regs.filter(r => r.checked_in).length;
  const pendingPayments = payments.filter(p => {
    const reg = registrations.find(r => r.id === p.registration_id);
    return reg?.event_id === event.id && p.status === 'pending';
  }).length;

  const statCards = [
    { label: 'Total', value: total, color: '#fff', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' },
    { label: 'Pending', value: pending, color: 'rgba(255,200,80,1)', bg: 'rgba(255,200,80,0.08)', border: 'rgba(255,200,80,0.2)' },
    { label: 'Confirmed', value: confirmed, color: ACCENT, bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)' },
    { label: 'Checked In', value: checkedIn, color: 'rgb(100,200,255)', bg: 'rgba(100,200,255,0.08)', border: 'rgba(100,200,255,0.2)' },
  ];

  const quickActions = [
    { label: 'Categories', desc: 'Manage race categories', Icon: Tag, tab: 'categories', color: ACCENT },
    { label: 'Payments', desc: `${pendingPayments} pending`, Icon: CreditCard, tab: 'payments', color: pendingPayments > 0 ? 'rgba(255,180,0,0.9)' : ACCENT },
    { label: 'Check-in', desc: 'Event day tools', Icon: ScanLine, tab: 'checkin', color: ACCENT },
    { label: 'Staffs', desc: 'Manage team access', Icon: UserCog, tab: 'staffs', color: ACCENT },
  ];

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Registration Stats</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ padding: '16px 14px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 36, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Quick Access</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {quickActions.map(({ label, desc, Icon, tab, color }) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                padding: '14px', background: CARD_BG, border: `1px solid ${BORDER}`,
                borderRadius: 16, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(0,230,118,0.12)`, border: `1px solid rgba(0,230,118,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 15, height: 15, color: color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{desc}</p>
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
          padding: '14px 16px', background: CARD_BG, border: `1px solid ${BORDER}`,
          borderRadius: 16, cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings style={{ width: 16, height: 16, color: 'rgba(0,230,118,0.6)' }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Event Settings</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>Edit title, date, location, banner, publish</p>
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(0,230,118,0.5)', fontWeight: 700 }}>→</span>
      </button>
    </div>
  );
}
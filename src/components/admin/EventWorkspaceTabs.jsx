import React from 'react';
import { BarChart2, Users, CreditCard, Tag, ScanLine, UserCog, Settings } from 'lucide-react';

const ACCENT = '#00e676';
const TABS = [
  { key: 'overview',       label: 'Overview',       Icon: BarChart2 },
  { key: 'registrations',  label: 'Registrations',  Icon: Users },
  { key: 'payments',       label: 'Payments',       Icon: CreditCard },
  { key: 'categories',     label: 'Categories',     Icon: Tag },
  { key: 'checkin',        label: 'Check-in',       Icon: ScanLine },
  { key: 'staffs',         label: 'Staffs',         Icon: UserCog },
  { key: 'settings',       label: 'Settings',       Icon: Settings },
];

export default function EventWorkspaceTabs({ activeTab, onTabChange, badges = {} }) {
  return (
    <div style={{
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
      display: 'flex', gap: 6, padding: '0 16px 12px',
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        const badge = badges[key];
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              whiteSpace: 'nowrap', position: 'relative',
              ...(isActive
                ? { background: ACCENT, color: '#050f08' }
                : { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.6)', border: '1px solid rgba(0,230,118,0.15)' }
              ),
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {label}
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(255,180,0,0.9)', color: '#050f08',
                fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
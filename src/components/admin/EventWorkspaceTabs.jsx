import React from 'react';
import { BarChart2, Users, CreditCard, Tag, ScanLine, UserCog, Settings, Activity } from 'lucide-react';

const LIME = '#B6FF00';
const BG = '#080808';

const ALL_TABS = [
  { key: 'overview',       label: 'Overview',       Icon: BarChart2 },
  { key: 'registrations',  label: 'Registrations',  Icon: Users },
  { key: 'payments',       label: 'Payments',       Icon: CreditCard },
  { key: 'categories',     label: 'Categories',     Icon: Tag },
  { key: 'checkin',        label: 'Check-in',       Icon: ScanLine },
  { key: 'staffs',         label: 'Staffs',         Icon: UserCog },
  { key: 'settings',       label: 'Edit',           Icon: Settings },
  { key: 'activity',       label: 'Activity',       Icon: Activity },
];

export default function EventWorkspaceTabs({ activeTab, onTabChange, visibleTabs, badges = {} }) {
  const tabsToShow = visibleTabs
    ? ALL_TABS.filter(t => visibleTabs.includes(t.key))
    : ALL_TABS;

  return (
    <div style={{
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none', msOverflowStyle: 'none',
      display: 'flex', gap: 6, padding: '0 16px 12px',
    }}>
      {tabsToShow.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        const badge = badges[key];
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap', position: 'relative',
              ...(isActive
                ? { background: LIME, color: '#080808', border: 'none' }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }
              ),
            }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {label}
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(255,180,0,0.95)', color: '#080808',
                fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
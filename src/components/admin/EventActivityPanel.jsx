import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

const ACCENT = '#00e676';

// Map action_type → filter bucket
const ACTION_FILTER_MAP = {
  bulk_approve_registrations: 'registrations',
  bulk_reject_registrations:  'registrations',
  payment_approved:           'payments',
  payment_needs_attention:    'payments',
  payment_setup_updated:      'payments',
  bulk_checkin:               'checkin',
  staff_added:                'staffs',
  staff_removed:              'staffs',
  event_settings_updated:     'settings',
  category_created:           'categories',
  category_updated:           'categories',
  category_deleted:           'categories',
};

const ACTION_CFG = {
  bulk_approve_registrations: { label: 'Bulk Approved',       color: '#00e676',            bg: 'rgba(0,230,118,0.1)' },
  bulk_reject_registrations:  { label: 'Bulk Rejected',       color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
  bulk_checkin:               { label: 'Bulk Check-in',       color: '#00e676',            bg: 'rgba(0,230,118,0.1)' },
  payment_approved:           { label: 'Payment Approved',    color: '#00e676',            bg: 'rgba(0,230,118,0.1)' },
  payment_needs_attention:    { label: 'Needs Attention',     color: 'rgba(255,150,50,1)', bg: 'rgba(255,120,0,0.08)' },
  payment_setup_updated:      { label: 'Payment Setup',       color: 'rgba(255,200,80,1)', bg: 'rgba(255,200,80,0.08)' },
  staff_added:                { label: 'Staff Added',         color: 'rgba(100,180,255,1)', bg: 'rgba(100,180,255,0.08)' },
  staff_removed:              { label: 'Staff Removed',       color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
  event_settings_updated:     { label: 'Settings Updated',   color: 'rgba(180,120,255,1)', bg: 'rgba(180,120,255,0.08)' },
  category_created:           { label: 'Category Created',   color: '#00e676',            bg: 'rgba(0,230,118,0.08)' },
  category_updated:           { label: 'Category Updated',   color: 'rgba(255,200,80,1)', bg: 'rgba(255,200,80,0.08)' },
  category_deleted:           { label: 'Category Deleted',   color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
};

const TARGET_ICONS = {
  registration: '📋',
  payment:      '💳',
  staff:        '👤',
  event:        '⚙️',
  category:     '🏷️',
};

const FILTERS = [
  { key: 'all',           label: 'All' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'payments',      label: 'Payments' },
  { key: 'checkin',       label: 'Check-in' },
  { key: 'staffs',        label: 'Staffs' },
  { key: 'categories',    label: 'Categories' },
  { key: 'settings',      label: 'Settings' },
];

function timeLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24)    return `${diffH}h ago`;
  return format(d, 'MMM d, HH:mm');
}

export default function EventActivityPanel({ event }) {
  const [filter, setFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['event-activity-log', event.id],
    queryFn: () => base44.entities.EventActivityLog.filter(
      { event_id: event.id },
      '-created_date',
      200
    ),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const filtered = filter === 'all'
    ? logs
    : logs.filter(l => ACTION_FILTER_MAP[l.action_type] === filter);

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none',
              ...(filter === f.key
                ? { background: ACCENT, color: '#050f08' }
                : { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.55)', border: '1px solid rgba(0,230,118,0.15)' }
              ),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log count */}
      <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Loading */}
      {isLoading && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: 32 }}>Loading activity...</p>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, border: '1px dashed rgba(0,230,118,0.12)', borderRadius: 16 }}>
          <Activity style={{ width: 28, height: 28, color: 'rgba(0,230,118,0.2)', margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>No activity yet</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0 }}>Actions performed in this event will appear here</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 15, top: 16, bottom: 16, width: 1, background: 'rgba(0,230,118,0.1)', zIndex: 0 }} />

          {filtered.map((log, idx) => {
            const cfg = ACTION_CFG[log.action_type] || { label: log.action_type, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' };
            const icon = TARGET_ICONS[log.target_type] || '📌';
            const isLast = idx === filtered.length - 1;

            return (
              <div key={log.id} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: isLast ? 0 : 12 }}>
                {/* Dot */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, zIndex: 1,
                }}>
                  {icon}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, minWidth: 0, paddingBottom: 12,
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                }}>
                  {/* Row 1: badge + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
                      flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {timeLabel(log.created_date)}
                    </span>
                  </div>

                  {/* Row 2: summary */}
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px', lineHeight: 1.4 }}>
                    {log.summary}
                  </p>

                  {/* Row 3: actor + target */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgba(0,230,118,0.6)', fontWeight: 700 }}>
                      {log.actor_email?.split('@')[0]}
                      <span style={{ color: 'rgba(0,230,118,0.3)', fontWeight: 400 }}>@{log.actor_email?.split('@')[1]}</span>
                    </span>
                    {log.target_type && (
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                        · {log.target_type}
                        {log.target_id && <span style={{ color: 'rgba(255,255,255,0.12)' }}> #{log.target_id.slice(-6)}</span>}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
                      {log.created_date ? format(new Date(log.created_date), 'MMM d, yyyy · HH:mm') : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
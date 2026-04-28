import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Activity, ShieldAlert } from 'lucide-react';

const ACCENT = '#00e676';
const MANUAL_COLOR = 'rgba(190,140,255,1)';
const MANUAL_BG    = 'rgba(138,43,226,0.12)';
const MANUAL_BORDER = 'rgba(138,43,226,0.35)';

// All manual override action types
const MANUAL_OVERRIDE_TYPES = new Set([
  'manual_category_change',
  'manual_bib_assign',
  'manual_payment_approved',
  'manual_payment_reset',
  'manual_checkin_force',
  'manual_checkin_undo',
  'manual_registration_confirm',
  'manual_registration_reject',
  'manual_registration_add',
]);

// Map action_type → filter bucket
const ACTION_FILTER_MAP = {
  bulk_approve_registrations:  'registrations',
  bulk_reject_registrations:   'registrations',
  payment_approved:            'payments',
  payment_needs_attention:     'payments',
  payment_setup_updated:       'payments',
  bulk_checkin:                'checkin',
  staff_added:                 'staffs',
  staff_removed:               'staffs',
  event_settings_updated:      'settings',
  category_created:            'categories',
  category_updated:            'categories',
  category_deleted:            'categories',
  // manual overrides all map to their own bucket
  manual_category_change:      'manual',
  manual_bib_assign:           'manual',
  manual_payment_approved:     'manual',
  manual_payment_reset:        'manual',
  manual_checkin_force:        'manual',
  manual_checkin_undo:         'manual',
  manual_registration_confirm: 'manual',
  manual_registration_reject:  'manual',
  manual_registration_add:     'manual',
};

const ACTION_CFG = {
  // Standard operational actions
  bulk_approve_registrations:  { label: 'Bulk Approved',       color: '#00e676',             bg: 'rgba(0,230,118,0.1)' },
  bulk_reject_registrations:   { label: 'Bulk Rejected',       color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
  bulk_checkin:                { label: 'Bulk Check-in',       color: '#00e676',             bg: 'rgba(0,230,118,0.1)' },
  payment_approved:            { label: 'Payment Approved',    color: '#00e676',             bg: 'rgba(0,230,118,0.1)' },
  payment_needs_attention:     { label: 'Needs Attention',     color: 'rgba(255,150,50,1)',  bg: 'rgba(255,120,0,0.08)' },
  payment_setup_updated:       { label: 'Payment Setup',       color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.08)' },
  staff_added:                 { label: 'Staff Added',         color: 'rgba(100,180,255,1)', bg: 'rgba(100,180,255,0.08)' },
  staff_removed:               { label: 'Staff Removed',       color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
  event_settings_updated:      { label: 'Settings Updated',    color: 'rgba(180,120,255,1)', bg: 'rgba(180,120,255,0.08)' },
  category_created:            { label: 'Category Created',    color: '#00e676',             bg: 'rgba(0,230,118,0.08)' },
  category_updated:            { label: 'Category Updated',    color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.08)' },
  category_deleted:            { label: 'Category Deleted',    color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)' },
  // Manual override actions — all use purple palette
  manual_category_change:      { label: 'Category Changed',    color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_bib_assign:           { label: 'Bib Assigned',        color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_payment_approved:     { label: 'Payment Approved ✦',  color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_payment_reset:        { label: 'Payment Reset ✦',     color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_checkin_force:        { label: 'Force Check-In ✦',    color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_checkin_undo:         { label: 'Undo Check-In ✦',     color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_registration_confirm: { label: 'Reg Confirmed ✦',     color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_registration_reject:  { label: 'Reg Rejected ✦',      color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
  manual_registration_add:     { label: 'Reg Added ✦',         color: MANUAL_COLOR, bg: MANUAL_BG, isManual: true },
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
  { key: 'manual',        label: '⚠ Manual Overrides', isManual: true },
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
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const isManualPill = f.isManual;
          let style;
          if (isActive && isManualPill) {
            style = { background: 'rgba(138,43,226,1)', color: '#fff', border: 'none' };
          } else if (isActive) {
            style = { background: ACCENT, color: '#050f08', border: 'none' };
          } else if (isManualPill) {
            style = { background: MANUAL_BG, color: MANUAL_COLOR, border: `1px solid ${MANUAL_BORDER}` };
          } else {
            style = { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.55)', border: '1px solid rgba(0,230,118,0.15)' };
          }
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', ...style }}
            >
              {f.label}
            </button>
          );
        })}
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
            const isManual = cfg.isManual || MANUAL_OVERRIDE_TYPES.has(log.action_type);
            const icon = isManual ? null : (TARGET_ICONS[log.target_type] || '📌');
            const isLast = idx === filtered.length - 1;

            return (
              <div key={log.id} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: isLast ? 0 : 12 }}>
                {/* Dot — shield for manual, emoji for standard */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: isManual ? MANUAL_BG : cfg.bg,
                  border: `1px solid ${isManual ? MANUAL_BORDER : cfg.color + '40'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isManual ? 0 : 14,
                }}>
                  {isManual
                    ? <ShieldAlert style={{ width: 13, height: 13, color: MANUAL_COLOR }} />
                    : icon
                  }
                </div>

                {/* Card — purple left-border for manual entries */}
                <div style={{
                  flex: 1, minWidth: 0, paddingBottom: 12,
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  ...(isManual ? {
                    background: 'rgba(138,43,226,0.04)',
                    border: `1px solid ${MANUAL_BORDER}`,
                    borderRadius: 12,
                    padding: '10px 12px 10px',
                    marginBottom: isLast ? 0 : 0,
                  } : {}),
                }}>
                  {/* Row 1: badge + manual tag + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                      background: isManual ? MANUAL_BG : cfg.bg,
                      color: isManual ? MANUAL_COLOR : cfg.color,
                      border: `1px solid ${isManual ? MANUAL_BORDER : cfg.color + '30'}`,
                    }}>
                      {cfg.label}
                    </span>
                    {isManual && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(138,43,226,0.18)', color: 'rgba(190,140,255,0.8)',
                        border: '1px solid rgba(138,43,226,0.4)', letterSpacing: '0.06em', flexShrink: 0,
                      }}>
                        MANUAL OVERRIDE
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {timeLabel(log.created_date)}
                    </span>
                  </div>

                  {/* Row 2: summary */}
                  <p style={{
                    fontSize: 13, fontWeight: 600, margin: '0 0 5px', lineHeight: 1.4,
                    color: isManual ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
                  }}>
                    {log.summary}
                  </p>

                  {/* Row 3: actor + target + full timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: isManual ? MANUAL_COLOR : 'rgba(0,230,118,0.6)', fontWeight: 700 }}>
                      {log.actor_email?.split('@')[0]}
                      <span style={{ color: isManual ? 'rgba(190,140,255,0.4)' : 'rgba(0,230,118,0.3)', fontWeight: 400 }}>
                        @{log.actor_email?.split('@')[1]}
                      </span>
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
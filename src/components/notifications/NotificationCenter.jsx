import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── BoomX palette ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0A',
  panel: 'rgba(14,10,24,0.97)',
  purple: '#8A2BE2',
  purpleDim: 'rgba(138,43,226,0.18)',
  purpleBorder: 'rgba(138,43,226,0.35)',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.08)',
  limeBorder: 'rgba(191,255,0,0.2)',
  amber: 'rgba(255,180,0,0.9)',
  amberDim: 'rgba(255,180,0,0.08)',
  amberBorder: 'rgba(255,180,0,0.25)',
  muted: 'rgba(255,255,255,0.35)',
  text: 'rgba(255,255,255,0.9)',
  line: 'rgba(255,255,255,0.07)',
};

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CFG = {
  // Events
  registration_success: { icon: '🎉', accent: C.lime,   bg: C.limeDim,   border: C.limeBorder },
  payment_approved:     { icon: '✅', accent: '#00e676', bg: 'rgba(0,230,118,0.07)', border: 'rgba(0,230,118,0.2)' },
  payment_needs_attention: { icon: '⚠️', accent: C.amber, bg: C.amberDim, border: C.amberBorder },
  staff_invitation:     { icon: '🔑', accent: C.purple,  bg: C.purpleDim, border: C.purpleBorder },
  event_reminder:       { icon: '📅', accent: 'rgba(180,120,255,1)', bg: 'rgba(180,120,255,0.07)', border: 'rgba(180,120,255,0.2)' },
  // Feed — general
  post_liked:           { icon: '❤️', accent: 'rgba(255,90,130,1)',   bg: 'rgba(255,90,130,0.07)',  border: 'rgba(255,90,130,0.2)' },
  post_commented:       { icon: '💬', accent: 'rgba(100,180,255,1)',  bg: 'rgba(100,180,255,0.07)', border: 'rgba(100,180,255,0.2)' },
  comment_replied:      { icon: '↩️', accent: 'rgba(130,210,255,1)',  bg: 'rgba(130,210,255,0.07)', border: 'rgba(130,210,255,0.2)' },
  mentioned:            { icon: '@',  accent: C.lime,   bg: C.limeDim,   border: C.limeBorder },
  // Feed — group
  group_post_created:   { icon: '📣', accent: C.purple,  bg: C.purpleDim, border: C.purpleBorder },
  group_announcement:   { icon: '📢', accent: 'rgba(255,180,0,0.9)', bg: C.amberDim, border: C.amberBorder },
};

// Category of each type (for filter tabs)
const TYPE_CATEGORY = {
  registration_success: 'events',
  payment_approved: 'events',
  payment_needs_attention: 'events',
  staff_invitation: 'events',
  event_reminder: 'events',
  post_liked: 'feed',
  post_commented: 'feed',
  comment_replied: 'feed',
  mentioned: 'feed',
  group_post_created: 'feed',
  group_announcement: 'feed',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  // Show date for older notifications
  const dt = new Date(dateStr);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Category label pill config
const CATEGORY_LABELS = {
  registration_success: { label: 'Event', color: C.lime, bg: C.limeDim },
  payment_approved:     { label: 'Payment', color: '#00e676', bg: 'rgba(0,230,118,0.07)' },
  payment_needs_attention: { label: 'Payment', color: C.amber, bg: C.amberDim },
  staff_invitation:     { label: 'Event', color: C.purple, bg: C.purpleDim },
  event_reminder:       { label: 'Event', color: 'rgba(180,120,255,1)', bg: 'rgba(180,120,255,0.07)' },
  post_liked:           { label: 'Feed', color: 'rgba(255,90,130,1)', bg: 'rgba(255,90,130,0.07)' },
  post_commented:       { label: 'Feed', color: 'rgba(100,180,255,1)', bg: 'rgba(100,180,255,0.07)' },
  comment_replied:      { label: 'Feed', color: 'rgba(130,210,255,1)', bg: 'rgba(130,210,255,0.07)' },
  mentioned:            { label: 'Mention', color: C.lime, bg: C.limeDim },
  group_post_created:   { label: 'Group', color: C.purple, bg: C.purpleDim },
  group_announcement:   { label: 'Group', color: C.amber, bg: C.amberDim },
};

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ notif, onRead, onNavigate }) {
  const cfg = TYPE_CFG[notif.type] || TYPE_CFG.registration_success;
  const isUnread = !notif.is_read;
  const isFeedGroup = notif.source_type === 'group_feed';

  return (
    <button
      onClick={() => {
        if (isUnread) onRead(notif.id);
        if (notif.action_url) onNavigate(notif.action_url);
      }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        width: '100%', padding: '14px 16px',
        borderBottom: `1px solid ${C.line}`,
        background: isUnread ? cfg.bg : 'transparent',
        borderLeft: isUnread ? `3px solid ${cfg.accent}` : '3px solid transparent',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: 'rgba(0,0,0,0.3)', border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: isUnread ? 800 : 600, color: C.text, margin: 0, lineHeight: 1.3 }}>
          {notif.title}
        </p>
        {notif.body && (
          <p style={{ fontSize: 12, color: C.muted, margin: '3px 0 0', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {notif.body}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          {/* Category label pill */}
          {CATEGORY_LABELS[notif.type] && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: CATEGORY_LABELS[notif.type].color,
              background: CATEGORY_LABELS[notif.type].bg,
              border: `1px solid ${CATEGORY_LABELS[notif.type].color}40`,
              padding: '2px 6px', borderRadius: 99,
            }}>
              {CATEGORY_LABELS[notif.type].label}
            </span>
          )}
          {/* Context pill: event title or group name */}
          {(notif.event_title || notif.group_name) && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 7px', borderRadius: 99, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {notif.group_name || notif.event_title}
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>
            {timeAgo(notif.created_date)}
          </span>
        </div>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime, flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${C.lime}` }} />
      )}
    </button>
  );
}

// ── Filter tabs config ────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'feed',   label: 'Feed' },
  { key: 'events', label: 'Events' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const panelRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: user.email },
      '-created_date',
      60
    ),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // Apply filter
  const displayed = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'feed') return TYPE_CATEGORY[n.type] === 'feed';
    if (filter === 'events') return TYPE_CATEGORY[n.type] === 'events';
    return true;
  });

  const handleNavigate = (url) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', width: 40, height: 40, borderRadius: 13,
          background: open ? C.purpleDim : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? C.purpleBorder : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 18, height: 18, color: open ? C.purple : 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 17, height: 17, borderRadius: 99,
            background: C.lime, color: '#0A0A0A',
            fontSize: 10, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '1.5px solid #0A0A0A',
            boxShadow: `0 0 8px rgba(191,255,0,0.5)`,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 99989 }}
        />
      )}

      {/* ── Side panel ── */}
      {open && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 420,
          background: C.panel,
          border: `1px solid ${C.purpleBorder}`,
          borderRadius: '0 0 0 20px',
          boxShadow: `-8px 0 40px rgba(138,43,226,0.2), 0 0 80px rgba(0,0,0,0.8)`,
          zIndex: 99990, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: 'max(env(safe-area-inset-top,0px),20px) 16px 0', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell style={{ width: 16, height: 16, color: C.purple }} />
                <h2 style={{ fontSize: 16, fontWeight: 900, color: C.text, margin: 0 }}>Notifications</h2>
                {unreadCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, background: C.lime, color: '#0A0A0A', padding: '2px 8px', borderRadius: 99 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 10,
                      background: C.purpleDim, border: `1px solid ${C.purpleBorder}`,
                      color: 'rgba(180,120,255,1)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <CheckCheck style={{ width: 12, height: 12 }} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 14, height: 14, color: C.muted }} />
                </button>
              </div>
            </div>

            {/* Filter tabs: All / Unread / Feed / Events */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 14, overflowX: 'auto' }}>
              {FILTERS.map(({ key, label }) => {
                const count = key === 'unread' ? unreadCount
                  : key === 'feed' ? notifications.filter(n => TYPE_CATEGORY[n.type] === 'feed' && !n.is_read).length
                  : key === 'events' ? notifications.filter(n => TYPE_CATEGORY[n.type] === 'events' && !n.is_read).length
                  : 0;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none', flexShrink: 0,
                      ...(filter === key
                        ? { background: C.purple, color: '#fff' }
                        : { background: 'rgba(255,255,255,0.06)', color: C.muted, border: `1px solid ${C.line}` }
                      ),
                    }}
                  >
                    {label}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {displayed.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔔</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.muted, margin: 0 }}>
                  {filter === 'unread' ? 'All caught up!' : `No ${filter === 'all' ? '' : filter + ' '}notifications yet`}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                  {filter === 'unread' ? "You're up to date." : "We'll notify you about relevant activity."}
                </p>
              </div>
            ) : (
              displayed.map(notif => (
                <NotifRow
                  key={notif.id}
                  notif={notif}
                  onRead={(id) => markReadMutation.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer glow accent */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.purple}, transparent)`, opacity: 0.4, flexShrink: 0 }} />
        </div>
      )}
    </div>
  );
}
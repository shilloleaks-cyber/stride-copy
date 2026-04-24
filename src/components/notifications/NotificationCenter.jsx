import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck, ChevronRight } from 'lucide-react';
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
  registration_success: {
    icon: '🎉',
    accent: C.lime,
    bg: C.limeDim,
    border: C.limeBorder,
  },
  payment_approved: {
    icon: '✅',
    accent: '#00e676',
    bg: 'rgba(0,230,118,0.07)',
    border: 'rgba(0,230,118,0.2)',
  },
  payment_needs_attention: {
    icon: '⚠️',
    accent: C.amber,
    bg: C.amberDim,
    border: C.amberBorder,
  },
  staff_invitation: {
    icon: '🔑',
    accent: C.purple,
    bg: C.purpleDim,
    border: C.purpleBorder,
  },
  event_reminder: {
    icon: '📅',
    accent: 'rgba(180,120,255,1)',
    bg: 'rgba(180,120,255,0.07)',
    border: 'rgba(180,120,255,0.2)',
  },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ notif, onRead, onNavigate }) {
  const cfg = TYPE_CFG[notif.type] || TYPE_CFG.registration_success;
  const isUnread = !notif.is_read;

  return (
    <button
      onClick={() => {
        if (isUnread) onRead(notif.id);
        if (notif.action_url) onNavigate(notif.action_url);
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        width: '100%',
        padding: '14px 16px',
        borderBottom: `1px solid ${C.line}`,
        background: isUnread ? cfg.bg : 'transparent',
        borderLeft: isUnread ? `3px solid ${cfg.accent}` : '3px solid transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: `rgba(0,0,0,0.3)`,
        border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          {notif.event_title && (
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.accent, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '2px 7px', borderRadius: 99 }}>
              {notif.event_title}
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted }}>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const panelRef = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
    refetchInterval: 30000, // poll every 30s
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
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

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
          position: 'relative',
          width: 40, height: 40,
          borderRadius: 13,
          background: open ? C.purpleDim : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? C.purpleBorder : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        aria-label="Notifications"
      >
        <Bell
          style={{
            width: 18, height: 18,
            color: open ? C.purple : 'rgba(255,255,255,0.45)',
            transition: 'color 0.15s',
          }}
        />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -5, right: -5,
            minWidth: 17, height: 17,
            borderRadius: 99,
            background: C.lime,
            color: '#0A0A0A',
            fontSize: 10, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '1.5px solid #0A0A0A',
            boxShadow: `0 0 8px rgba(191,255,0,0.5)`,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 420,
            background: C.panel,
            border: `1px solid ${C.purpleBorder}`,
            borderRadius: '0 0 0 20px',
            boxShadow: `-8px 0 40px rgba(138,43,226,0.2), 0 0 80px rgba(0,0,0,0.8)`,
            zIndex: 99990,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: 'max(env(safe-area-inset-top,0px),20px) 16px 0',
            borderBottom: `1px solid ${C.line}`,
            flexShrink: 0,
          }}>
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 14, height: 14, color: C.muted }} />
                </button>
              </div>
            </div>

            {/* All / Unread filter */}
            <div style={{ display: 'flex', gap: 6, paddingBottom: 14 }}>
              {[['all', 'All'], ['unread', 'Unread']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    padding: '6px 16px', borderRadius: 99,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                    ...(filter === key
                      ? { background: C.purple, color: '#fff' }
                      : { background: 'rgba(255,255,255,0.06)', color: C.muted, border: `1px solid ${C.line}` }
                    ),
                  }}
                >
                  {label}
                  {key === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {displayed.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔔</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.muted, margin: 0 }}>
                  {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                  {filter === 'unread' ? "You're up to date." : "We'll notify you about your events and registrations."}
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
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.purple}, transparent)`,
            opacity: 0.4,
            flexShrink: 0,
          }} />
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 99989,
          }}
        />
      )}
    </div>
  );
}
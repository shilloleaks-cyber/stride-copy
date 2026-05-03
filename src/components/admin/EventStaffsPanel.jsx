import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Plus, X, Loader2, ShieldCheck, Search, Check } from 'lucide-react';
import { format } from 'date-fns';
import { logActivity } from '@/lib/eventActivityLog';
import { notifyStaffInvitation } from '@/lib/notifications';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER  = 'rgba(0,200,80,0.12)';

const ROLE_DEFS = [
  { key: 'checkin',          label: 'Check-in',         color: 'rgba(180,120,255,1)' },
  { key: 'registrations',    label: 'Registrations',     color: 'rgba(100,180,255,1)' },
  { key: 'payments',         label: 'Payments',          color: 'rgba(255,200,80,1)'  },
  { key: 'categories',       label: 'Categories',        color: 'rgba(80,220,160,1)'  },
  { key: 'coupons',          label: 'Coupons',           color: 'rgba(255,140,100,1)' },
  { key: 'bib',              label: 'Bib',               color: 'rgba(200,160,255,1)' },
  { key: 'analytics',        label: 'Analytics',         color: 'rgba(100,200,255,1)' },
  { key: 'staff_management', label: 'Staff Mgmt',        color: 'rgba(255,100,150,1)' },
  { key: 'full_admin_view',  label: 'Full Admin View',   color: ACCENT                },
];

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'rgba(255,200,80,0.12)',  color: 'rgba(255,200,80,1)',   border: 'rgba(255,200,80,0.25)'  },
  accepted:  { label: 'Active',    bg: 'rgba(0,230,118,0.10)',   color: ACCENT,                 border: 'rgba(0,230,118,0.25)'   },
  declined:  { label: 'Declined',  bg: 'rgba(255,80,80,0.10)',   color: 'rgba(255,100,100,1)',  border: 'rgba(255,80,80,0.25)'   },
  revoked:   { label: 'Revoked',   bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)',border: 'rgba(255,255,255,0.1)'  },
};

const STATUS_ORDER = ['pending', 'accepted', 'declined', 'revoked'];

const normalizeEmail = (e) => String(e || '').toLowerCase().trim();

function RoleChip({ roleKey, small }) {
  const def = ROLE_DEFS.find(r => r.key === roleKey) || { label: roleKey, color: ACCENT };
  return (
    <span style={{
      fontSize: small ? 9 : 10, fontWeight: 700,
      padding: small ? '1px 5px' : '2px 7px', borderRadius: 6,
      background: `${def.color}18`, color: def.color,
      border: `1px solid ${def.color}30`, flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      {def.label}
    </span>
  );
}

function AvatarCircle({ name, email, size = 36 }) {
  const initials = (name || email || '?').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: 'linear-gradient(135deg,rgba(0,230,118,0.2),rgba(138,43,226,0.2))',
      border: '1px solid rgba(0,230,118,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.35, fontWeight: 800, color: ACCENT,
    }}>
      {initials}
    </div>
  );
}

// ── Add Staff Bottom Sheet ──────────────────────────────────────────────────────
function AddStaffSheet({ event, user, onClose, onCreated }) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [manualEmail, setManualEmail]     = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['checkin']);
  const [note, setNote]                   = useState('');
  const [saving, setSaving]              = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['public-profiles-search'],
    queryFn: () => base44.entities.PublicUserProfile.list('-updated_date', 200),
    staleTime: 60000,
  });

  const matchedProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return profiles.filter(p =>
      p.display_name?.toLowerCase().includes(q) ||
      p.user_email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [profiles, searchQuery]);

  const toggleRole = (key) => {
    setSelectedRoles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const targetEmail = selectedProfile
    ? normalizeEmail(selectedProfile.user_email)
    : normalizeEmail(manualEmail);

  const canSubmit = targetEmail && selectedRoles.length > 0 && !saving;

  const handleSend = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const assignment = await base44.entities.EventStaffAssignment.create({
        event_id: event.id,
        event_title: event.title,
        admin_email: normalizeEmail(user.email),
        staff_email: targetEmail,
        staff_display_name: selectedProfile?.display_name || targetEmail.split('@')[0],
        roles: selectedRoles,
        status: 'pending',
        invited_at: now,
        notes: note.trim() || null,
      });
      logActivity({
        eventId: event.id,
        actorEmail: user.email,
        actionType: 'staff_invited',
        targetType: 'staff',
        targetId: assignment?.id,
        summary: `Invited ${targetEmail} as staff (${selectedRoles.join(', ')})`,
      });
      // Send notification (non-blocking)
      notifyStaffInvitation({
        user_email: targetEmail,
        event_title: event.title,
        event_id: event.id,
        role: selectedRoles.join(', '),
      }).catch(() => {});
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
        background: 'linear-gradient(180deg,#0b1a10 0%,#050f08 100%)',
        borderTop: '1.5px solid rgba(0,230,118,0.3)',
        borderRadius: '24px 24px 0 0',
        maxHeight: '92dvh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        boxShadow: '0 -8px 60px rgba(0,230,118,0.15)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(0,230,118,0.25)' }} />
        </div>

        <div style={{ padding: '10px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Add Staff Member</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Search */}
          <div>
            <p style={LABEL_STYLE}>Search User</p>
            {!selectedProfile ? (
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(0,230,118,0.4)' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Display name or email…"
                  style={INPUT_STYLE_ICON}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.25)' }}>
                <AvatarCircle name={selectedProfile.display_name} email={selectedProfile.user_email} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{selectedProfile.display_name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{selectedProfile.user_email}</p>
                </div>
                <button onClick={() => { setSelectedProfile(null); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}

            {/* Dropdown */}
            {!selectedProfile && matchedProfiles.length > 0 && (
              <div style={{ marginTop: 4, borderRadius: 12, background: '#0b1a10', border: '1px solid rgba(0,230,118,0.18)', overflow: 'hidden' }}>
                {matchedProfiles.map(p => (
                  <button key={p.id} onClick={() => { setSelectedProfile(p); setSearchQuery(''); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(0,230,118,0.08)', textAlign: 'left' }}>
                    <AvatarCircle name={p.display_name} email={p.user_email} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0 }}>{p.display_name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.user_email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Manual email fallback */}
            {!selectedProfile && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 6px', fontWeight: 600 }}>Or enter email manually</p>
                <input
                  value={manualEmail}
                  onChange={e => setManualEmail(e.target.value)}
                  placeholder="staff@email.com"
                  type="email"
                  style={INPUT_STYLE}
                />
              </div>
            )}
          </div>

          {/* Role selection */}
          <div>
            <p style={LABEL_STYLE}>Roles <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(select one or more)</span></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ROLE_DEFS.map(r => {
                const active = selectedRoles.includes(r.key);
                return (
                  <button key={r.key} onClick={() => toggleRole(r.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 11px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      background: active ? `${r.color}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? r.color + '50' : 'rgba(255,255,255,0.09)'}`,
                      color: active ? r.color : 'rgba(255,255,255,0.5)',
                    }}>
                    {active && <Check style={{ width: 11, height: 11 }} />}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <p style={LABEL_STYLE}>Note <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(optional)</span></p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Handle Zone A check-in…"
              rows={2}
              style={{ ...INPUT_STYLE, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 14,
              background: canSubmit ? ACCENT : 'rgba(0,230,118,0.15)',
              color: canSubmit ? '#050f08' : 'rgba(0,230,118,0.4)',
              fontSize: 15, fontWeight: 900, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : null}
            Send Invite
          </button>
        </div>
      </div>
    </>
  );
}

// ── Edit Roles Sheet ────────────────────────────────────────────────────────────
function EditRolesSheet({ assignment, onClose, onSaved }) {
  const [selectedRoles, setSelectedRoles] = useState(assignment.roles || []);
  const [saving, setSaving] = useState(false);

  const toggleRole = (key) => {
    setSelectedRoles(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!selectedRoles.length) return;
    setSaving(true);
    try {
      await base44.entities.EventStaffAssignment.update(assignment.id, { roles: selectedRoles });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
        background: 'linear-gradient(180deg,#0b1a10 0%,#050f08 100%)',
        borderTop: '1.5px solid rgba(0,230,118,0.3)', borderRadius: '24px 24px 0 0',
        maxHeight: '80dvh', overflowY: 'auto',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
        boxShadow: '0 -8px 60px rgba(0,230,118,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(0,230,118,0.25)' }} />
        </div>
        <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Edit Roles</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Editing roles for <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{assignment.staff_display_name || assignment.staff_email}</strong>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ROLE_DEFS.map(r => {
              const active = selectedRoles.includes(r.key);
              return (
                <button key={r.key} onClick={() => toggleRole(r.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 11px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: active ? `${r.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? r.color + '50' : 'rgba(255,255,255,0.09)'}`,
                    color: active ? r.color : 'rgba(255,255,255,0.5)',
                  }}>
                  {active && <Check style={{ width: 11, height: 11 }} />}
                  {r.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSave}
            disabled={!selectedRoles.length || saving}
            style={{ width: '100%', padding: '13px 0', borderRadius: 14, background: selectedRoles.length ? ACCENT : 'rgba(0,230,118,0.15)', color: selectedRoles.length ? '#050f08' : 'rgba(0,230,118,0.4)', fontSize: 14, fontWeight: 900, border: 'none', cursor: selectedRoles.length ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
            Save Roles
          </button>
        </div>
      </div>
    </>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────────
const LABEL_STYLE = {
  fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)',
  textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px',
};
const INPUT_STYLE = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 13px', borderRadius: 12,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)',
  color: '#fff', fontSize: 13, outline: 'none',
};
const INPUT_STYLE_ICON = { ...INPUT_STYLE, paddingLeft: 36 };

// ── Staff card ──────────────────────────────────────────────────────────────────
function StaffCard({ assignment, canManage, onRevoke, onReinvite, onEditRoles }) {
  const st = STATUS_CFG[assignment.status] || STATUS_CFG.pending;
  const name = assignment.staff_display_name || assignment.staff_email?.split('@')[0] || '?';

  return (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AvatarCircle name={name} email={assignment.staff_email} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{name}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignment.staff_email}
          </p>
        </div>
      </div>

      {/* Roles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {(assignment.roles || []).map(r => <RoleChip key={r} roleKey={r} small />)}
      </div>

      {/* Timestamps */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {assignment.invited_at && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            Invited {format(new Date(assignment.invited_at), 'MMM d, HH:mm')}
          </span>
        )}
        {assignment.accepted_at && (
          <span style={{ fontSize: 10, color: 'rgba(0,230,118,0.5)' }}>
            Accepted {format(new Date(assignment.accepted_at), 'MMM d, HH:mm')}
          </span>
        )}
      </div>

      {/* Note */}
      {assignment.notes && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
          "{assignment.notes}"
        </p>
      )}

      {/* Actions */}
      {canManage && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {(assignment.status === 'pending' || assignment.status === 'accepted') && (
            <>
              <button onClick={() => onEditRoles(assignment)}
                style={ACTION_BTN_STYLE('#00e676')}>
                Edit Roles
              </button>
              <button onClick={() => onRevoke(assignment.id)}
                style={ACTION_BTN_STYLE('rgba(255,80,80,1)')}>
                Revoke
              </button>
            </>
          )}
          {(assignment.status === 'declined' || assignment.status === 'revoked') && (
            <button onClick={() => onReinvite(assignment.id)}
              style={ACTION_BTN_STYLE('#00e676')}>
              Re-invite
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const ACTION_BTN_STYLE = (color) => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: `${color}14`, border: `1px solid ${color}40`, color,
});

// ── Main Panel ──────────────────────────────────────────────────────────────────
export default function EventStaffsPanel({ event, user, eventRole }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd]           = useState(false);
  const [editTarget, setEditTarget]     = useState(null);

  const isGlobalAdmin   = user?.role === 'admin';
  const isEventFullAdmin = eventRole === 'full';
  const canManage       = isGlobalAdmin || isEventFullAdmin;

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['event-staff-assignments', event.id],
    queryFn: () => base44.entities.EventStaffAssignment.filter({ event_id: event.id }, '-invited_at', 100),
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['event-staff-assignments', event.id] });

  const revokeMutation = useMutation({
    mutationFn: (id) => base44.entities.EventStaffAssignment.update(id, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      logActivity({ eventId: event.id, actorEmail: user.email, actionType: 'staff_revoked', targetType: 'staff', summary: 'Revoked staff access' });
      refetch();
    },
  });

  const reinviteMutation = useMutation({
    mutationFn: (id) => base44.entities.EventStaffAssignment.update(id, {
      status: 'pending',
      invited_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      logActivity({ eventId: event.id, actorEmail: user.email, actionType: 'staff_reinvited', targetType: 'staff', summary: 'Re-invited staff' });
      refetch();
    },
  });

  // Group assignments by status
  const grouped = useMemo(() => {
    const groups = {};
    STATUS_ORDER.forEach(s => { groups[s] = []; });
    assignments.forEach(a => {
      const s = a.status || 'pending';
      if (groups[s]) groups[s].push(a);
    });
    return groups;
  }, [assignments]);

  const totalActive = grouped.accepted?.length || 0;
  const totalPending = grouped.pending?.length || 0;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            {totalActive} Active{totalPending > 0 ? ` · ${totalPending} Pending` : ''}
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: ACCENT, color: '#050f08', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            <Plus style={{ width: 13, height: 13 }} /> Add Staff
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20 }}>Loading…</p>}

      {/* Empty */}
      {!isLoading && assignments.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, border: '1px dashed rgba(0,230,118,0.15)', borderRadius: 16 }}>
          <UserCog style={{ width: 28, height: 28, color: 'rgba(0,230,118,0.25)', margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>No staff added yet</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Add staff to grant scoped event access</p>
        </div>
      )}

      {/* Grouped sections */}
      {STATUS_ORDER.map(status => {
        const list = grouped[status] || [];
        if (!list.length) return null;
        const cfg = STATUS_CFG[status];
        return (
          <div key={status}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{list.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(a => (
                <StaffCard
                  key={a.id}
                  assignment={a}
                  canManage={canManage}
                  onRevoke={id => revokeMutation.mutate(id)}
                  onReinvite={id => reinviteMutation.mutate(id)}
                  onEditRoles={setEditTarget}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {showAdd && canManage && (
        <AddStaffSheet event={event} user={user} onClose={() => setShowAdd(false)} onCreated={refetch} />
      )}
      {editTarget && (
        <EditRolesSheet assignment={editTarget} onClose={() => setEditTarget(null)} onSaved={refetch} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Plus, X, Loader2 } from 'lucide-react';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

const ROLES = [
  { key: 'registrations', label: 'Registrations', desc: 'View & approve registrations' },
  { key: 'payments', label: 'Payments', desc: 'Review & approve payments' },
  { key: 'checkin', label: 'Check-in', desc: 'Event day check-in tools' },
  { key: 'full', label: 'Full Admin', desc: 'Full event management access' },
];

export default function EventStaffsPanel({ event }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('checkin');

  const { data: staffs = [], isLoading } = useQuery({
    queryKey: ['event-staffs', event.id],
    queryFn: () => base44.entities.BoothStaff.filter({ event_id: event.id }),
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.BoothStaff.create({ event_id: event.id, email: email.trim(), role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-staffs', event.id] });
      setEmail('');
      setShowAdd(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.BoothStaff.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-staffs', event.id] }),
  });

  const roleMap = Object.fromEntries(ROLES.map(r => [r.key, r]));

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          {staffs.length} Staff Member{staffs.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowAdd(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: ACCENT, color: '#050f08', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer' }}
        >
          <Plus style={{ width: 13, height: 13 }} /> Add Staff
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: CARD_BG, border: '1px solid rgba(0,230,118,0.2)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Add Staff Member</p>
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Staff email address"
            style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontWeight: 600 }}>Access Role</p>
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: 'none',
                  background: role === r.key ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${role === r.key ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${role === r.key ? ACCENT : 'rgba(255,255,255,0.2)'}`, background: role === r.key ? ACCENT : 'transparent', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: role === r.key ? ACCENT : 'rgba(255,255,255,0.7)', margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: '1px 0 0' }}>{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!email.trim() || addMutation.isPending}
              style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: ACCENT, color: '#050f08', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {addMutation.isPending && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              Add Staff
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{ padding: '11px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff list */}
      {isLoading && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 20 }}>Loading...</p>}
      {!isLoading && staffs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, border: '1px dashed rgba(0,230,118,0.15)', borderRadius: 16 }}>
          <UserCog style={{ width: 28, height: 28, color: 'rgba(0,230,118,0.25)', margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: 0 }}>No staff added yet</p>
        </div>
      )}
      {staffs.map(staff => {
        const roleCfg = roleMap[staff.role] || { label: staff.role };
        return (
          <div key={staff.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCog style={{ width: 16, height: 16, color: ACCENT }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff.email}</p>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,230,118,0.1)', color: ACCENT, display: 'inline-block', marginTop: 3 }}>{roleCfg.label}</span>
            </div>
            <button
              onClick={() => removeMutation.mutate(staff.id)}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X style={{ width: 13, height: 13, color: 'rgba(255,100,100,0.8)' }} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, Check, Loader2, X, Users, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function EventInviteSheet({ event, user, onClose }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  // useRef for in-flight dedup (survives across async boundaries without waiting for re-render)
  const inFlightRef = useRef(new Set());
  // useState for UI re-render when optimistic invite is added
  const [localSent, setLocalSent] = useState(new Set());

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-invite'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-group-memberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const groupMembershipIds = myMemberships.map(m => m.group_id).join(',');

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['group-members-for-invite', groupMembershipIds],
    queryFn: async () => {
      const groupIds = myMemberships.map(m => m.group_id);
      if (!groupIds.length) return [];
      const results = await Promise.all(
        groupIds.map(gid => base44.entities.GroupMember.filter({ group_id: gid, status: 'active' }))
      );
      return results.flat();
    },
    enabled: myMemberships.length > 0,
  });

  // Always fetch fresh on mount so "Invited" state is correct after close/reopen
  const { data: existingInvites = [] } = useQuery({
    queryKey: ['event-invites', event.id],
    queryFn: () => base44.entities.EventInvite.filter({ event_id: event.id }),
    staleTime: 0,
  });

  // Combine: server-confirmed + locally sent (optimistic) — both persist across renders
  const alreadyInvited = useMemo(() => {
    const set = new Set(existingInvites.map(i => i.invited_user_email));
    localSent.forEach(e => set.add(e));
    return set;
  }, [existingInvites, localSent]);

  const candidates = useMemo(() => {
    const gmEmails = new Set(groupMembers.map(m => m.user_email));
    const seen = new Set([user?.email]);
    const list = [];
    allUsers.forEach(u => {
      if (seen.has(u.email)) return;
      seen.add(u.email);
      list.push({ email: u.email, name: u.full_name || u.email, isGroupMember: gmEmails.has(u.email) });
    });
    return list.sort((a, b) => (b.isGroupMember ? 1 : 0) - (a.isGroupMember ? 1 : 0));
  }, [allUsers, groupMembers, user?.email]);

  const filtered = candidates.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      // useRef-based guard: blocks duplicate calls even on slow network
      // before the React re-render from onMutate has a chance to fire
      if (inFlightRef.current.has(email) || alreadyInvited.has(email)) {
        throw new Error('already_invited');
      }
      inFlightRef.current.add(email);
      return base44.entities.EventInvite.create({
        event_id: event.id,
        invited_user_email: email,
        invited_by: user.email,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    },
    onMutate: (email) => {
      // Optimistic UI update
      setLocalSent(prev => new Set(prev).add(email));
    },
    onSuccess: (_, email) => {
      inFlightRef.current.delete(email);
      queryClient.invalidateQueries({ queryKey: ['event-invites', event.id] });
      toast.success('Invite sent!');
    },
    onError: (err, email) => {
      inFlightRef.current.delete(email);
      if (err.message === 'already_invited') return; // silent — UI already correct
      // Roll back optimistic on unexpected errors
      setLocalSent(prev => { const next = new Set(prev); next.delete(email); return next; });
      toast.error('Failed to send invite');
    },
  });

  return (
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col overflow-hidden"
        style={{
          background: 'rgba(16,16,16,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '80dvh',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Invite Friends</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{event.title}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <X style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', position: 'relative', flexShrink: 0 }}>
          <Search style={{ position: 'absolute', left: 34, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12, padding: '10px 12px 10px 36px',
              color: 'white', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 8px', WebkitOverflowScrolling: 'touch' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              No users found
            </div>
          )}
          {filtered.map(c => {
            const invited = alreadyInvited.has(c.email);
            const isPending = inviteMutation.isPending && inviteMutation.variables === c.email;
            return (
              <div key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(138,43,226,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#BFFF00' }}>
                    {(c.name || c.email)[0].toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  {c.isGroupMember && (
                    <span style={{ fontSize: 11, color: 'rgba(138,180,255,0.8)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Users style={{ width: 11, height: 11 }} /> Group member
                    </span>
                  )}
                </div>
                <button
                  onClick={() => !invited && !isPending && inviteMutation.mutate(c.email)}
                  disabled={invited || isPending}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                    ...(invited
                      ? { background: 'rgba(191,255,0,0.08)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)', cursor: 'default' }
                      : { background: '#BFFF00', color: '#0A0A0A', border: 'none', cursor: 'pointer' }
                    ),
                  }}
                >
                  {isPending
                    ? <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                    : invited
                      ? <><Check style={{ width: 13, height: 13 }} /> Invited</>
                      : <><UserPlus style={{ width: 13, height: 13 }} /> Invite</>
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
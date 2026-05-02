import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function StrideStaffDashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['staff-assignments', user?.email],
    queryFn: () => base44.entities.EventStaffAssignment.filter({ staff_email: user.email, status: 'accepted' }, '-accepted_at', 50),
    enabled: !!user?.email,
  });

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Events
        </button>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(138,43,226,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          Staff Access
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Staff Dashboard</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          Events where you have staff access
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading…</div>
        ) : assignments.length === 0 ? (
          <div style={{
            borderRadius: 20, padding: '48px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🎟️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>No staff assignments</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              When an event admin invites you as staff and you accept, it'll appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assignments.map(a => (
              <StaffAssignmentCard key={a.id} assignment={a} onOpen={() => navigate(`/StrideEventDetail?event_id=${a.event_id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffAssignmentCard({ assignment, onOpen }) {
  return (
    <div style={{
      borderRadius: 18, padding: '16px',
      background: 'rgba(22,22,22,0.9)', border: '1px solid rgba(138,43,226,0.22)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.35)',
              color: 'rgba(180,100,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Staff</span>
            {assignment.roles?.map(role => (
              <span key={role} style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.2)',
                color: 'rgba(191,255,0,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{role}</span>
            ))}
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>
            {assignment.event_title || 'Event'}
          </p>
          {assignment.admin_email && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Invited by {assignment.admin_email}</p>
          )}
          {assignment.accepted_at && (
            <p style={{ fontSize: 11, color: 'rgba(191,255,0,0.45)', margin: '3px 0 0' }}>
              ✓ Accepted {new Date(assignment.accepted_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={onOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 12, flexShrink: 0,
            background: 'rgba(138,43,226,0.12)', border: '1px solid rgba(138,43,226,0.35)',
            color: 'rgba(180,100,255,0.95)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ExternalLink style={{ width: 13, height: 13 }} />
          View Event
        </button>
      </div>
      {assignment.notes && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{assignment.notes}</p>
        </div>
      )}
    </div>
  );
}
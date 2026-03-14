import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, ToggleLeft, ToggleRight, BarChart3, Loader2 } from 'lucide-react';

export default function StaffManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newSponsorId, setNewSponsorId] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['booth-staff-all'],
    queryFn: () => base44.entities.BoothStaff.list('-created_date', 200),
    enabled: user?.role === 'admin',
  });

  const { data: sponsors = [] } = useQuery({
    queryKey: ['all-sponsors-dash'],
    queryFn: () => base44.entities.Sponsor.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const sponsorMap = Object.fromEntries(sponsors.map(s => [s.id, s]));

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.BoothStaff.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booth-staff-all'] }),
  });

  const handleAdd = async () => {
    if (!newEmail.trim() || !newSponsorId) return;
    setAdding(true);
    await base44.entities.BoothStaff.create({
      user_id: newEmail.trim().toLowerCase(),
      sponsor_id: newSponsorId,
      role: 'staff',
      is_active: true,
    });
    queryClient.invalidateQueries({ queryKey: ['booth-staff-all'] });
    setNewEmail('');
    setNewSponsorId('');
    setShowAddForm(false);
    setAdding(false);
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold mb-2">Access Denied</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  // Group by sponsor
  const grouped = sponsors.map(sponsor => ({
    sponsor,
    members: staffList.filter(s => s.sponsor_id === sponsor.id),
  })).filter(g => g.members.length > 0);

  const ungrouped = staffList.filter(s => !sponsors.find(sp => sp.id === s.sponsor_id));

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: 'white',
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4"
        style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</p>
          <h1 className="text-xl font-bold text-white leading-tight">Staff Management</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate(createPageUrl('CouponDashboard'))}
            className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{ background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)' }}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{ background: '#BFFF00', color: '#0A0A0A' }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-4">

        {/* Add form */}
        {showAddForm && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.15)' }}
          >
            <p className="text-sm font-bold text-white">Add Booth Staff</p>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="staff@email.com"
              style={inputStyle}
            />
            <select
              value={newSponsorId}
              onChange={e => setNewSponsorId(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="">Select sponsor...</option>
              {sponsors.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || !newEmail.trim() || !newSponsorId}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#BFFF00', color: '#0A0A0A', opacity: (!newEmail.trim() || !newSponsorId) ? 0.5 : 1 }}
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {adding ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading...</div>
        )}

        {!isLoading && staffList.length === 0 && !showAddForm && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-2xl mb-2">👥</p>
            <p className="text-sm font-semibold text-white mb-1">No staff added yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Add booth staff to allow them to redeem coupons</p>
          </div>
        )}

        {/* Grouped by sponsor */}
        {grouped.map(({ sponsor, members }) => (
          <div key={sponsor.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(138,43,226,0.06)' }}
            >
              {sponsor.logo ? (
                <img src={sponsor.logo} alt={sponsor.name} className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(138,43,226,0.3)', color: '#BFFF00' }}>
                  {sponsor.name[0]}
                </div>
              )}
              <p className="text-sm font-bold text-white">{sponsor.name}</p>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                {members.length} staff
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {members.map(staff => (
                <StaffRow key={staff.id} staff={staff} onToggle={() => toggleMutation.mutate({ id: staff.id, is_active: !staff.is_active })} loading={toggleMutation.isPending} />
              ))}
            </div>
          </div>
        ))}

        {/* Ungrouped */}
        {ungrouped.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>Unknown Sponsor</p>
            </div>
            {ungrouped.map(staff => (
              <StaffRow key={staff.id} staff={staff} onToggle={() => toggleMutation.mutate({ id: staff.id, is_active: !staff.is_active })} loading={toggleMutation.isPending} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffRow({ staff, onToggle, loading }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: staff.is_active ? 'rgba(191,255,0,0.15)' : 'rgba(255,255,255,0.06)', color: staff.is_active ? '#BFFF00' : 'rgba(255,255,255,0.3)' }}
      >
        {staff.user_id[0]?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: staff.is_active ? 'white' : 'rgba(255,255,255,0.4)' }}>
          {staff.user_id}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{staff.role}</p>
      </div>
      <button onClick={onToggle} disabled={loading} className="flex-shrink-0 transition-all">
        {staff.is_active
          ? <ToggleRight className="w-7 h-7" style={{ color: '#BFFF00' }} />
          : <ToggleLeft className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.25)' }} />
        }
      </button>
    </div>
  );
}
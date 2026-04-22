import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import RegistrationDetailSheet from '@/components/stride/RegistrationDetailSheet';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)' },
  confirmed: { label: 'Confirmed', color: '#00e676',             bg: 'rgba(0,230,118,0.1)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)' },
  rejected:  { label: 'Rejected',  color: 'rgba(255,80,80,0.8)', bg: 'rgba(255,80,80,0.08)' },
};

export default function EventRegistrationsPanel({ event, registrations, categories, onRegsUpdated }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [detailReg, setDetailReg] = useState(null);

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const eventMap = { [event.id]: event };

  const eventRegs = registrations.filter(r => r.event_id === event.id);

  const filtered = eventRegs.filter(r => {
    if (catFilter !== 'all' && r.category_id !== catFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (quickFilter === 'pending' && r.status !== 'pending') return false;
    if (quickFilter === 'confirmed' && r.status !== 'confirmed') return false;
    if (quickFilter === 'checked_in' && !r.checked_in) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.first_name} ${r.last_name} ${r.user_email} ${r.bib_number}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    all: eventRegs.length,
    pending: eventRegs.filter(r => r.status === 'pending').length,
    confirmed: eventRegs.filter(r => r.status === 'confirmed').length,
    checked_in: eventRegs.filter(r => r.checked_in).length,
  };

  const quickFilters = [
    { key: 'all', label: 'All', value: stats.all },
    { key: 'pending', label: 'Pending', value: stats.pending },
    { key: 'confirmed', label: 'Confirmed', value: stats.confirmed },
    { key: 'checked_in', label: 'Checked In', value: stats.checked_in },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Quick filter pills */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {quickFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setQuickFilter(f.key)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 5,
              ...(quickFilter === f.key
                ? { background: ACCENT, color: '#050f08' }
                : { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.55)', border: '1px solid rgba(0,230,118,0.15)' }
              ),
            }}
          >
            {f.label}
            <span style={{
              fontSize: 10, fontWeight: 900, padding: '1px 5px', borderRadius: 99,
              background: quickFilter === f.key ? 'rgba(5,15,8,0.25)' : 'rgba(0,230,118,0.15)',
              color: quickFilter === f.key ? '#050f08' : ACCENT,
            }}>{f.value}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(0,230,118,0.4)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, bib..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
        <select
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none' }}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none' }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Count */}
      <p style={{ fontSize: 11, color: 'rgba(0,230,118,0.4)', margin: '0 16px', fontWeight: 600 }}>
        {filtered.length} registration{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)' }}>No registrations found</div>
        )}
        {filtered.map(reg => {
          const cat = catMap[reg.category_id];
          const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;
          return (
            <button
              key={reg.id}
              onClick={() => setDetailReg(reg)}
              style={{ width: '100%', textAlign: 'left', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{reg.first_name} {reg.last_name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{reg.user_email}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  {cat && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,230,118,0.1)', color: ACCENT }}>{cat.name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                <span>Bib: <strong style={{ color: reg.bib_number ? ACCENT : 'rgba(255,255,255,0.3)' }}>{reg.bib_number || '—'}</strong></span>
                {reg.checked_in && <span style={{ color: ACCENT, fontWeight: 700 }}>✓ Checked In</span>}
                <span style={{ marginLeft: 'auto' }}>{format(new Date(reg.created_date), 'MMM d')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {detailReg && (
        <RegistrationDetailSheet
          reg={detailReg}
          eventMap={eventMap}
          catMap={catMap}
          registrations={registrations}
          onClose={() => setDetailReg(null)}
          onUpdated={() => { setDetailReg(null); if (onRegsUpdated) onRegsUpdated(); }}
        />
      )}
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Search, Download, CheckSquare, Square, ChevronDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

const PAYMENT_STATUS_CFG = {
  not_required: { label: 'Not Required', color: 'rgba(255,255,255,0.4)' },
  pending:      { label: 'Pay Pending',  color: 'rgba(255,200,80,1)' },
  paid:         { label: 'Paid',         color: '#00e676' },
  refunded:     { label: 'Refunded',     color: 'rgba(255,80,80,0.8)' },
};

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
};

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCSV(rows, catMap) {
  const headers = ['First Name','Last Name','Email','Phone','Bib','Category','Status','Payment Status','Checked In','Registered'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.first_name, r.last_name, r.user_email, r.phone || '',
      r.bib_number || '',
      catMap[r.category_id]?.name || '',
      r.status, r.payment_status || '',
      r.checked_in ? 'Yes' : 'No',
      r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];
  return lines.join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function EventRegistrationsPanel({ event, registrations, categories, onRegsUpdated }) {
  const [search, setSearch]               = useState('');
  const [catFilter, setCatFilter]         = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');
  const [quickFilter, setQuickFilter]     = useState('all');
  const [detailReg, setDetailReg]         = useState(null);
  const [selected, setSelected]           = useState(new Set());
  const [bulkMenuOpen, setBulkMenuOpen]   = useState(false);

  const queryClient = useQueryClient();

  const catMap   = Object.fromEntries(categories.map(c => [c.id, c]));
  const eventMap = { [event.id]: event };
  const slug     = makeSlug(event.title);
  const today    = format(new Date(), 'yyyy-MM-dd');

  const eventRegs = registrations.filter(r => r.event_id === event.id);

  const filtered = useMemo(() => eventRegs.filter(r => {
    if (catFilter !== 'all' && r.category_id !== catFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && r.payment_status !== paymentFilter) return false;
    if (checkinFilter === 'checked_in' && !r.checked_in) return false;
    if (checkinFilter === 'not_checked_in' && r.checked_in) return false;
    if (quickFilter === 'pending' && r.status !== 'pending') return false;
    if (quickFilter === 'confirmed' && r.status !== 'confirmed') return false;
    if (quickFilter === 'checked_in' && !r.checked_in) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${r.first_name} ${r.last_name} ${r.user_email} ${r.bib_number || ''} ${r.phone || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [eventRegs, catFilter, statusFilter, paymentFilter, checkinFilter, quickFilter, search]);

  const stats = {
    all:        eventRegs.length,
    pending:    eventRegs.filter(r => r.status === 'pending').length,
    confirmed:  eventRegs.filter(r => r.status === 'confirmed').length,
    checked_in: eventRegs.filter(r => r.checked_in).length,
  };

  const quickFilters = [
    { key: 'all',        label: 'All',        value: stats.all },
    { key: 'pending',    label: 'Pending',    value: stats.pending },
    { key: 'confirmed',  label: 'Confirmed',  value: stats.confirmed },
    { key: 'checked_in', label: 'Checked In', value: stats.checked_in },
  ];

  // Selection helpers
  const allFilteredIds = filtered.map(r => r.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allFilteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredIds]));
    }
  };

  const selectedRows = filtered.filter(r => selected.has(r.id));

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedRows.map(r =>
        base44.entities.EventRegistration.update(r.id, { status: 'confirmed' })
      ));
    },
    onSuccess: () => {
      setSelected(new Set());
      setBulkMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      if (onRegsUpdated) onRegsUpdated();
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedRows.map(r =>
        base44.entities.EventRegistration.update(r.id, { status: 'rejected' })
      ));
    },
    onSuccess: () => {
      setSelected(new Set());
      setBulkMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      if (onRegsUpdated) onRegsUpdated();
    },
  });

  const isBulkBusy = bulkApproveMutation.isPending || bulkRejectMutation.isPending;

  // Export helpers
  const exportFiltered  = () => downloadCSV(buildCSV(filtered, catMap),      `${slug}-registrations-${today}.csv`);
  const exportSelected  = () => downloadCSV(buildCSV(selectedRows, catMap),  `${slug}-registrations-selected-${today}.csv`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Quick filter pills */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {quickFilters.map(f => (
          <button key={f.key} onClick={() => { setQuickFilter(f.key); setSelected(new Set()); }}
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
          value={search} onChange={e => { setSearch(e.target.value); setSelected(new Set()); }}
          placeholder="Search name, email, bib, phone..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filters row 1 */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Filters row 2 */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Payment</option>
          <option value="not_required">Not Required</option>
          <option value="pending">Pay Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={checkinFilter} onChange={e => setCheckinFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Check-in</option>
          <option value="checked_in">Checked In</option>
          <option value="not_checked_in">Not Checked In</option>
        </select>
      </div>

      {/* Toolbar: count + select-all + bulk actions + export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', flexWrap: 'wrap' }}>
        {/* Select all toggle */}
        <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,230,118,0.6)', fontSize: 11, fontWeight: 700, padding: 0 }}>
          {allSelected
            ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} />
            : <Square style={{ width: 14, height: 14 }} />
          }
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        <span style={{ fontSize: 11, color: 'rgba(0,230,118,0.4)', fontWeight: 600 }}>
          {filtered.length} shown{someSelected ? ` · ${selected.size} selected` : ''}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Bulk actions (only when rows selected) */}
          {someSelected && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBulkMenuOpen(v => !v)}
                disabled={isBulkBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.35)', color: 'rgba(190,140,255,1)',
                }}
              >
                {isBulkBusy ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> : null}
                Bulk ({selected.size}) <ChevronDown style={{ width: 11, height: 11 }} />
              </button>
              {bulkMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%', zIndex: 50,
                  background: '#0f0f1a', border: '1px solid rgba(138,43,226,0.3)', borderRadius: 12,
                  minWidth: 180, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  {[
                    { label: '✅ Approve selected', action: () => bulkApproveMutation.mutate(), color: '#00e676' },
                    { label: '❌ Reject selected',  action: () => bulkRejectMutation.mutate(),  color: 'rgba(255,80,80,0.9)' },
                    { label: '⬇ Export selected CSV', action: () => { exportSelected(); setBulkMenuOpen(false); }, color: ACCENT },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: item.color, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export filtered */}
          <button onClick={exportFiltered}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: ACCENT,
            }}
          >
            <Download style={{ width: 12, height: 12 }} /> Export
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔍</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.35)' }}>No registrations found</p>
          <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search or filters</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
        {filtered.map(reg => {
          const cat    = catMap[reg.category_id];
          const cfg    = STATUS_CFG[reg.status] || STATUS_CFG.pending;
          const payCfg = PAYMENT_STATUS_CFG[reg.payment_status];
          const isSel  = selected.has(reg.id);
          return (
            <div key={reg.id} style={{ position: 'relative', display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* Checkbox */}
              <button
                onClick={(e) => toggleSelect(reg.id, e)}
                style={{
                  flexShrink: 0, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSel ? 'rgba(0,230,118,0.08)' : 'transparent',
                  border: `1px solid ${isSel ? 'rgba(0,230,118,0.3)' : BORDER}`,
                  borderRight: 'none', borderRadius: '12px 0 0 12px', cursor: 'pointer',
                }}
              >
                {isSel
                  ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} />
                  : <Square style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} />
                }
              </button>
              {/* Card */}
              <button
                onClick={() => setDetailReg(reg)}
                style={{
                  flex: 1, textAlign: 'left', background: isSel ? 'rgba(0,230,118,0.04)' : CARD_BG,
                  border: `1px solid ${isSel ? 'rgba(0,230,118,0.3)' : BORDER}`,
                  borderRadius: '0 12px 12px 0', padding: '12px 14px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{reg.first_name} {reg.last_name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{reg.user_email}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {cat && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,230,118,0.1)', color: ACCENT }}>{cat.name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
                  <span>Bib: <strong style={{ color: reg.bib_number ? ACCENT : 'rgba(255,255,255,0.3)' }}>{reg.bib_number || '—'}</strong></span>
                  {payCfg && <span style={{ color: payCfg.color, fontWeight: 600 }}>{payCfg.label}</span>}
                  {reg.checked_in && <span style={{ color: ACCENT, fontWeight: 700 }}>✓ In</span>}
                  <span style={{ marginLeft: 'auto' }}>{reg.created_date ? format(new Date(reg.created_date), 'MMM d') : ''}</span>
                </div>
              </button>
            </div>
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
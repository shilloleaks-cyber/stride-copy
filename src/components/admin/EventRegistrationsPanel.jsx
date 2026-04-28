import React, { useState, useMemo } from 'react';
import { Search, Download, CheckSquare, Square, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import RegistrationDetailSheet from '@/components/stride/RegistrationDetailSheet';
import BulkConfirmDialog from './BulkConfirmDialog';
import BulkResultBanner from './BulkResultBanner';
import SelectionBar from './SelectionBar';
import { logActivity } from '@/lib/eventActivityLog';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER  = 'rgba(0,200,80,0.12)';

import { REG_STATUS as STATUS_CFG, PAY_STATUS } from '@/lib/eventStatusConfig';

const PAYMENT_STATUS_CFG = {
  not_required: { label: PAY_STATUS.not_required.label,    color: PAY_STATUS.not_required.color },
  pending:      { label: PAY_STATUS.pending.label,         color: PAY_STATUS.pending.color },
  paid:         { label: PAY_STATUS.paid.label,            color: PAY_STATUS.paid.color },
  needs_attention: { label: PAY_STATUS.needs_attention.label, color: PAY_STATUS.needs_attention.color },
  refunded:     { label: PAY_STATUS.refunded.label,        color: PAY_STATUS.refunded.color },
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

export default function EventRegistrationsPanel({ event, registrations, categories, onRegsUpdated, canApprove = true, canReject = true, actorEmail, isFullAdmin = false }) {
  const [search, setSearch]               = useState('');
  const [catFilter, setCatFilter]         = useState('all');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');
  const [quickFilter, setQuickFilter]     = useState('all');
  const [detailReg, setDetailReg]         = useState(null);
  const [selected, setSelected]           = useState(new Set());
  const [confirm, setConfirm]             = useState(null); // 'approve' | 'reject' | null
  const [result, setResult]               = useState(null); // BulkResultBanner payload

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

  // Selection
  const allFilteredIds = filtered.map(r => r.id);
  const allSelected    = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected   = selected.size > 0;
  const selectedRows   = filtered.filter(r => selected.has(r.id));

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); allFilteredIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredIds]));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // Bulk approve mutation — with per-item result tracking
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      if (!canApprove) throw new Error('Permission denied');
      const results = await Promise.allSettled(
        selectedRows.map(r => base44.entities.EventRegistration.update(r.id, { status: 'confirmed' }))
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed    = results.filter(r => r.status === 'rejected').length;
      return { succeeded, failed, total: selectedRows.length };
    },
    onSuccess: ({ succeeded, failed }) => {
      logActivity({ eventId: event.id, actorEmail, actionType: 'bulk_approve_registrations', targetType: 'registration', summary: `Bulk approved ${succeeded} registration(s)`, meta: { succeeded, failed, total: selectedRows.length } });
      clearSelection();
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      if (onRegsUpdated) onRegsUpdated();
      const lines = [`${succeeded} approved successfully`];
      if (failed > 0) lines.push(`${failed} failed — please try again`);
      setResult({ lines, isError: failed > 0 && succeeded === 0 });
    },
  });

  // Bulk reject mutation — with per-item result tracking
  const bulkRejectMutation = useMutation({
    mutationFn: async () => {
      if (!canReject) throw new Error('Permission denied');
      const results = await Promise.allSettled(
        selectedRows.map(r => base44.entities.EventRegistration.update(r.id, { status: 'rejected' }))
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed    = results.filter(r => r.status === 'rejected').length;
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      logActivity({ eventId: event.id, actorEmail, actionType: 'bulk_reject_registrations', targetType: 'registration', summary: `Bulk rejected ${succeeded} registration(s)`, meta: { succeeded, failed } });
      clearSelection();
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      if (onRegsUpdated) onRegsUpdated();
      const lines = [`${succeeded} rejected`];
      if (failed > 0) lines.push(`${failed} failed — please try again`);
      setResult({ lines, isError: failed > 0 && succeeded === 0 });
    },
  });

  const isConfirmLoading = bulkApproveMutation.isPending || bulkRejectMutation.isPending;

  const handleConfirm = () => {
    if (confirm === 'approve') bulkApproveMutation.mutate();
    if (confirm === 'reject')  bulkRejectMutation.mutate();
  };

  // Export
  const exportFiltered = () => downloadCSV(buildCSV(filtered, catMap),     `${slug}-registrations-${today}.csv`);
  const exportSelected = () => downloadCSV(buildCSV(selectedRows, catMap), `${slug}-registrations-selected-${today}.csv`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Quick filter pills */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {quickFilters.map(f => (
          <button key={f.key} onClick={() => { setQuickFilter(f.key); clearSelection(); }}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 5,
              ...(quickFilter === f.key
                ? { background: ACCENT, color: '#050f08' }
                : { background: 'rgba(0,230,118,0.07)', color: 'rgba(0,230,118,0.55)', border: '1px solid rgba(0,230,118,0.15)' }),
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
          value={search} onChange={e => { setSearch(e.target.value); clearSelection(); }}
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

      {/* Result banner */}
      <BulkResultBanner result={result} onClose={() => setResult(null)} />

      {/* Selection bar (replaces old inline toolbar when selected) */}
      {someSelected ? (
      <SelectionBar
      count={selected.size}
      onClear={clearSelection}
      onExport={exportSelected}
      actions={[
        ...(canApprove ? [{ label: 'Approve', icon: CheckCircle2, onClick: () => setConfirm('approve'), color: '#00e676' }] : []),
        ...(canReject  ? [{ label: 'Reject',  icon: XCircle,      onClick: () => setConfirm('reject'),  color: 'rgba(255,90,90,0.9)' }] : []),
      ]}
        />
      ) : (
        /* Toolbar when nothing selected */
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
          <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,230,118,0.6)', fontSize: 11, fontWeight: 700, padding: 0 }}>
            {allSelected ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} /> : <Square style={{ width: 14, height: 14 }} />}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span style={{ fontSize: 11, color: 'rgba(0,230,118,0.4)', fontWeight: 600 }}>{filtered.length} shown</span>
          <button onClick={exportFiltered} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: ACCENT }}>
            <Download style={{ width: 12, height: 12 }} /> Export
          </button>
        </div>
      )}

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
          const cfg    = STATUS_CFG[reg.status] || { label: reg.status, color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' };
          const payCfg = PAYMENT_STATUS_CFG[reg.payment_status];
          const isSel  = selected.has(reg.id);
          return (
            <div key={reg.id} style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* Checkbox */}
              <button onClick={(e) => toggleSelect(reg.id, e)}
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
              <button onClick={() => setDetailReg(reg)}
                style={{
                  flex: 1, textAlign: 'left',
                  background: isSel ? 'rgba(0,230,118,0.04)' : CARD_BG,
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
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg?.bg, color: cfg?.color }}>{cfg?.label}</span>
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

      {/* Detail sheet */}
      {detailReg && (
        <RegistrationDetailSheet
          reg={detailReg}
          eventMap={eventMap}
          catMap={catMap}
          registrations={registrations}
          categories={categories}
          eventId={event.id}
          actorEmail={actorEmail}
          isFullAdmin={isFullAdmin}
          onClose={() => setDetailReg(null)}
          onUpdated={() => { setDetailReg(null); if (onRegsUpdated) onRegsUpdated(); }}
        />
      )}

      {/* Confirmation dialog */}
      <BulkConfirmDialog
        open={!!confirm}
        variant={confirm || 'approve'}
        count={selectedRows.length}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
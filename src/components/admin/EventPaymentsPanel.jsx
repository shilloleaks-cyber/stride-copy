import React, { useState, useMemo } from 'react';
import { Search, Download, CheckSquare, Square, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';
import SelectionBar from '@/components/admin/SelectionBar';
import BulkConfirmDialog from '@/components/admin/BulkConfirmDialog';
import BulkResultBanner from '@/components/admin/BulkResultBanner';
import { staffAction } from '@/lib/staffEventAction';

const LIME   = '#B6FF00';
const ACCENT = LIME;

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
};

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCSV(payments, regsById, catMap) {
  const headers = ['First Name','Last Name','Email','Bib','Category','Amount','Payment Status','Payment Method','Submitted'];
  const lines = [
    headers.join(','),
    ...payments.map(p => {
      const reg = regsById[p.registration_id] || {};
      return [
        reg.first_name || '', reg.last_name || '', reg.user_email || '',
        reg.bib_number || '',
        catMap[reg.category_id]?.name || '',
        p.amount || 0,
        p.status || '',
        p.payment_method || '',
        p.submitted_at ? format(new Date(p.submitted_at), 'yyyy-MM-dd HH:mm') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    })
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

// Generates next available bib number for a category
function generateBib(categoryId, catMap, registrations) {
  const cat = catMap[categoryId];
  const prefix = cat?.bib_prefix || 'R';
  const start = cat?.bib_start || 1;
  const usedBibs = new Set(
    registrations
      .filter(r => r.category_id === categoryId && r.bib_number)
      .map(r => r.bib_number)
  );
  let candidate = start;
  let bib;
  do {
    bib = `${prefix}${String(candidate).padStart(3, '0')}`;
    candidate++;
  } while (usedBibs.has(bib));
  return bib;
}

export default function EventPaymentsPanel({ event, registrations, payments, categories, onDone, canReview = true, actorEmail, isStaff = false }) {
  const queryClient = useQueryClient();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [catFilter, setCatFilter]       = useState('all');
  const [selected, setSelected]         = useState(new Set());
  const [confirm, setConfirm]           = useState(null); // 'approve' | 'needs_attention' | null
  const [result, setResult]             = useState(null);

  const catMap      = Object.fromEntries(categories.map(c => [c.id, c]));
  const slug        = makeSlug(event.title);
  const today       = format(new Date(), 'yyyy-MM-dd');
  const reviewUser  = { role: 'admin', email: actorEmail };

  // registrations and payments are already scoped to this event from EventWorkspace
  const eventRegs     = registrations;
  const regsById      = Object.fromEntries(eventRegs.map(r => [r.id, r]));
  const eventPayments = payments;

  const filtered = useMemo(() => eventPayments.filter(p => {
    const reg = regsById[p.registration_id];
    if (!reg) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
    if (catFilter !== 'all' && reg.category_id !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${reg.first_name} ${reg.last_name} ${reg.user_email} ${reg.bib_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [eventPayments, regsById, statusFilter, methodFilter, catFilter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  }), [filtered]);

  const pending         = eventPayments.filter(p => p.status === 'pending').length;
  const someSelected    = selected.size > 0;
  const allIds          = sorted.map(p => p.id);
  const allSelected     = allIds.length > 0 && allIds.every(id => selected.has(id));
  const selectedPayments = sorted.filter(p => selected.has(p.id));

  // Count actionable items in selection
  const approvable       = selectedPayments.filter(p => p.status !== 'approved').length;
  const needsAttentionable = selectedPayments.filter(p => p.status !== 'needs_attention').length;

  const clearSelection = () => setSelected(new Set());

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
      setSelected(prev => { const next = new Set(prev); allIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelected(prev => new Set([...prev, ...allIds]));
    }
  };

  // Bulk approve mutation — routes through staffEventAction for staff, direct SDK for admins
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      if (!canReview) throw new Error('Permission denied');
      const targets = selectedPayments.filter(p => p.status !== 'approved');
      const results = await Promise.allSettled(
        targets.map(async (p) => {
          if (isStaff) {
            await staffAction('approve_payment', { event_id: event.id, payment_id: p.id });
          } else {
            const reg = regsById[p.registration_id];
            const bib = reg?.bib_number || generateBib(reg?.category_id, catMap, registrations);
            const now = new Date().toISOString();
            await Promise.all([
              base44.entities.EventPayment.update(p.id, { status: 'approved', reviewed_by: actorEmail, reviewed_at: now, admin_note: null }),
              base44.entities.EventRegistration.update(p.registration_id, { status: 'confirmed', payment_status: 'paid', bib_number: reg?.bib_number || bib }),
            ]);
          }
        })
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed    = results.filter(r => r.status === 'rejected').length;
      const skipped   = selectedPayments.length - targets.length;
      return { succeeded, failed, skipped };
    },
    onSuccess: ({ succeeded, failed, skipped }) => {
      staffAction('log_activity', { event_id: event.id, action_type: 'payment_approved', target_type: 'payment', summary: `Bulk approved ${succeeded} payment(s)`, meta: { succeeded, failed, skipped } }).catch(() => {});
      clearSelection();
      setConfirm(null);
      if (onDone) onDone();
      const lines = [`${succeeded} payment${succeeded !== 1 ? 's' : ''} approved`];
      if (skipped > 0) lines.push(`${skipped} skipped (already approved)`);
      if (failed > 0)  lines.push(`${failed} failed — please retry`);
      setResult({ lines, isError: failed > 0 && succeeded === 0 });
    },
  });

  // Bulk needs-attention mutation — routes through staffEventAction for staff
  const bulkNeedsAttentionMutation = useMutation({
    mutationFn: async () => {
      if (!canReview) throw new Error('Permission denied');
      const targets = selectedPayments.filter(p => p.status !== 'needs_attention');
      const results = await Promise.allSettled(
        targets.map(async (p) => {
          if (isStaff) {
            await staffAction('needs_attention', { event_id: event.id, payment_id: p.id });
          } else {
            const now = new Date().toISOString();
            await Promise.all([
              base44.entities.EventPayment.update(p.id, { status: 'needs_attention', reviewed_by: actorEmail, reviewed_at: now }),
              base44.entities.EventRegistration.update(p.registration_id, { payment_status: 'needs_attention' }),
            ]);
          }
        })
      );
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed    = results.filter(r => r.status === 'rejected').length;
      const skipped   = selectedPayments.length - targets.length;
      return { succeeded, failed, skipped };
    },
    onSuccess: ({ succeeded, failed, skipped }) => {
      staffAction('log_activity', { event_id: event.id, action_type: 'payment_needs_attention', target_type: 'payment', summary: `Bulk marked ${succeeded} payment(s) as Needs Attention`, meta: { succeeded, failed, skipped } }).catch(() => {});
      clearSelection();
      setConfirm(null);
      if (onDone) onDone();
      const lines = [`${succeeded} payment${succeeded !== 1 ? 's' : ''} marked as Needs Attention`];
      if (skipped > 0) lines.push(`${skipped} skipped (already marked)`);
      if (failed > 0)  lines.push(`${failed} failed — please retry`);
      setResult({ lines, isError: failed > 0 && succeeded === 0 });
    },
  });

  const isLoading = bulkApproveMutation.isPending || bulkNeedsAttentionMutation.isPending;

  const handleConfirm = () => {
    if (confirm === 'approve')          bulkApproveMutation.mutate();
    if (confirm === 'needs_attention')  bulkNeedsAttentionMutation.mutate();
  };

  const exportFiltered = () => downloadCSV(buildCSV(sorted, regsById, catMap),            `${slug}-payments-${today}.csv`);
  const exportSelected = () => downloadCSV(buildCSV(selectedPayments, regsById, catMap),  `${slug}-payments-selected-${today}.csv`);

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(182,255,0,0.4)' }} />
        <input
          value={search} onChange={e => { setSearch(e.target.value); clearSelection(); }}
          placeholder="Search name, email, bib..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filters row 1 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="needs_attention">Needs Attention</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Methods</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="qr_scan">QR Scan</option>
        </select>
      </div>

      {/* Filters row 2 */}
      <div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Result banner */}
      <BulkResultBanner result={result} onClose={() => setResult(null)} />

      {/* Selection bar OR default toolbar */}
      {someSelected ? (
        <SelectionBar
          count={selected.size}
          onClear={clearSelection}
          onExport={canReview ? exportSelected : null}
          actions={canReview ? [
            ...(approvable > 0 ? [{
              label: `Approve ${approvable}`,
              icon: CheckCircle2,
              onClick: () => setConfirm('approve'),
              color: '#00e676',
            }] : []),
            ...(needsAttentionable > 0 ? [{
              label: `Needs Attention ${needsAttentionable}`,
              icon: AlertTriangle,
              onClick: () => setConfirm('needs_attention'),
              color: 'rgba(255,150,50,1)',
            }] : []),
          ] : []}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(182,255,0,0.6)', fontSize: 11, fontWeight: 700, padding: 0 }}>
            {allSelected ? <CheckSquare style={{ width: 14, height: 14, color: LIME }} /> : <Square style={{ width: 14, height: 14 }} />}
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span style={{ fontSize: 11, color: 'rgba(182,255,0,0.45)', fontWeight: 600 }}>
            {pending > 0 ? `${pending} pending · ` : ''}{sorted.length} shown
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={exportFiltered}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(182,255,0,0.08)', border: '1px solid rgba(182,255,0,0.22)', color: LIME,
              }}
            >
              <Download style={{ width: 12, height: 12 }} /> Export
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>💳</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.35)' }}>
            {eventPayments.length === 0 ? 'No payments yet' : 'No payments match your filters'}
          </p>
          {eventPayments.length > 0 && <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search or filters</p>}
        </div>
      )}

      {/* Payment rows */}
      {sorted.map(payment => {
        const reg   = regsById[payment.registration_id];
        const isSel = selected.has(payment.id);
        if (!reg) return null;
        return (
          <div key={payment.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {/* Checkbox */}
            <button
              onClick={(e) => toggleSelect(payment.id, e)}
              style={{
                flexShrink: 0, width: 36, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel ? 'rgba(182,255,0,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSel ? 'rgba(182,255,0,0.28)' : 'rgba(255,255,255,0.08)'}`,
                borderRight: 'none', borderRadius: '12px 0 0 12px', cursor: 'pointer',
              }}
            >
              {isSel
                ? <CheckSquare style={{ width: 14, height: 14, color: LIME }} />
                : <Square style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} />
              }
            </button>
            {/* Review card */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <PaymentReviewPanel
                payment={payment}
                reg={reg}
                catMap={catMap}
                registrations={registrations}
                user={reviewUser}
                onDone={onDone}
                canReview={canReview}
                eventId={event.id}
                eventTitle={event.title}
                isStaff={isStaff}
              />
            </div>
          </div>
        );
      })}

      {/* Bulk confirm dialog */}
      <BulkConfirmDialog
        open={!!confirm}
        variant={confirm === 'approve' ? 'approve' : 'reject'}
        count={confirm === 'approve' ? approvable : needsAttentionable}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
        isLoading={isLoading}
        customLabel={confirm === 'needs_attention' ? 'Mark Needs Attention' : undefined}
        customMessage={confirm === 'needs_attention'
          ? `Mark ${needsAttentionable} payment(s) as Needs Attention? Participants will need to re-upload their slip.`
          : undefined
        }
      />
    </div>
  );
}
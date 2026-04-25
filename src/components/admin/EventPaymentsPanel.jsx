import React, { useState, useMemo } from 'react';
import { Search, Download, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';

const ACCENT = '#00e676';

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
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

export default function EventPaymentsPanel({ event, registrations, payments, categories, onDone }) {
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [methodFilter, setMethodFilter]   = useState('all');
  const [catFilter, setCatFilter]         = useState('all');
  const [selected, setSelected]           = useState(new Set());

  const catMap  = Object.fromEntries(categories.map(c => [c.id, c]));
  const user    = { role: 'admin' };
  const slug    = makeSlug(event.title);
  const today   = format(new Date(), 'yyyy-MM-dd');

  const eventRegs     = registrations.filter(r => r.event_id === event.id);
  const regsById      = Object.fromEntries(eventRegs.map(r => [r.id, r]));
  const regIds        = new Set(eventRegs.map(r => r.id));
  const eventPayments = payments.filter(p => regIds.has(p.registration_id));

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

  const pending     = eventPayments.filter(p => p.status === 'pending').length;
  const someSelected = selected.size > 0;
  const allIds      = sorted.map(p => p.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

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

  const selectedPayments = sorted.filter(p => selected.has(p.id));

  const exportFiltered = () => downloadCSV(buildCSV(sorted, regsById, catMap),           `${slug}-payments-${today}.csv`);
  const exportSelected = () => downloadCSV(buildCSV(selectedPayments, regsById, catMap), `${slug}-payments-selected-${today}.csv`);

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(0,230,118,0.4)' }} />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setSelected(new Set()); }}
          placeholder="Search name, email, bib..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
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

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,230,118,0.6)', fontSize: 11, fontWeight: 700, padding: 0 }}>
          {allSelected ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} /> : <Square style={{ width: 14, height: 14 }} />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        <span style={{ fontSize: 11, color: 'rgba(0,230,118,0.5)', fontWeight: 600 }}>
          {pending > 0 ? `${pending} pending · ` : ''}{sorted.length} shown{someSelected ? ` · ${selected.size} selected` : ''}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {someSelected && (
            <button onClick={exportSelected}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(138,43,226,0.12)', border: '1px solid rgba(138,43,226,0.3)', color: 'rgba(190,140,255,1)',
              }}
            >
              <Download style={{ width: 12, height: 12 }} /> Export selected
            </button>
          )}
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
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>💳</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.35)' }}>
            {eventPayments.length === 0 ? 'No payments yet' : 'No payments match your filters'}
          </p>
          {eventPayments.length > 0 && <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search or filters</p>}
        </div>
      )}

      {/* Payment rows with selection checkbox */}
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
                background: isSel ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSel ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRight: 'none', borderRadius: '12px 0 0 12px', cursor: 'pointer',
              }}
            >
              {isSel
                ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} />
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
                user={user}
                onDone={onDone}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
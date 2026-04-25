import React, { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';

const ACCENT = '#00e676';

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
};

function exportCSV(payments, regsById, catMap, eventTitle) {
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
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `payments-${eventTitle.replace(/\s+/g, '_')}.csv`;
  a.click();
}

export default function EventPaymentsPanel({ event, registrations, payments, categories, onDone }) {
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [methodFilter, setMethodFilter]   = useState('all');
  const [catFilter, setCatFilter]         = useState('all');

  const catMap    = Object.fromEntries(categories.map(c => [c.id, c]));
  const user      = { role: 'admin' };

  const eventRegs  = registrations.filter(r => r.event_id === event.id);
  const regsById   = Object.fromEntries(eventRegs.map(r => [r.id, r]));
  const regIds     = new Set(eventRegs.map(r => r.id));
  const eventPayments = payments.filter(p => regIds.has(p.registration_id));

  const filtered = eventPayments.filter(p => {
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
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  const pending = eventPayments.filter(p => p.status === 'pending').length;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(0,230,118,0.4)' }} />
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

      {/* Filters row 1: status + method */}
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

      {/* Filters row 2: category */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Count + Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, color: 'rgba(0,230,118,0.5)', fontWeight: 600, margin: 0 }}>
          {pending > 0 ? `${pending} pending · ` : ''}{sorted.length} shown / {eventPayments.length} total
        </p>
        <button
          onClick={() => exportCSV(sorted, regsById, catMap, event.title)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: ACCENT,
          }}
        >
          <Download style={{ width: 12, height: 12 }} /> Export CSV
        </button>
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 10px' }}>💳</p>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No payments found</p>
        </div>
      )}

      {sorted.map(payment => {
        const reg = regsById[payment.registration_id];
        if (!reg) return null;
        return (
          <PaymentReviewPanel
            key={payment.id}
            payment={payment}
            reg={reg}
            catMap={catMap}
            registrations={registrations}
            user={user}
            onDone={onDone}
          />
        );
      })}
    </div>
  );
}
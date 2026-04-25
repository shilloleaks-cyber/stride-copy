import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Search, CheckCircle2, Download } from 'lucide-react';
import { format } from 'date-fns';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER  = 'rgba(0,200,80,0.12)';

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
};

function exportCSV(rows, catMap, eventTitle) {
  const headers = ['First Name','Last Name','Email','Bib','Category','Checked In','Checked In At'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.first_name, r.last_name, r.user_email,
      r.bib_number || '',
      catMap[r.category_id]?.name || '',
      r.checked_in ? 'Yes' : 'No',
      r.checked_in_at ? format(new Date(r.checked_in_at), 'yyyy-MM-dd HH:mm') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `checkin-${eventTitle.replace(/\s+/g, '_')}.csv`;
  a.click();
}

export default function EventCheckinPanel({ event, registrations, categories }) {
  const navigate = useNavigate();
  const [search, setSearch]               = useState('');
  const [catFilter, setCatFilter]         = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const eventRegs = registrations.filter(r => r.event_id === event.id && r.status === 'confirmed');
  const checkedInCount = eventRegs.filter(r => r.checked_in).length;
  const total = eventRegs.length;

  const filtered = eventRegs.filter(r => {
    if (catFilter !== 'all' && r.category_id !== catFilter) return false;
    if (checkinFilter === 'checked_in' && !r.checked_in) return false;
    if (checkinFilter === 'not_checked_in' && r.checked_in) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${r.first_name} ${r.last_name} ${r.user_email} ${r.bib_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Progress card */}
      <div style={{ padding: '20px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 52, fontWeight: 900, color: ACCENT, margin: 0, lineHeight: 1 }}>{checkedInCount}</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '6px 0 16px', fontWeight: 600 }}>of {total} confirmed checked in</p>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: ACCENT, width: total > 0 ? `${(checkedInCount / total) * 100}%` : '0%', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* QR Scanner CTA */}
      <button
        onClick={() => navigate(`/StrideCheckin?event_id=${event.id}`)}
        style={{
          width: '100%', padding: '16px 0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: ACCENT, color: '#050f08', fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer',
          boxShadow: '0 0 28px rgba(0,230,118,0.25)',
        }}
      >
        <ScanLine style={{ width: 20, height: 20 }} /> Open QR Scanner
      </button>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(0,230,118,0.4)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search bib, name, email..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filters: category + check-in status */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={checkinFilter} onChange={e => setCheckinFilter(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
          <option value="all">All</option>
          <option value="checked_in">Checked In</option>
          <option value="not_checked_in">Not Checked In</option>
        </select>
      </div>

      {/* Count + Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
          {filtered.length} participants
        </p>
        <button
          onClick={() => exportCSV(filtered, catMap, event.title)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: ACCENT,
          }}
        >
          <Download style={{ width: 12, height: 12 }} /> Export CSV
        </button>
      </div>

      {/* Participant list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No participants found</p>
        )}
        {filtered.map(reg => {
          const cat = catMap[reg.category_id];
          return (
            <div key={reg.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: CARD_BG, border: `1px solid ${reg.checked_in ? 'rgba(0,230,118,0.25)' : BORDER}`, borderRadius: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: reg.checked_in ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {reg.checked_in
                  ? <CheckCircle2 style={{ width: 16, height: 16, color: ACCENT }} />
                  : <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{reg.bib_number?.slice(-3) || '?'}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reg.first_name} {reg.last_name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '1px 0 0' }}>{cat?.name || '—'} · {reg.bib_number || 'No bib'}</p>
              </div>
              {reg.checked_in && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, display: 'block' }}>✓ In</span>
                  {reg.checked_in_at && (
                    <span style={{ fontSize: 9, color: 'rgba(0,230,118,0.5)' }}>{format(new Date(reg.checked_in_at), 'HH:mm')}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
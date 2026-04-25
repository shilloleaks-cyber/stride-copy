import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Search, CheckCircle2, Download, CheckSquare, Square, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER  = 'rgba(0,200,80,0.12)';

const selectStyle = {
  padding: '8px 10px', borderRadius: 10,
  background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
  color: 'rgba(255,255,255,0.7)', fontSize: 12, outline: 'none',
};

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCSV(rows, catMap) {
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
  return lines.join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function EventCheckinPanel({ event, registrations, categories, onRegsUpdated }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch]               = useState('');
  const [catFilter, setCatFilter]         = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');
  const [selected, setSelected]           = useState(new Set());

  const catMap  = Object.fromEntries(categories.map(c => [c.id, c]));
  const slug    = makeSlug(event.title);
  const today   = format(new Date(), 'yyyy-MM-dd');

  const eventRegs      = registrations.filter(r => r.event_id === event.id && r.status === 'confirmed');
  const checkedInCount = eventRegs.filter(r => r.checked_in).length;
  const total          = eventRegs.length;

  const filtered = useMemo(() => eventRegs.filter(r => {
    if (catFilter !== 'all' && r.category_id !== catFilter) return false;
    if (checkinFilter === 'checked_in' && !r.checked_in) return false;
    if (checkinFilter === 'not_checked_in' && r.checked_in) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${r.first_name} ${r.last_name} ${r.user_email} ${r.bib_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [eventRegs, catFilter, checkinFilter, search]);

  // Selection helpers
  const allIds      = filtered.map(r => r.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
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
      setSelected(prev => { const next = new Set(prev); allIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelected(prev => new Set([...prev, ...allIds]));
    }
  };

  const selectedRows = filtered.filter(r => selected.has(r.id));

  // Bulk check-in mutation (only uncheck-in ones that aren't yet checked in)
  const bulkCheckinMutation = useMutation({
    mutationFn: async () => {
      const targets = selectedRows.filter(r => !r.checked_in);
      const now = new Date().toISOString();
      await Promise.all(targets.map(r =>
        base44.entities.EventRegistration.update(r.id, {
          checked_in: true,
          checked_in_at: now,
        })
      ));
    },
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      if (onRegsUpdated) onRegsUpdated();
    },
  });

  const notCheckedInSelected = selectedRows.filter(r => !r.checked_in).length;

  const exportFiltered = () => downloadCSV(buildCSV(filtered, catMap),     `${slug}-checkin-${today}.csv`);
  const exportSelected = () => downloadCSV(buildCSV(selectedRows, catMap), `${slug}-checkin-selected-${today}.csv`);

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
          value={search} onChange={e => { setSearch(e.target.value); setSelected(new Set()); }}
          placeholder="Search bib, name, email..."
          style={{
            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
            borderRadius: 12, background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)',
            color: '#fff', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Filters */}
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

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,230,118,0.6)', fontSize: 11, fontWeight: 700, padding: 0 }}>
          {allSelected ? <CheckSquare style={{ width: 14, height: 14, color: ACCENT }} /> : <Square style={{ width: 14, height: 14 }} />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {filtered.length} participants{someSelected ? ` · ${selected.size} selected` : ''}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {someSelected && notCheckedInSelected > 0 && (
            <button
              onClick={() => bulkCheckinMutation.mutate()}
              disabled={bulkCheckinMutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: ACCENT,
              }}
            >
              {bulkCheckinMutation.isPending
                ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
                : <CheckCircle2 style={{ width: 11, height: 11 }} />
              }
              Check in {notCheckedInSelected}
            </button>
          )}
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
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 8px' }}>👟</p>
          <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: 'rgba(255,255,255,0.35)' }}>
            {total === 0 ? 'No confirmed registrations yet' : 'No participants match your filters'}
          </p>
          {total > 0 && <p style={{ fontSize: 12, margin: 0 }}>Try adjusting your search or filters</p>}
        </div>
      )}

      {/* Participant list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(reg => {
          const cat   = catMap[reg.category_id];
          const isSel = selected.has(reg.id);
          return (
            <div key={reg.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {/* Checkbox */}
              <button
                onClick={(e) => toggleSelect(reg.id, e)}
                style={{
                  flexShrink: 0, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSel ? 'rgba(0,230,118,0.08)' : 'transparent',
                  border: `1px solid ${isSel ? 'rgba(0,230,118,0.3)' : BORDER}`,
                  borderRight: 'none', borderRadius: '10px 0 0 10px', cursor: 'pointer',
                }}
              >
                {isSel
                  ? <CheckSquare style={{ width: 13, height: 13, color: ACCENT }} />
                  : <Square style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.2)' }} />
                }
              </button>
              {/* Row card */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                background: isSel ? 'rgba(0,230,118,0.04)' : CARD_BG,
                border: `1px solid ${reg.checked_in ? 'rgba(0,230,118,0.25)' : isSel ? 'rgba(0,230,118,0.25)' : BORDER}`,
                borderRadius: '0 10px 10px 0',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: reg.checked_in ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {reg.checked_in
                    ? <CheckCircle2 style={{ width: 15, height: 15, color: ACCENT }} />
                    : <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{reg.bib_number?.slice(-3) || '?'}</span>
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
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
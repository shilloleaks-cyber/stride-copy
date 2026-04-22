import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Search, CheckCircle2 } from 'lucide-react';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

export default function EventCheckinPanel({ event, registrations, categories }) {
  const navigate = useNavigate();
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const eventRegs = registrations.filter(r => r.event_id === event.id && r.status === 'confirmed');
  const checkedIn = eventRegs.filter(r => r.checked_in).length;
  const total = eventRegs.length;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress card */}
      <div style={{ padding: '20px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 18, textAlign: 'center' }}>
        <p style={{ fontSize: 52, fontWeight: 900, color: ACCENT, margin: 0, lineHeight: 1 }}>{checkedIn}</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '6px 0 16px', fontWeight: 600 }}>of {total} confirmed checked in</p>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: ACCENT, width: total > 0 ? `${(checkedIn / total) * 100}%` : '0%', transition: 'width 0.5s' }} />
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

      {/* Participant lookup */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Confirmed Participants</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
          {eventRegs.length === 0 && (
            <p style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No confirmed registrations yet</p>
          )}
          {eventRegs.map(reg => {
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
                {reg.checked_in && <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>✓ In</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
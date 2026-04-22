import React from 'react';
import { useNavigate } from 'react-router-dom';
import { checkPaymentReady } from '@/components/stride/EventPaymentSetup';
import { Tag, Plus } from 'lucide-react';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

export default function EventCategoriesPanel({ event, categories }) {
  const navigate = useNavigate();
  const eventCats = categories.filter(c => c.event_id === event.id && c.is_active !== false);
  const { ready: paymentReady } = checkPaymentReady(event);
  const hasPaidCats = eventCats.some(c => c.price > 0);

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Payment status banner */}
      {hasPaidCats && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: paymentReady ? 'rgba(0,230,118,0.07)' : 'rgba(255,120,0,0.07)',
          border: `1px solid ${paymentReady ? 'rgba(0,230,118,0.2)' : 'rgba(255,120,0,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: paymentReady ? ACCENT : 'rgba(255,150,50,1)', margin: 0 }}>
              💳 Payment: {paymentReady ? 'Configured' : 'Incomplete'}
            </p>
            {!paymentReady && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>Configure in Event Setup</p>
            )}
          </div>
          {!paymentReady && (
            <button
              onClick={() => navigate(`/ManageCategories?event_id=${event.id}`)}
              style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,150,50,0.15)', border: '1px solid rgba(255,150,50,0.3)', color: 'rgba(255,150,50,1)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Fix →
            </button>
          )}
        </div>
      )}

      {/* Category cards */}
      {eventCats.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(0,230,118,0.15)', borderRadius: 16 }}>
          <Tag style={{ width: 28, height: 28, margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No categories yet</p>
        </div>
      )}

      {eventCats.map(cat => {
        const hasLimit = cat.max_slots > 0;
        const reg = cat.registered_count || 0;
        const full = hasLimit && reg >= cat.max_slots;
        const pct = hasLimit ? Math.min(1, reg / cat.max_slots) : 0;

        return (
          <div key={cat.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px', position: 'relative', overflow: 'hidden' }}>
            {cat.color && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '16px 0 0 16px', background: cat.color }} />
            )}
            <div style={{ paddingLeft: cat.color ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
                  {cat.distance_km && <p style={{ fontSize: 11, color: 'rgba(0,230,118,0.6)', margin: '2px 0 0', fontWeight: 600 }}>{cat.distance_km} km</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: cat.price > 0 ? 'rgba(255,200,80,1)' : ACCENT, margin: 0 }}>
                    {cat.price > 0 ? `฿${cat.price}` : 'Free'}
                  </p>
                </div>
              </div>

              {/* Registration count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasLimit ? 8 : 0 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  {reg} registered{hasLimit ? ` / ${cat.max_slots}` : ''}
                </span>
                {full && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,80,80,0.12)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.2)' }}>FULL</span>}
              </div>

              {/* Progress bar */}
              {hasLimit && (
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width 0.5s',
                    width: `${pct * 100}%`,
                    background: full ? 'rgba(255,80,80,0.8)' : pct > 0.8 ? 'rgba(255,180,0,0.8)' : ACCENT,
                  }} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Manage button */}
      <button
        onClick={() => navigate(`/ManageCategories?event_id=${event.id}`)}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: ACCENT, color: '#050f08', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer',
        }}
      >
        <Plus style={{ width: 15, height: 15 }} /> Manage Categories
      </button>
    </div>
  );
}
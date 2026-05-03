import React, { useState, useEffect } from 'react';

/** Re-exported from EventPaymentSetup for backward compat */
export { checkPaymentReady } from '@/components/stride/EventPaymentSetup';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, AlertTriangle, DollarSign, Edit3 } from 'lucide-react';

const LIME   = '#B6FF00';
const ACCENT = LIME;

const inp = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, color: 'white',
  padding: '11px 14px', width: '100%',
  outline: 'none', fontSize: 14,
  boxSizing: 'border-box',
};
const lbl = {
  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  display: 'block', marginBottom: 6,
};

const PAYMENT_MODES = [
  {
    key: 'fixed_price',
    label: 'Fixed Price',
    desc: 'Users pay the exact amount you set.',
    icon: '💳',
    color: LIME,
    bg: 'rgba(191,255,0,0.07)',
    border: 'rgba(191,255,0,0.3)',
  },
  {
    key: 'user_entered_amount',
    label: 'User Enters Amount',
    desc: 'Price is ฿0. Users type the amount they paid and upload their slip.',
    icon: '✏️',
    color: 'rgba(190,140,255,1)',
    bg: 'rgba(138,43,226,0.1)',
    border: 'rgba(138,43,226,0.35)',
  },
];

export default function CategoryPaymentSetup({ category, onSaved }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    payment_enabled: category.payment_enabled || false,
    payment_mode: category.payment_mode || (
      category.payment_enabled && Number(category.price || 0) === 0 ? 'user_entered_amount' : 'fixed_price'
    ),
    price: category.price != null ? String(category.price) : '0',
  });

  useEffect(() => {
    setForm({
      payment_enabled: category.payment_enabled || false,
      payment_mode: category.payment_mode || (
        category.payment_enabled && Number(category.price || 0) === 0 ? 'user_entered_amount' : 'fixed_price'
      ),
      price: category.price != null ? String(category.price) : '0',
    });
  }, [category.id]);

  const set = (field, val) => { setSaved(false); setForm(prev => ({ ...prev, [field]: val })); };

  const handleModeChange = (mode) => {
    setSaved(false);
    setForm(prev => ({
      ...prev,
      payment_mode: mode,
      payment_enabled: true,
      price: mode === 'user_entered_amount' ? '0' : prev.price,
    }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const price = form.payment_mode === 'user_entered_amount' ? 0 : (parseFloat(form.price) || 0);
      return base44.entities.EventCategory.update(category.id, {
        payment_enabled: form.payment_enabled,
        payment_mode: form.payment_mode,
        price,
      });
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
      queryClient.invalidateQueries({ queryKey: ['event-categories', category.event_id] });
      if (onSaved) onSaved();
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Payment toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Payment Required</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
            {form.payment_enabled ? 'Payment slip required for this category' : 'Free — no payment needed'}
          </p>
        </div>
        <button
          onClick={() => set('payment_enabled', !form.payment_enabled)}
          style={{
            width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: form.payment_enabled ? LIME : 'rgba(255,255,255,0.12)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: form.payment_enabled ? '#080808' : 'rgba(255,255,255,0.6)',
            left: form.payment_enabled ? 21 : 3, transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Mode selector */}
      {form.payment_enabled && (
        <>
          <div>
            <p style={lbl}>Payment Mode</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_MODES.map(m => {
                const active = form.payment_mode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => handleModeChange(m.key)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '13px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      background: active ? m.bg : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${active ? m.border : 'rgba(255,255,255,0.09)'}`,
                      boxShadow: active ? `0 0 16px ${m.bg}` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20, marginTop: 1, flexShrink: 0 }}>{m.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: active ? m.color : 'rgba(255,255,255,0.7)', margin: 0 }}>{m.label}</p>
                        {active && (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: m.bg, color: m.color, border: `1px solid ${m.border}`, letterSpacing: '0.06em' }}>SELECTED</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price input (fixed_price only) */}
          {form.payment_mode === 'fixed_price' && (
            <div>
              <label style={lbl}>Price (THB)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(191,255,0,0.6)', fontWeight: 800 }}>฿</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0"
                  style={{ ...inp, paddingLeft: 32 }}
                />
              </div>
            </div>
          )}

          {/* User-entered-amount info */}
          {form.payment_mode === 'user_entered_amount' && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.3)', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Edit3 style={{ width: 13, height: 13, color: 'rgba(190,140,255,0.8)', flexShrink: 0 }} />
                <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(190,140,255,0.9)', margin: 0 }}>Amount entered by participant</p>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
                Category price is set to ฿0. Participants will enter the exact amount they paid when uploading their payment slip. Admin reviews and approves each slip with the submitted amount.
              </p>
            </div>
          )}
        </>
      )}

      {/* Save */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none',
          ...(saved
            ? { background: 'rgba(0,210,110,0.12)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.3)' }
            : { background: 'rgba(191,255,0,0.1)', color: LIME, border: `1px solid rgba(191,255,0,0.3)` }
          ),
        }}
      >
        {saveMutation.isPending
          ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Saving…</>
          : saved
            ? <><CheckCircle2 style={{ width: 14, height: 14 }} /> Saved</>
            : 'Save Payment Settings'
        }
      </button>
    </div>
  );
}
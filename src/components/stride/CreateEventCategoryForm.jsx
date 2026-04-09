import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Building2, QrCode, ImagePlus, X, CreditCard } from 'lucide-react';
import { checkPaymentReady } from '@/components/stride/EventPaymentSetup';

export default function CreateEventCategoryForm({ eventId, eventData, existingCategories, initial, editingId, onSaved, onCancel }) {
  const isEdit = !!editingId;
  const [form, setForm] = useState(initial || {
    name: '', distance_km: '', price: '', max_slots: '',
    bib_prefix: '', bib_start: '1', color: '#BFFF00',
  });
  const [saving, setSaving] = useState(false);

  // Payment state — pre-fill from eventData
  const [payment, setPayment] = useState({
    payment_methods_enabled: ['bank_transfer'],
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_note: '',
    payment_qr_image: '',
  });
  const [qrPreview, setQrPreview] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Sync payment fields when eventData loads or when switching between edited categories
  useEffect(() => {
    if (!eventData) return;
    setPayment({
      payment_methods_enabled: eventData.payment_methods_enabled?.length > 0 ? eventData.payment_methods_enabled : ['bank_transfer'],
      bank_name: eventData.bank_name || '',
      account_name: eventData.account_name || '',
      account_number: eventData.account_number || '',
      payment_note: eventData.payment_note || '',
      payment_qr_image: eventData.payment_qr_image || '',
    });
    setQrPreview(eventData.payment_qr_image || null);
  }, [eventData?.id, editingId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setP = (k, v) => setPayment(p => ({ ...p, [k]: v }));

  const isPaid = parseFloat(form.price) > 0;

  const togglePaymentMethod = (key) => {
    setPayment(prev => {
      const enabled = prev.payment_methods_enabled;
      if (enabled.includes(key)) {
        if (enabled.length === 1) return prev;
        return { ...prev, payment_methods_enabled: enabled.filter(k => k !== key) };
      }
      return { ...prev, payment_methods_enabled: [...enabled, key] };
    });
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingQr(true);
    setQrPreview(URL.createObjectURL(file));
    const result = await base44.integrations.Core.UploadFile({ file });
    setP('payment_qr_image', result.file_url);
    setUploadingQr(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const isDup = existingCategories.some(
      c => c.name.trim().toLowerCase() === form.name.trim().toLowerCase() && c.id !== editingId
    );
    if (isDup) { alert('A category with this name already exists.'); return; }
    setSaving(true);
    const price = form.price !== '' ? parseFloat(form.price) : 0;
    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
      price,
      max_slots: form.max_slots !== '' ? parseInt(form.max_slots) : 0,
      bib_prefix: form.bib_prefix.trim() || null,
      bib_start: parseInt(form.bib_start) || 1,
      color: form.color,
      is_active: true,
    };
    if (isEdit) {
      await base44.entities.EventCategory.update(editingId, payload);
    } else {
      await base44.entities.EventCategory.create(payload);
    }
    // If paid, save payment settings to the event
    if (price > 0) {
      await base44.entities.StrideEvent.update(eventId, {
        payment_methods_enabled: payment.payment_methods_enabled,
        bank_name: payment.bank_name || null,
        account_name: payment.account_name || null,
        account_number: payment.account_number || null,
        payment_note: payment.payment_note || null,
        payment_qr_image: payment.payment_qr_image || null,
      });
    }
    setSaving(false);
    onSaved();
  };

  const inp = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10, color: 'white', padding: '10px 12px',
    width: '100%', outline: 'none', fontSize: 13, boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 5,
  };

  const bankEnabled = payment.payment_methods_enabled.includes('bank_transfer');
  const qrEnabled = payment.payment_methods_enabled.includes('qr_scan');

  return (
    <div style={{
      background: isEdit ? 'rgba(138,43,226,0.05)' : 'rgba(191,255,0,0.04)',
      border: `1px solid ${isEdit ? 'rgba(138,43,226,0.25)' : 'rgba(191,255,0,0.18)'}`,
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 11,
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 12, fontWeight: 800, color: isEdit ? '#c084fc' : '#BFFF00', margin: 0 }}>
        {isEdit ? '✏️ Edit Category' : '＋ New Category'}
      </p>

      <div>
        <label style={lbl}>Category Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 10K, Half Marathon" style={inp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Distance (km)</label>
          <input type="number" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} placeholder="e.g. 10" min="0" style={inp} />
        </div>
        <div>
          <label style={lbl}>Price (THB)</label>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 = free" min="0" style={inp} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Max Slots</label>
          <input type="number" value={form.max_slots} onChange={e => set('max_slots', e.target.value)} placeholder="0 = unlimited" min="0" style={inp} />
        </div>
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 40, height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{form.color}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Bib Prefix</label>
          <input value={form.bib_prefix} onChange={e => set('bib_prefix', e.target.value)} placeholder="e.g. A, VIP" maxLength={5} style={inp} />
        </div>
        <div>
          <label style={lbl}>Bib Start #</label>
          <input type="number" value={form.bib_start} onChange={e => set('bib_start', e.target.value)} min="1" style={inp} />
        </div>
      </div>

      {/* ── Payment Setup — shown only when price > 0 ── */}
      {isPaid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(191,255,0,0.03)', border: '1px solid rgba(191,255,0,0.14)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CreditCard style={{ width: 13, height: 13, color: 'rgba(191,255,0,0.6)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(191,255,0,0.8)', margin: 0 }}>Payment Setup</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0' }}>Applies to all paid categories in this event</p>
            </div>
            {(() => {
              const { ready } = checkPaymentReady({ payment_methods_enabled: payment.payment_methods_enabled, bank_name: payment.bank_name, account_name: payment.account_name, account_number: payment.account_number, payment_qr_image: payment.payment_qr_image });
              return (
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, flexShrink: 0, ...(ready ? { background: 'rgba(0,210,110,0.1)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.2)' } : { background: 'rgba(255,120,0,0.1)', color: 'rgba(255,150,50,1)', border: '1px solid rgba(255,120,0,0.25)' }) }}>
                  {ready ? '✓ Ready' : '⚠ Required'}
                </span>
              );
            })()}
          </div>

          {/* Method toggles */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ key: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 }, { key: 'qr_scan', label: 'QR Scan', Icon: QrCode }].map(({ key, label, Icon }) => {
              const active = payment.payment_methods_enabled.includes(key);
              return (
                <button key={key} type="button" onClick={() => togglePaymentMethod(key)}
                  style={{ flex: 1, padding: '8px 6px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 700, ...(active ? { background: 'rgba(191,255,0,0.08)', border: '1.5px solid rgba(191,255,0,0.3)', color: '#BFFF00' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }) }}>
                  <Icon style={{ width: 12, height: 12 }} /> {label}
                </button>
              );
            })}
          </div>

          {/* Bank Transfer fields */}
          {bankEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={lbl}>Bank Name</label>
                <input type="text" value={payment.bank_name} onChange={e => setP('bank_name', e.target.value)} placeholder="e.g. Kasikorn Bank (KBank)" style={inp} />
              </div>
              <div>
                <label style={lbl}>Account Name</label>
                <input type="text" value={payment.account_name} onChange={e => setP('account_name', e.target.value)} placeholder="e.g. BoomX Running Co., Ltd." style={inp} />
              </div>
              <div>
                <label style={lbl}>Account Number</label>
                <input type="text" value={payment.account_number} onChange={e => setP('account_number', e.target.value)} placeholder="e.g. 000-0-00000-0" style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.07em' }} />
              </div>
            </div>
          )}

          {/* QR Scan */}
          {qrEnabled && (
            <div>
              <label style={lbl}>QR Payment Image</label>
              {qrPreview ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: 'white', padding: 8, display: 'inline-block' }}>
                    <img src={qrPreview} alt="QR" style={{ width: 110, height: 110, objectFit: 'contain', display: 'block' }} />
                    {uploadingQr && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)' }}>
                        <Loader2 style={{ width: 16, height: 16, color: '#0A0A0A', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  {!uploadingQr && (
                    <button type="button" onClick={() => { setQrPreview(null); setP('payment_qr_image', ''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,100,100,1)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      <X style={{ width: 10, height: 10 }} /> Remove
                    </button>
                  )}
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, cursor: 'pointer', height: 64, background: 'rgba(191,255,0,0.02)', border: '1px dashed rgba(191,255,0,0.15)' }}>
                  <ImagePlus style={{ width: 15, height: 15, color: 'rgba(191,255,0,0.3)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Upload QR image</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQrUpload} />
                </label>
              )}
            </div>
          )}

          {/* Payment Note */}
          <div>
            <label style={lbl}>Payment Note (optional)</label>
            <textarea value={payment.payment_note} onChange={e => setP('payment_note', e.target.value)}
              placeholder="e.g. Include your full name as reference" rows={2}
              style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: isEdit ? 'rgba(138,43,226,0.12)' : 'rgba(191,255,0,0.1)',
            border: isEdit ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(191,255,0,0.3)',
            color: isEdit ? '#c084fc' : '#BFFF00',
          }}>
          {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}
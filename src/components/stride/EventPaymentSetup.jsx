import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Building2, QrCode, ImagePlus, X, CheckCircle2, AlertTriangle } from 'lucide-react';

/** Returns { ready, issues } for a given event object (or form state) */
export function checkPaymentReady(ev) {
  if (!ev) return { ready: false, issues: ['No event data'] };
  const methods = ev.payment_methods_enabled || [];
  if (methods.length === 0) return { ready: false, issues: ['No payment method enabled'] };
  const issues = [];
  if (methods.includes('bank_transfer')) {
    if (!ev.bank_name)      issues.push('Bank name is missing');
    if (!ev.account_name)   issues.push('Account name is missing');
    if (!ev.account_number) issues.push('Account number is missing');
  }
  if (methods.includes('qr_scan')) {
    if (!ev.payment_qr_image) issues.push('QR code image is missing');
  }
  return { ready: issues.length === 0, issues };
}

const METHODS = [
  { key: 'bank_transfer', label: 'Bank Transfer', Icon: Building2, desc: 'Participants transfer to your bank account' },
  { key: 'qr_scan',       label: 'QR Scan',       Icon: QrCode,     desc: 'Participants scan your PromptPay / QR code' },
];

export default function EventPaymentSetup({ eventId }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['event-payment-config', eventId],
    queryFn: () => base44.entities.StrideEvent.filter({ id: eventId }),
    enabled: !!eventId,
  });
  const event = events[0] || null;

  const [form, setForm] = useState({
    payment_methods_enabled: ['bank_transfer'],
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_note: '',
    payment_qr_image: '',
  });

  // Sync form with loaded event
  useEffect(() => {
    if (!event) return;
    setForm({
      payment_methods_enabled: event.payment_methods_enabled?.length > 0 ? event.payment_methods_enabled : ['bank_transfer'],
      bank_name: event.bank_name || '',
      account_name: event.account_name || '',
      account_number: event.account_number || '',
      payment_note: event.payment_note || '',
      payment_qr_image: event.payment_qr_image || '',
    });
    if (event.payment_qr_image) setQrPreview(event.payment_qr_image);
  }, [event?.id]);

  const set = (field, val) => {
    setSaved(false);
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const toggleMethod = (key) => {
    setSaved(false);
    setForm(prev => {
      const enabled = prev.payment_methods_enabled;
      if (enabled.includes(key)) {
        // Don't allow deselecting all
        if (enabled.length === 1) return prev;
        return { ...prev, payment_methods_enabled: enabled.filter(k => k !== key) };
      } else {
        return { ...prev, payment_methods_enabled: [...enabled, key] };
      }
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.StrideEvent.update(eventId, {
      payment_methods_enabled: form.payment_methods_enabled,
      bank_name: form.bank_name || null,
      account_name: form.account_name || null,
      account_number: form.account_number || null,
      payment_note: form.payment_note || null,
      payment_qr_image: form.payment_qr_image || null,
    }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['event-payment-config', eventId] });
      queryClient.invalidateQueries({ queryKey: ['stride-event', eventId] });
    },
  });

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingQr(true);
    setQrPreview(URL.createObjectURL(file));
    const result = await base44.integrations.Core.UploadFile({ file });
    set('payment_qr_image', result.file_url);
    setUploadingQr(false);
  };

  const inp = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, color: 'white', padding: '11px 14px',
    width: '100%', outline: 'none', fontSize: 14, boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.32)',
    textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6,
  };

  const bankEnabled = form.payment_methods_enabled.includes('bank_transfer');
  const qrEnabled   = form.payment_methods_enabled.includes('qr_scan');

  // Validate current form state (before save)
  const { ready: formReady, issues: formIssues } = checkPaymentReady({
    payment_methods_enabled: form.payment_methods_enabled,
    bank_name: form.bank_name,
    account_name: form.account_name,
    account_number: form.account_number,
    payment_qr_image: form.payment_qr_image,
  });

  if (isLoading) return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
      <Loader2 style={{ width: 20, height: 20, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Method toggles */}
      <div>
        <p style={lbl}>Enabled Payment Methods</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {METHODS.map(({ key, label, Icon, desc }) => {
            const active = form.payment_methods_enabled.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleMethod(key)}
                style={{
                  flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                  ...(active
                    ? { background: 'rgba(191,255,0,0.08)', border: '1.5px solid rgba(191,255,0,0.35)', color: '#BFFF00' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.35)' }
                  ),
                }}
              >
                <Icon style={{ width: 16, height: 16, marginBottom: 6 }} />
                <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 3px' }}>{label}</p>
                <p style={{ fontSize: 10, margin: 0, opacity: 0.7, lineHeight: 1.4 }}>{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank Transfer fields */}
      {bankEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Building2 style={{ width: 14, height: 14, color: 'rgba(191,255,0,0.6)' }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(191,255,0,0.7)', margin: 0 }}>Bank Transfer Details</p>
          </div>
          <div>
            <label style={lbl}>Bank Name</label>
            <input type="text" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. Kasikorn Bank (KBank)" style={inp} />
          </div>
          <div>
            <label style={lbl}>Account Name</label>
            <input type="text" value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="e.g. BoomX Running Co., Ltd." style={inp} />
          </div>
          <div>
            <label style={lbl}>Account Number</label>
            <input type="text" value={form.account_number} onChange={e => set('account_number', e.target.value)} placeholder="e.g. 000-0-00000-0" style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.08em' }} />
          </div>
        </div>
      )}

      {/* QR Scan field */}
      {qrEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <QrCode style={{ width: 14, height: 14, color: 'rgba(191,255,0,0.6)' }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(191,255,0,0.7)', margin: 0 }}>QR Payment Image</p>
          </div>
          <label style={lbl}>Upload QR Code Image (PromptPay / any QR payment)</label>
          {qrPreview ? (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'white', padding: 10, display: 'inline-block' }}>
                <img src={qrPreview} alt="QR code" style={{ width: 160, height: 160, objectFit: 'contain', display: 'block' }} />
                {uploadingQr && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)' }}>
                    <Loader2 style={{ width: 24, height: 24, color: '#0A0A0A', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              {!uploadingQr && (
                <button
                  onClick={() => { setQrPreview(null); set('payment_qr_image', ''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 10, background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: 'rgba(255,100,100,1)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <X style={{ width: 12, height: 12 }} /> Remove QR
                </button>
              )}
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              borderRadius: 14, cursor: 'pointer', height: 100,
              background: 'rgba(191,255,0,0.03)', border: '1px dashed rgba(191,255,0,0.2)',
            }}>
              <ImagePlus style={{ width: 20, height: 20, color: 'rgba(191,255,0,0.35)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Tap to upload QR image</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleQrUpload} />
            </label>
          )}
        </div>
      )}

      {/* Payment note */}
      <div>
        <label style={lbl}>Payment Note (optional)</label>
        <textarea
          value={form.payment_note}
          onChange={e => set('payment_note', e.target.value)}
          placeholder="e.g. Please include your full name as the transfer reference. Contact LINE @boomxrun for any issues."
          rows={3}
          style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 0', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none',
          ...(saved
            ? { background: 'rgba(0,210,110,0.12)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.3)' }
            : { background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.3)' }
          ),
        }}
      >
        {saveMutation.isPending
          ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Saving…</>
          : saved
            ? <><CheckCircle2 style={{ width: 15, height: 15 }} /> Saved</>
            : 'Save Payment Settings'
        }
      </button>

      {/* Readiness status */}
      {formReady ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,210,110,0.07)', border: '1px solid rgba(0,210,110,0.2)' }}>
          <CheckCircle2 style={{ width: 14, height: 14, color: 'rgb(0,210,110)', flexShrink: 0 }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgb(0,210,110)', margin: 0 }}>Payment setup is complete ✓</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,120,0,0.07)', border: '1px solid rgba(255,120,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: 'rgba(255,150,50,1)', flexShrink: 0 }} />
            <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,150,50,1)', margin: 0 }}>Payment setup incomplete</p>
          </div>
          {formIssues.map((issue, i) => (
            <p key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 0 21px', lineHeight: 1.5 }}>· {issue}</p>
          ))}
        </div>
      )}
    </div>
  );
}
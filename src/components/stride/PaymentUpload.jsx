import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, Clock, Loader2, ImageIcon, AlertTriangle, RefreshCw, Building2, QrCode, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';
import { getCategoryPaymentRule } from '@/lib/categoryPaymentRule';

const METHOD_KEYS = [
  { key: 'bank_transfer', labelKey: 'payment_method_bank', Icon: Building2 },
  { key: 'qr_scan',       labelKey: 'payment_method_qr',   Icon: QrCode },
];

function SlipUploader({ onUploaded, tFn }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    const result = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    onUploaded(result.file_url, preview || URL.createObjectURL(file));
  };

  return (
    <label style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 14, cursor: 'pointer', height: 80,
      background: 'rgba(191,255,0,0.04)', border: '1px dashed rgba(191,255,0,0.22)',
    }}>
      {uploading
        ? <Loader2 style={{ width: 20, height: 20, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
        : <ImageIcon style={{ width: 18, height: 18, color: 'rgba(191,255,0,0.35)' }} />
      }
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
        {uploading ? tFn('payment_uploading') : tFn('payment_tap_upload')}
      </span>
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </label>
  );
}

export default function PaymentUpload({ registration, category }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState(null);
  const [slipUrl, setSlipUrl] = useState('');
  const [slipPreview, setSlipPreview] = useState(null);
  const [note, setNote] = useState('');
  const [userAmount, setUserAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['event-payment-config', registration.event_id],
    queryFn: () => base44.entities.StrideEvent.filter({ id: registration.event_id }),
    enabled: !!registration.event_id,
  });
  const event = events[0] || null;
  const enabledMethods = event?.payment_methods_enabled?.length > 0
    ? event.payment_methods_enabled
    : ['bank_transfer'];
  const METHODS = METHOD_KEYS.map(m => ({ ...m, label: t(m.labelKey) }));
  const availableMethods = METHODS.filter(m => enabledMethods.includes(m.key));

  React.useEffect(() => {
    if (availableMethods.length > 0 && (!method || !enabledMethods.includes(method))) {
      setMethod(availableMethods[0].key);
    }
  }, [enabledMethods.join(',')]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', registration.id],
    queryFn: () => base44.entities.EventPayment.filter({ registration_id: registration.id }),
  });
  const existingPayment = payments[0] || null;

  const { paymentRequired, paymentMode, amountDue, userMustEnterAmount } = getCategoryPaymentRule(category);

  // Resolve the display amount
  const resolvedAmount = userMustEnterAmount
    ? (parseFloat(userAmount) > 0 ? parseFloat(userAmount) : null)
    : amountDue;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (userMustEnterAmount) {
        const amt = parseFloat(userAmount);
        if (!amt || amt <= 0) { setAmountError(t('payment_enter_amount_error')); throw new Error('missing_amount'); }
      }
      if (!slipUrl) throw new Error('missing_slip');

      const now = new Date().toISOString();
      const finalAmount = userMustEnterAmount ? parseFloat(userAmount) : (amountDue || 0);

      const paymentData = {
        slip_image: slipUrl,
        payment_method: method,
        status: 'pending',
        submitted_at: now,
        user_note: note || null,
        admin_note: null,
        reviewed_by: null,
        reviewed_at: null,
        amount: finalAmount,
        amount_due: finalAmount,
        amount_paid: finalAmount,
        payment_mode: paymentMode,
        category_price_snapshot: category?.price || 0,
        payment_enabled_snapshot: category?.payment_enabled || false,
        ...(userMustEnterAmount && { user_entered_amount: finalAmount }),
      };

      if (existingPayment) {
        await base44.entities.EventPayment.update(existingPayment.id, paymentData);
      } else {
        await base44.entities.EventPayment.create({
          registration_id: registration.id,
          event_id: registration.event_id,
          user_email: registration.user_email,
          ...paymentData,
        });
      }
      await base44.entities.EventRegistration.update(registration.id, { payment_status: 'pending' });
    },
    onSuccess: () => {
      setSlipUrl(''); setSlipPreview(null); setNote(''); setUserAmount(''); setAmountError('');
      queryClient.invalidateQueries({ queryKey: ['payment', registration.id] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
    },
    onError: (e) => {
      if (e.message === 'missing_amount') return; // already set error
    },
  });

  // ── STATE: Approved ──
  if (existingPayment?.status === 'approved') {
    const paidAmount = existingPayment.amount_paid ?? existingPayment.user_entered_amount ?? existingPayment.amount;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.22)' }}>
          <CheckCircle2 style={{ width: 18, height: 18, color: 'rgb(0,210,110)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'rgb(0,210,110)', margin: 0 }}>{t('payment_approved')}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
              ฿{paidAmount?.toLocaleString()} · {existingPayment.payment_method === 'qr_scan' ? 'QR Scan' : 'Bank Transfer'}
            </p>
          </div>
        </div>
        {existingPayment.payment_mode === 'user_entered_amount' && (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.2)' }}>
            <p style={{ fontSize: 11, color: 'rgba(190,140,255,0.8)', margin: 0 }}>
              {t('payment_user_entered_badge')} · {t('amount_submitted')}: ฿{(existingPayment.user_entered_amount ?? paidAmount)?.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── STATE: Pending (submitted, waiting review) ──
  if (existingPayment?.status === 'pending' && existingPayment?.slip_image) {
    const submittedAmount = existingPayment.amount_paid ?? existingPayment.user_entered_amount ?? existingPayment.amount;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,200,80,0.07)', border: '1px solid rgba(255,200,80,0.2)' }}>
          <Clock style={{ width: 16, height: 16, color: 'rgba(255,200,80,1)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,200,80,1)', margin: 0 }}>{t('payment_awaiting')}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>{t('payment_awaiting_sub')}</p>
            {existingPayment.payment_mode === 'user_entered_amount' && (
              <p style={{ fontSize: 11, color: 'rgba(190,140,255,0.8)', margin: '4px 0 0', fontWeight: 700 }}>
                {t('amount_submitted')}: ฿{submittedAmount?.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <a href={existingPayment.slip_image} target="_blank" rel="noreferrer">
            <img src={existingPayment.slip_image} alt="Payment slip" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          </a>
          <div style={{ padding: '8px 12px', background: 'rgba(10,10,10,0.9)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Submitted {existingPayment.submitted_at ? format(new Date(existingPayment.submitted_at), 'MMM d · h:mm a') : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSlipUrl(''); setSlipPreview(null);
            queryClient.setQueryData(['payment', registration.id], [{ ...existingPayment, slip_image: null, status: 'pending' }]);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} /> {t('payment_replace_slip')}
        </button>
      </div>
    );
  }

  const isNeedsAttention = existingPayment?.status === 'needs_attention';
  const canSubmit = slipUrl && method && !submitMutation.isPending &&
    (!userMustEnterAmount || (parseFloat(userAmount) > 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Needs Attention */}
      {isNeedsAttention && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,120,0,0.07)', border: '1px solid rgba(255,120,0,0.25)' }}>
          <AlertTriangle style={{ width: 15, height: 15, color: 'rgba(255,150,50,1)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,150,50,1)', margin: 0 }}>{t('payment_needs_attn_title')}</p>
            {existingPayment.admin_note && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.5 }}>{existingPayment.admin_note}</p>
            )}
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>{t('payment_needs_attn_sub')}</p>
          </div>
        </div>
      )}

      {/* User-entered-amount info banner */}
      {userMustEnterAmount && (
        <div style={{ padding: '11px 14px', borderRadius: 14, background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.3)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(190,140,255,0.9)', margin: '0 0 3px' }}>
            {t('payment_user_entered_badge')}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.5 }}>
            {t('payment_user_entered_hint')}
          </p>
        </div>
      )}

      {/* Amount display (fixed_price) or input (user_entered_amount) */}
      {userMustEnterAmount ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            {t('payment_enter_amount_label')}
          </p>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{
              position: 'absolute', left: 14, fontSize: 18, fontWeight: 900,
              color: 'rgba(191,255,0,0.7)', pointerEvents: 'none',
            }}>฿</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={userAmount}
              onChange={e => { setUserAmount(e.target.value); setAmountError(''); }}
              placeholder="0"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${amountError ? 'rgba(255,80,80,0.5)' : 'rgba(138,43,226,0.35)'}`,
                borderRadius: 14, color: '#BFFF00', fontSize: 22, fontWeight: 900,
                outline: 'none', letterSpacing: '-0.5px',
              }}
            />
          </div>
          {amountError && (
            <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.9)', margin: 0 }}>{amountError}</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{t('payment_amount')}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#BFFF00', margin: 0, letterSpacing: '-0.5px', textShadow: '0 0 16px rgba(191,255,0,0.3)' }}>
            ฿{(amountDue || 0)?.toLocaleString()}
          </p>
        </div>
      )}

      {/* Method selector */}
      {availableMethods.length > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {availableMethods.map(({ key, label, Icon }) => {
            const active = method === key;
            return (
              <button key={key} onClick={() => setMethod(key)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                ...(active
                  ? { background: '#BFFF00', color: '#0A0A0A', border: '1px solid transparent' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                ),
              }}>
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Method instructions */}
      {method === 'bank_transfer' && (
        <BankTransferInstructions event={event} amount={resolvedAmount} />
      )}
      {method === 'qr_scan' && (
        <QRScanInstructions event={event} amount={resolvedAmount} />
      )}

      {/* Slip upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('payment_upload_slip')}
        </p>
        {slipPreview ? (
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
            <img src={slipPreview} alt="Slip preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => { setSlipPreview(null); setSlipUrl(''); }}
              style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}
            >
              Change
            </button>
          </div>
        ) : (
          <SlipUploader onUploaded={(url, preview) => { setSlipUrl(url); setSlipPreview(preview); }} tFn={t} />
        )}
      </div>

      {/* Note */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {t('payment_note_label')}
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('payment_note_hint')}
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 12, color: 'white', padding: '10px 14px', fontSize: 13,
            outline: 'none', resize: 'none', lineHeight: 1.5,
          }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => submitMutation.mutate()}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
          ...(canSubmit
            ? { background: '#BFFF00', color: '#0A0A0A', boxShadow: '0 0 20px rgba(191,255,0,0.2)' }
            : { background: 'rgba(191,255,0,0.12)', color: 'rgba(255,255,255,0.25)' }
          ),
        }}
      >
        {submitMutation.isPending
          ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> {t('payment_submitting')}</>
          : <><Upload style={{ width: 16, height: 16 }} /> {isNeedsAttention ? t('payment_resubmit') : t('payment_submit_to_admin')}</>
        }
      </button>
    </div>
  );
}

function BankTransferInstructions({ event, amount }) {
  const { t } = useLanguage();
  const hasBankInfo = event?.bank_name || event?.account_name || event?.account_number;
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {hasBankInfo ? (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {event.bank_name && <InfoRow label="Bank" value={event.bank_name} />}
          {event.account_name && <InfoRow label="Account Name" value={event.account_name} />}
          {event.account_number && <InfoRow label="Account Number" value={event.account_number} highlight />}
          {amount && <InfoRow label="Amount" value={`฿${Number(amount).toLocaleString()}`} highlight />}
          {event.payment_note && (
            <div style={{ marginTop: 2, padding: '8px 12px', borderRadius: 10, background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.12)' }}>
              <p style={{ fontSize: 11, color: 'rgba(191,255,0,0.7)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>📋 {event.payment_note}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t('payment_bank_hint')}</p>
        </div>
      )}
    </div>
  );
}

function QRImageLightbox({ url, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '80vh', background: 'white', borderRadius: 20, padding: 12, boxShadow: '0 0 60px rgba(191,255,0,0.15)' }}>
        <img src={url} alt="Payment QR" style={{ display: 'block', maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12 }} />
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Tap outside to close</p>
    </div>
  );
}

function QRScanInstructions({ event, amount }) {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState(false);
  return (
    <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {event?.payment_qr_image ? (
        <>
          <button onClick={() => setLightbox(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img src={event.payment_qr_image} alt="Payment QR" style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 14, background: 'white', padding: 8, boxShadow: '0 0 20px rgba(191,255,0,0.1)' }} />
            <span style={{ fontSize: 11, color: 'rgba(180,120,255,0.8)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>{t('payment_tap_qr')}</span>
          </button>
          {amount && <p style={{ fontSize: 13, fontWeight: 800, color: '#BFFF00', margin: 0 }}>{t('payment_scan_pay')} ฿{Number(amount).toLocaleString()}</p>}
          {event.payment_note && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'left', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{event.payment_note}</p>}
          {lightbox && <QRImageLightbox url={event.payment_qr_image} onClose={() => setLightbox(false)} />}
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' }}>{t('payment_qr_hint')}</p>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? '#BFFF00' : 'rgba(255,255,255,0.85)', fontFamily: highlight ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  );
}
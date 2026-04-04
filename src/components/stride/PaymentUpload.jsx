import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, Clock, Loader2, ImageIcon, AlertTriangle, RefreshCw, Building2, QrCode } from 'lucide-react';
import { format } from 'date-fns';

// ─── Method config ────────────────────────────────────────────────────────────
const METHODS = [
  { key: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
  { key: 'qr_scan',       label: 'QR Scan',       Icon: QrCode },
];

// ─── Slip uploader sub-component ──────────────────────────────────────────────
function SlipUploader({ onUploaded }) {
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
        {uploading ? 'Uploading…' : 'Tap to upload slip image'}
      </span>
      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PaymentUpload({ registration, category }) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('bank_transfer');
  const [slipUrl, setSlipUrl] = useState('');
  const [slipPreview, setSlipPreview] = useState(null);

  // Fetch event payment config
  const { data: events = [] } = useQuery({
    queryKey: ['event-payment-config', registration.event_id],
    queryFn: () => base44.entities.StrideEvent.filter({ id: registration.event_id }),
    enabled: !!registration.event_id,
  });
  const event = events[0] || null;
  const enabledMethods = event?.payment_methods_enabled?.length > 0
    ? event.payment_methods_enabled
    : ['bank_transfer'];
  const availableMethods = METHODS.filter(m => enabledMethods.includes(m.key));

  // Fetch existing payment record
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', registration.id],
    queryFn: () => base44.entities.EventPayment.filter({ registration_id: registration.id }),
  });
  const existingPayment = payments[0] || null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      if (existingPayment) {
        await base44.entities.EventPayment.update(existingPayment.id, {
          slip_image: slipUrl,
          payment_method: method,
          status: 'pending',
          submitted_at: now,
          admin_note: null,
          reviewed_by: null,
          reviewed_at: null,
        });
        // Update registration payment_status back to pending
        await base44.entities.EventRegistration.update(registration.id, { payment_status: 'pending' });
      } else {
        await base44.entities.EventPayment.create({
          registration_id: registration.id,
          event_id: registration.event_id,
          user_email: registration.user_email,
          amount: category?.price || 0,
          payment_method: method,
          slip_image: slipUrl,
          status: 'pending',
          submitted_at: now,
        });
        await base44.entities.EventRegistration.update(registration.id, { payment_status: 'pending' });
      }
    },
    onSuccess: () => {
      setSlipUrl('');
      setSlipPreview(null);
      queryClient.invalidateQueries({ queryKey: ['payment', registration.id] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
    },
  });

  if (isLoading) return null;
  if (!category || category.price === 0) return null;

  const amount = category.price;

  // ── STATE: Approved ──
  if (existingPayment?.status === 'approved') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.22)' }}>
        <CheckCircle2 style={{ width: 18, height: 18, color: 'rgb(0,210,110)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'rgb(0,210,110)', margin: 0 }}>Payment Approved</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
            ฿{amount?.toLocaleString()} · {existingPayment.payment_method === 'qr_scan' ? 'QR Scan' : 'Bank Transfer'}
          </p>
        </div>
      </div>
    );
  }

  // ── STATE: Awaiting Approval (slip submitted, pending review) ──
  if (existingPayment?.status === 'pending' && existingPayment?.slip_image) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,200,80,0.07)', border: '1px solid rgba(255,200,80,0.2)' }}>
          <Clock style={{ width: 16, height: 16, color: 'rgba(255,200,80,1)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,200,80,1)', margin: 0 }}>Awaiting Payment Approval</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
              Your slip has been submitted and is waiting for admin review.
            </p>
          </div>
        </div>

        {/* Submitted slip preview */}
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

        {/* Replace slip option */}
        <button
          onClick={() => {
            setSlipUrl('');
            setSlipPreview(null);
            // Temporarily show upload form by resetting local state — handled by re-render
            queryClient.setQueryData(['payment', registration.id], [{ ...existingPayment, slip_image: null }]);
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} /> Replace Slip
        </button>
      </div>
    );
  }

  // ── STATE: Needs Attention (admin requested re-upload) ──
  const isNeedsAttention = existingPayment?.status === 'needs_attention';

  // ── STATE: Awaiting Payment / Needs Attention — show upload form ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Needs Attention warning */}
      {isNeedsAttention && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,120,0,0.07)', border: '1px solid rgba(255,120,0,0.25)' }}>
          <AlertTriangle style={{ width: 15, height: 15, color: 'rgba(255,150,50,1)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,150,50,1)', margin: 0 }}>Payment Needs Attention</p>
            {existingPayment.admin_note && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {existingPayment.admin_note}
              </p>
            )}
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>Please upload a new payment slip.</p>
          </div>
        </div>
      )}

      {/* Amount due */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Amount Due</p>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#BFFF00', margin: 0, letterSpacing: '-0.5px', textShadow: '0 0 16px rgba(191,255,0,0.3)' }}>
          ฿{amount?.toLocaleString()}
        </p>
      </div>

      {/* Method selector */}
      {availableMethods.length > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {availableMethods.map(({ key, label, Icon }) => {
            const active = method === key;
            return (
              <button
                key={key}
                onClick={() => setMethod(key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  ...(active
                    ? { background: '#BFFF00', color: '#0A0A0A', border: '1px solid transparent' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                  ),
                }}
              >
                <Icon style={{ width: 15, height: 15 }} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Method instructions */}
      {method === 'bank_transfer' && (
        <BankTransferInstructions event={event} amount={amount} />
      )}
      {method === 'qr_scan' && (
        <QRScanInstructions event={event} amount={amount} />
      )}

      {/* Slip upload area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Upload Payment Slip
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
          <SlipUploader onUploaded={(url, preview) => { setSlipUrl(url); setSlipPreview(preview); }} />
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={() => submitMutation.mutate()}
        disabled={!slipUrl || submitMutation.isPending}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: slipUrl ? 'pointer' : 'not-allowed', border: 'none',
          ...(slipUrl && !submitMutation.isPending
            ? { background: '#BFFF00', color: '#0A0A0A', boxShadow: '0 0 20px rgba(191,255,0,0.2)' }
            : { background: 'rgba(191,255,0,0.12)', color: 'rgba(255,255,255,0.25)' }
          ),
        }}
      >
        {submitMutation.isPending
          ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Submitting…</>
          : <><Upload style={{ width: 16, height: 16 }} /> {isNeedsAttention ? 'Resubmit Payment' : 'Submit Payment'}</>
        }
      </button>
    </div>
  );
}

// ─── Bank Transfer Instructions ───────────────────────────────────────────────
function BankTransferInstructions({ event, amount }) {
  const hasBankInfo = event?.bank_name || event?.account_name || event?.account_number;
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {hasBankInfo ? (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {event.bank_name && (
            <InfoRow label="Bank" value={event.bank_name} />
          )}
          {event.account_name && (
            <InfoRow label="Account Name" value={event.account_name} />
          )}
          {event.account_number && (
            <InfoRow label="Account Number" value={event.account_number} highlight />
          )}
          {amount && (
            <InfoRow label="Amount" value={`฿${amount.toLocaleString()}`} highlight />
          )}
          {event.payment_note && (
            <div style={{ marginTop: 2, padding: '8px 12px', borderRadius: 10, background: 'rgba(191,255,0,0.05)', border: '1px solid rgba(191,255,0,0.12)' }}>
              <p style={{ fontSize: 11, color: 'rgba(191,255,0,0.7)', margin: 0, lineHeight: 1.5 }}>📋 {event.payment_note}</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Bank transfer details will be provided by the organizer.</p>
        </div>
      )}
    </div>
  );
}

// ─── QR Scan Instructions ─────────────────────────────────────────────────────
function QRScanInstructions({ event, amount }) {
  return (
    <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {event?.payment_qr_image ? (
        <>
          <img
            src={event.payment_qr_image}
            alt="Payment QR"
            style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: 14, background: 'white', padding: 8 }}
          />
          {amount && (
            <p style={{ fontSize: 13, fontWeight: 800, color: '#BFFF00', margin: 0 }}>
              Scan and pay ฿{amount.toLocaleString()}
            </p>
          )}
          {event.payment_note && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
              {event.payment_note}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, textAlign: 'center' }}>
          QR payment image will be provided by the organizer.
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 800 : 600, color: highlight ? '#BFFF00' : 'rgba(255,255,255,0.85)', fontFamily: highlight ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}
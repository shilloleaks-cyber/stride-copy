import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, AlertCircle } from 'lucide-react';

// ─── Payment label logic ─────────────────────────────────────────────────────
// payment_status = 'pending'        → "Awaiting Payment"
// payment_status = 'pending' + slip → "Awaiting Payment Approval"
// payment_status = 'paid'           → "Payment Approved"
// payment_status = 'not_required'   → "No Payment Required"
// payment_status = 'refunded'       → "Refunded"
function paymentLabel(payment_status, hasSlip) {
  if (payment_status === 'paid')         return { label: 'Payment Approved',          color: 'rgb(0,210,110)',     bg: 'rgba(0,210,110,0.12)' };
  if (payment_status === 'not_required') return { label: 'No Payment Required',       color: '#BFFF00',            bg: 'rgba(191,255,0,0.1)' };
  if (payment_status === 'refunded')     return { label: 'Refunded',                  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' };
  if (payment_status === 'pending' && hasSlip)
                                         return { label: 'Awaiting Payment Approval', color: 'rgb(255,140,0)',     bg: 'rgba(255,140,0,0.12)' };
  return                                        { label: 'Awaiting Payment',          color: 'rgba(255,200,80,1)', bg: 'rgba(255,200,80,0.1)' };
}

// ─── Tiny confirm modal ──────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmVariant = 'red', onConfirm, onCancel }) {
  const variantStyle = {
    red:   { background: 'rgba(255,80,80,0.15)',  border: '1px solid rgba(255,80,80,0.35)',  color: 'rgba(255,110,110,1)' },
    amber: { background: 'rgba(255,180,0,0.15)',  border: '1px solid rgba(255,180,0,0.35)',  color: 'rgb(255,180,0)' },
    lime:  { background: 'rgba(191,255,0,0.15)',  border: '1px solid rgba(191,255,0,0.35)',  color: '#BFFF00' },
    green: { background: 'rgba(0,210,110,0.15)',  border: '1px solid rgba(0,210,110,0.35)', color: 'rgb(0,210,110)' },
  }[confirmVariant] || {};

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 340, background: '#111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</p>
        {message && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', ...variantStyle }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
const ROW = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 13, color: accent || 'rgba(255,255,255,0.85)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value || '—'}</span>
  </div>
);

// ─── Action button ────────────────────────────────────────────────────────────
const ACTION_BTN = ({ label, onClick, disabled, variant = 'default', loading }) => {
  const styles = {
    default: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.7)' },
    lime:    { background: 'rgba(191,255,0,0.1)',    border: '1px solid rgba(191,255,0,0.3)',    color: '#BFFF00' },
    green:   { background: 'rgba(0,210,110,0.1)',    border: '1px solid rgba(0,210,110,0.3)',   color: 'rgb(0,210,110)' },
    amber:   { background: 'rgba(255,180,0,0.1)',    border: '1px solid rgba(255,180,0,0.3)',   color: 'rgb(255,180,0)' },
    red:     { background: 'rgba(255,80,80,0.1)',    border: '1px solid rgba(255,80,80,0.25)',  color: 'rgba(255,100,100,1)' },
    muted:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)', cursor: 'not-allowed' },
  };
  const s = disabled ? styles.muted : (styles[variant] || styles.default);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      style={{ ...s, width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
    >
      {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
      {label}
    </button>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SECTION = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 8px' }}>
    {children}
  </p>
);

// ─── Block reason hint ────────────────────────────────────────────────────────
const HINT = ({ children }) => (
  <p style={{ fontSize: 11, color: 'rgba(255,180,0,0.7)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
    <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} /> {children}
  </p>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegistrationDetailSheet({ reg, eventMap, catMap, registrations, onClose, onUpdated }) {
  const queryClient = useQueryClient();
  const [bibInput, setBibInput] = useState('');
  const [showBibInput, setShowBibInput] = useState(false);
  const [adminNotes, setAdminNotes] = useState(reg.admin_notes || '');
  const [confirm, setConfirm] = useState(null); // { title, message, confirmLabel, variant, action }

  const ev = eventMap[reg.event_id];
  const cat = catMap[reg.category_id];

  // Fetch CategoryItems to resolve item_selections keys → names
  const { data: categoryItems = [] } = useQuery({
    queryKey: ['category-items-detail', reg.category_id],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: reg.category_id }),
    enabled: !!reg.category_id && !!reg.item_selections && Object.keys(reg.item_selections).length > 0,
  });
  const itemNameMap = Object.fromEntries(categoryItems.map(i => [i.id, i.name]));

  // Fetch payment slip (EventPayment) to detect slip-uploaded state
  const { data: payments = [] } = useQuery({
    queryKey: ['reg-payment', reg.id],
    queryFn: () => base44.entities.EventPayment.filter({ registration_id: reg.id }),
    enabled: reg.payment_status === 'pending' || reg.payment_status === 'paid',
  });
  const hasSlip = payments.length > 0 && !!payments[0]?.slip_image;
  const paymentNeedsAttention = payments[0]?.status === 'needs_attention';

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    if (onUpdated) onUpdated();
  };

  const update = useMutation({
    mutationFn: (data) => base44.entities.EventRegistration.update(reg.id, data),
    onSuccess: invalidate,
  });

  const generateBib = () => {
    const prefix = cat?.bib_prefix || 'R';
    const start  = cat?.bib_start  || 1;
    const usedBibs = new Set(
      registrations
        .filter(r => r.category_id === reg.category_id && r.bib_number && r.id !== reg.id)
        .map(r => r.bib_number)
    );
    let candidate = start;
    let bib;
    do {
      bib = `${prefix}${String(candidate).padStart(3, '0')}`;
      candidate++;
    } while (usedBibs.has(bib));
    return bib;
  };

  const handleAssignBib = () => {
    const bib = bibInput.trim() || generateBib();
    update.mutate({ bib_number: bib });
    setShowBibInput(false);
    setBibInput('');
  };

  // Derived state
  const canCheckIn = reg.status === 'confirmed' && (reg.payment_status === 'paid' || reg.payment_status === 'not_required');
  const checkInBlockReason = !canCheckIn
    ? reg.status !== 'confirmed'
      ? 'Registration must be confirmed first'
      : 'Payment must be approved first'
    : null;

  const hasSelections = reg.item_selections && Object.keys(reg.item_selections).length > 0;
  const pay = paymentNeedsAttention
    ? { label: 'Needs Attention', color: 'rgba(255,150,50,1)', bg: 'rgba(255,120,0,0.12)' }
    : paymentLabel(reg.payment_status, hasSlip);

  // Confirm-then-execute helper
  const withConfirm = (cfg) => setConfirm(cfg);
  const executeConfirm = () => {
    if (!confirm) return;
    confirm.action();
    setConfirm(null);
  };

  return (
    <>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          confirmVariant={confirm.variant}
          onConfirm={executeConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Backdrop + sheet */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 600,
            background: 'linear-gradient(180deg, #0f0f14 0%, #0a0a0a 100%)',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTop: '1.5px solid rgba(138,43,226,0.4)',
            maxHeight: '90dvh', overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 8px' }}>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>{reg.first_name} {reg.last_name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>{reg.user_email}</p>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Status badges ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(() => {
                const s = {
                  pending:   ['rgba(255,200,80,0.12)',  'rgba(255,200,80,1)',    'Pending'],
                  confirmed: ['rgba(0,210,110,0.12)',   'rgb(0,210,110)',        'Confirmed'],
                  rejected:  ['rgba(255,80,80,0.12)',   'rgba(255,100,100,1)',   'Rejected'],
                  cancelled: ['rgba(255,80,80,0.12)',   'rgba(255,100,100,1)',   'Cancelled'],
                }[reg.status] || ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.5)', reg.status];
                return <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: s[0], color: s[1] }}>{s[2]}</span>;
              })()}
              {reg.checked_in && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: 'rgba(191,255,0,0.12)', color: '#BFFF00' }}>✓ Checked In</span>
              )}
              <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: pay.bg, color: pay.color }}>
                💳 {pay.label}
              </span>
            </div>

            {/* ── Details ── */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '4px 16px' }}>
              <ROW label="Event"    value={ev?.title} />
              <ROW label="Category" value={cat?.name} accent="#BFFF00" />
              <ROW label="Bib"      value={reg.bib_number} accent="#BFFF00" />
              <ROW label="QR Code"  value={reg.qr_code} />
              <ROW label="Phone"    value={reg.phone} />
              <ROW label="Date of Birth" value={reg.date_of_birth} />
              <ROW label="Gender"   value={reg.gender} />
              <ROW label="Nationality" value={reg.nationality} />
              <ROW label="Blood Type"  value={reg.blood_type} />
              {reg.emergency_contact_name && (
                <ROW label="Emergency Contact" value={`${reg.emergency_contact_name}${reg.emergency_contact_phone ? ` · ${reg.emergency_contact_phone}` : ''}`} />
              )}
              {reg.admin_notes && (
                <ROW label="Admin Notes" value={reg.admin_notes} accent="rgba(255,180,0,0.9)" />
              )}
            </div>

            {/* ── Item Selections (human-readable) ── */}
            {hasSelections && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Item Selections</p>
                {Object.entries(reg.item_selections).map(([itemId, val]) => {
                  const name = itemNameMap[itemId] || itemId;
                  const isIncluded = val === 'included';
                  return (
                    <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isIncluded ? 'rgba(255,255,255,0.4)' : '#BFFF00', background: isIncluded ? 'rgba(255,255,255,0.05)' : 'rgba(191,255,0,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                        {isIncluded ? 'Included' : val}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ paddingBottom: 8 }}>
              <SECTION>Actions</SECTION>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* 1. Approve / Reject */}
                <ACTION_BTN
                  label="✓ Approve Registration"
                  variant="green"
                  disabled={reg.status === 'confirmed' || reg.status === 'rejected'}
                  loading={update.isPending}
                  onClick={() => update.mutate({ status: 'confirmed' })}
                />
                {reg.status === 'confirmed' && <HINT>Already confirmed.</HINT>}

                <ACTION_BTN
                  label="✗ Reject Registration"
                  variant="red"
                  disabled={reg.status === 'rejected' || reg.status === 'cancelled'}
                  loading={update.isPending}
                  onClick={() => withConfirm({
                    title: 'Reject Registration?',
                    message: `This will reject ${reg.first_name} ${reg.last_name}'s registration. They won't be able to attend.`,
                    confirmLabel: 'Reject',
                    variant: 'red',
                    action: () => update.mutate({ status: 'rejected' }),
                  })}
                />

                {/* 2. Bib */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Bib Number</SECTION>
                  {!showBibInput ? (
                    <ACTION_BTN
                      label={reg.bib_number ? `# Reassign Bib  ·  current: ${reg.bib_number}` : '# Assign Bib'}
                      variant="amber"
                      loading={update.isPending}
                      onClick={() => {
                        if (reg.bib_number) {
                          withConfirm({
                            title: 'Reassign Bib?',
                            message: `Current bib is ${reg.bib_number}. A new bib will be auto-generated unless you type a custom one.`,
                            confirmLabel: 'Reassign',
                            variant: 'amber',
                            action: () => { setBibInput(generateBib()); setShowBibInput(true); },
                          });
                        } else {
                          setBibInput(generateBib());
                          setShowBibInput(true);
                        }
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        autoFocus
                        value={bibInput}
                        onChange={e => setBibInput(e.target.value)}
                        placeholder="e.g. R001"
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,180,0,0.3)', color: '#fff', fontSize: 13, outline: 'none' }}
                      />
                      <button onClick={handleAssignBib} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.3)', color: 'rgb(255,180,0)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>Save</button>
                      <button onClick={() => setShowBibInput(false)} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>Cancel</button>
                    </div>
                  )}
                </div>

                {/* 3. Payment */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Payment</SECTION>
                  <ACTION_BTN
                    label="💳 Approve Payment"
                    variant="lime"
                    disabled={reg.payment_status === 'paid' || reg.payment_status === 'not_required'}
                    loading={update.isPending}
                    onClick={() => update.mutate({ payment_status: 'paid' })}
                  />
                  {(reg.payment_status === 'paid' || reg.payment_status === 'not_required') && (
                    <HINT>{reg.payment_status === 'paid' ? 'Payment already approved.' : 'No payment required for this registration.'}</HINT>
                  )}

                  <div style={{ marginTop: 6 }}>
                    <ACTION_BTN
                      label="⏳ Reset to Awaiting Payment"
                      variant="amber"
                      disabled={reg.payment_status === 'pending'}
                      loading={update.isPending}
                      onClick={() => withConfirm({
                        title: 'Reset Payment Status?',
                        message: 'This will change the payment status back to "Awaiting Payment". Use this to undo an accidental approval.',
                        confirmLabel: 'Reset',
                        variant: 'amber',
                        action: () => update.mutate({ payment_status: 'pending' }),
                      })}
                    />
                    {reg.payment_status === 'pending' && <HINT>Already awaiting payment.</HINT>}
                  </div>
                </div>

                {/* 4. Check-In */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Check-In</SECTION>
                  {!reg.checked_in ? (
                    <div>
                      <ACTION_BTN
                        label="📍 Confirm Check-In"
                        variant={canCheckIn ? 'lime' : 'muted'}
                        disabled={!canCheckIn}
                        loading={update.isPending}
                        onClick={() => withConfirm({
                          title: 'Confirm Check-In?',
                          message: `Mark ${reg.first_name} ${reg.last_name} as checked in. This will unlock their finisher rewards.`,
                          confirmLabel: 'Check In',
                          variant: 'green',
                          action: () => update.mutate({ checked_in: true, checked_in_at: new Date().toISOString() }),
                        })}
                      />
                      {checkInBlockReason && <HINT>{checkInBlockReason}</HINT>}
                    </div>
                  ) : (
                    <div>
                      <ACTION_BTN
                        label="↩ Undo Check-In"
                        variant="red"
                        loading={update.isPending}
                        onClick={() => withConfirm({
                          title: 'Undo Check-In?',
                          message: `This will mark ${reg.first_name} ${reg.last_name} as NOT checked in. Use only to correct a mistake.`,
                          confirmLabel: 'Undo',
                          variant: 'red',
                          action: () => update.mutate({ checked_in: false, checked_in_at: null }),
                        })}
                      />
                    </div>
                  )}
                </div>

                {/* 5. Admin Notes */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Admin Notes</SECTION>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Internal notes visible only to admins..."
                    rows={2}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#fff', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={() => update.mutate({ admin_notes: adminNotes })}
                    disabled={update.isPending || adminNotes === (reg.admin_notes || '')}
                    style={{ marginTop: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Notes
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
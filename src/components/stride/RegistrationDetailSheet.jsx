import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { SHEET_CONTENT_PADDING_BOTTOM } from '@/lib/sheetLayout';
import { logActivity } from '@/lib/eventActivityLog';

import { REG_STATUS as REG_STATUS_CFG, resolvePaymentCfg } from '@/lib/eventStatusConfig';

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
export default function RegistrationDetailSheet({ reg, eventMap, catMap, registrations, categories = [], onClose, onUpdated, actorEmail, isFullAdmin = false, eventId }) {
  const queryClient = useQueryClient();
  const [bibInput, setBibInput] = useState('');
  const [showBibInput, setShowBibInput] = useState(false);
  const [adminNotes, setAdminNotes] = useState(reg.admin_notes || '');
  const [confirm, setConfirm] = useState(null); // { title, message, confirmLabel, variant, action }
  const [showCatSelect, setShowCatSelect] = useState(false);
  const [newCatId, setNewCatId] = useState('');

  const ev = eventMap[reg.event_id];
  const cat = catMap[reg.category_id];
  // Only show categories belonging to the same event
  const eventCategories = categories.filter(c => c.event_id === (eventId || reg.event_id));

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

  const eId = eventId || reg.event_id;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    if (onUpdated) onUpdated();
  };

  const update = useMutation({
    mutationFn: (data) => base44.entities.EventRegistration.update(reg.id, data),
    onSuccess: invalidate,
  });

  const generateBib = (forCategoryId) => {
    const targetCatId = forCategoryId || reg.category_id;
    const targetCat = catMap[targetCatId] || categories.find(c => c.id === targetCatId);
    const prefix = targetCat?.bib_prefix || 'R';
    const start  = targetCat?.bib_start  || 1;
    const usedBibs = new Set(
      registrations
        .filter(r => r.category_id === targetCatId && r.bib_number && r.id !== reg.id)
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

  const [bibError, setBibError] = useState('');

  const handleAssignBib = () => {
    const bib = bibInput.trim() || generateBib();
    const oldBib = reg.bib_number;
    // Duplicate check: reject if bib already taken in this category by another registration
    const isDuplicate = registrations.some(
      r => r.category_id === reg.category_id && r.bib_number === bib && r.id !== reg.id
    );
    if (isDuplicate) {
      setBibError(`Bib "${bib}" is already assigned in this category. Choose a different number.`);
      return;
    }
    setBibError('');
    update.mutate({ bib_number: bib }, {
      onSuccess: () => {
        logActivity({ eventId: eId, actorEmail, actionType: 'manual_bib_assign', targetType: 'registration', targetId: reg.id, summary: `Bib ${oldBib ? `reassigned from ${oldBib} to` : 'assigned as'} ${bib} for ${reg.first_name} ${reg.last_name}`, meta: { old_bib: oldBib || null, new_bib: bib } });
      }
    });
    setShowBibInput(false);
    setBibInput('');
  };

  // Manual override: change category (full admin only)
  const changeCategoryMutation = useMutation({
    mutationFn: async (catId) => {
      const newCat = categories.find(c => c.id === catId);
      const oldCat = cat;
      const newBib = generateBib(catId);
      await base44.entities.EventRegistration.update(reg.id, {
        category_id: catId,
        bib_number: newBib,
        item_selections: {},  // clear stale item_selections from old category
      });
      return { oldCat, newCat, newBib };
    },
    onSuccess: ({ oldCat, newCat, newBib }) => {
      logActivity({ eventId: eId, actorEmail, actionType: 'manual_category_change', targetType: 'registration', targetId: reg.id, summary: `Category changed from "${oldCat?.name || '?'}" to "${newCat?.name || '?'}" for ${reg.first_name} ${reg.last_name} (new bib: ${newBib})`, meta: { old_category_id: reg.category_id, new_category_id: newCat?.id, new_bib: newBib } });
      setShowCatSelect(false);
      setNewCatId('');
      invalidate();
    },
  });

  // Derived state
  const canCheckIn = reg.status === 'confirmed' && (reg.payment_status === 'paid' || reg.payment_status === 'not_required');
  const checkInBlockReason = !canCheckIn
    ? reg.status !== 'confirmed'
      ? 'Registration must be confirmed first'
      : 'Payment must be approved first'
    : null;

  const hasSelections = reg.item_selections && Object.keys(reg.item_selections).length > 0;
  const pay = resolvePaymentCfg(reg.payment_status, paymentNeedsAttention);

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
            paddingBottom: SHEET_CONTENT_PADDING_BOTTOM,
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
                const s = REG_STATUS_CFG[reg.status] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', label: reg.status };
                return <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: s.bg, color: s.color }}>{s.label}</span>;
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
                  label="✓ Confirm Registration"
                  variant="green"
                  disabled={reg.status === 'confirmed' || reg.status === 'rejected'}
                  loading={update.isPending}
                  onClick={() => withConfirm({
                    title: 'Confirm Registration?',
                    message: `Set ${reg.first_name} ${reg.last_name}'s registration to Confirmed.${reg.payment_status === 'pending' ? ' Note: payment is still pending — confirm only if payment was verified offline.' : ''}`,
                    confirmLabel: 'Confirm',
                    variant: 'green',
                    action: () => update.mutate({ status: 'confirmed' }, {
                      onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_registration_confirm', targetType: 'registration', targetId: reg.id, summary: `Confirmed registration for ${reg.first_name} ${reg.last_name}` })
                    }),
                  })}
                />
                {reg.status === 'confirmed' && <HINT>Registration is already Confirmed.</HINT>}

                <ACTION_BTN
                  label="✗ Reject Registration"
                  variant="red"
                  disabled={reg.status === 'rejected' || reg.status === 'cancelled'}
                  loading={update.isPending}
                  onClick={() => withConfirm({
                    title: 'Reject Registration?',
                    message: `${reg.first_name} ${reg.last_name}'s registration will be set to Rejected. This cannot be undone.`,
                    confirmLabel: 'Reject',
                    variant: 'red',
                    action: () => update.mutate({ status: 'rejected' }, {
                      onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_registration_reject', targetType: 'registration', targetId: reg.id, summary: `Rejected registration for ${reg.first_name} ${reg.last_name}` })
                    }),
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
                      <button onClick={() => { setShowBibInput(false); setBibError(''); }} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>Cancel</button>
                    </div>
                  )}
                  {bibError && <p style={{ fontSize: 11, color: 'rgba(255,80,80,0.85)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />{bibError}</p>}
                </div>

                {/* 3. Payment */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Payment</SECTION>
                  <ACTION_BTN
                    label="💳 Approve Payment"
                    variant="lime"
                    disabled={reg.payment_status === 'paid' || reg.payment_status === 'not_required'}
                    loading={update.isPending}
                    onClick={() => withConfirm({
                      title: 'Approve Payment Manually?',
                      message: `Mark payment as Payment Approved for ${reg.first_name} ${reg.last_name}. Use only when slip verification has been done offline.`,
                      confirmLabel: 'Approve Payment',
                      variant: 'lime',
                      action: () => update.mutate({ payment_status: 'paid', status: 'confirmed' }, {
                        onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_payment_approved', targetType: 'payment', targetId: reg.id, summary: `Manually approved payment for ${reg.first_name} ${reg.last_name}` })
                      }),
                    })}
                  />
                  {reg.payment_status === 'paid' && <HINT>Payment is already approved.</HINT>}
                  {reg.payment_status === 'not_required' && <HINT>No Payment Required for this registration.</HINT>}

                  <div style={{ marginTop: 6 }}>
                    <ACTION_BTN
                      label="⏳ Reset to Awaiting Payment"
                      variant="amber"
                      disabled={reg.payment_status === 'pending'}
                      loading={update.isPending}
                      onClick={() => withConfirm({
                        title: 'Reset Payment Status?',
                        message: 'This will reset payment to "Awaiting Payment". Use only to undo an accidental approval.',
                        confirmLabel: 'Reset',
                        variant: 'amber',
                        action: () => update.mutate({ payment_status: 'pending', status: 'pending' }, {
                          onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_payment_reset', targetType: 'payment', targetId: reg.id, summary: `Reset payment to Awaiting Payment for ${reg.first_name} ${reg.last_name}` })
                        }),
                      })}
                    />
                    {reg.payment_status === 'pending' && <HINT>Status is already Awaiting Payment.</HINT>}
                  </div>
                </div>

                {/* 4. Check-In */}
                <div style={{ marginTop: 4 }}>
                  <SECTION>Check-In</SECTION>
                  {!reg.checked_in ? (
                    <div>
                      <ACTION_BTN
                        label="📍 Check In Participant"
                        variant={canCheckIn ? 'lime' : 'muted'}
                        disabled={!canCheckIn}
                        loading={update.isPending}
                        onClick={() => withConfirm({
                          title: 'Check In Participant?',
                          message: `Mark ${reg.first_name} ${reg.last_name} as Checked In. This action will be timestamped.`,
                          confirmLabel: 'Check In',
                          variant: 'green',
                          action: () => update.mutate({ checked_in: true, checked_in_at: new Date().toISOString() }, {
                            onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_checkin_force', targetType: 'registration', targetId: reg.id, summary: `Force checked in ${reg.first_name} ${reg.last_name}` })
                          }),
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
                          message: `This will remove the Checked In status for ${reg.first_name} ${reg.last_name}. Use only to correct a mistake.`,
                          confirmLabel: 'Undo Check-In',
                          variant: 'red',
                          action: () => update.mutate({ checked_in: false, checked_in_at: null }, {
                            onSuccess: () => logActivity({ eventId: eId, actorEmail, actionType: 'manual_checkin_undo', targetType: 'registration', targetId: reg.id, summary: `Undid check-in for ${reg.first_name} ${reg.last_name}` })
                          }),
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

                {/* 6. Manual Overrides — Full Admin only */}
                {isFullAdmin && (
                  <div style={{ marginTop: 12 }}>
                    {/* Section header with shield icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 8px' }}>
                      <ShieldAlert style={{ width: 11, height: 11, color: 'rgba(138,43,226,0.7)' }} />
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(138,43,226,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                        Manual Overrides · Full Admin Only
                      </p>
                    </div>

                    <div style={{ background: 'rgba(138,43,226,0.04)', border: '1px solid rgba(138,43,226,0.18)', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Change Category */}
                      {eventCategories.length > 1 && (
                        <div>
                          {!showCatSelect ? (
                            <ACTION_BTN
                              label={`🔀 Change Category  ·  current: ${cat?.name || '?'}`}
                              variant="default"
                              onClick={() => { setShowCatSelect(true); setNewCatId(''); }}
                            />
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                                 A new bib will be auto-generated. Item selections will be cleared.
                               </p>
                              <select
                                value={newCatId}
                                onChange={e => setNewCatId(e.target.value)}
                                style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(138,43,226,0.3)', color: '#fff', fontSize: 13, outline: 'none', width: '100%' }}
                              >
                                <option value="">— Select new category —</option>
                                {eventCategories.filter(c => c.id !== reg.category_id).map(c => (
                                  <option key={c.id} value={c.id}>{c.name}{c.price > 0 ? ` (฿${c.price})` : ' (Free)'}</option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  disabled={!newCatId || changeCategoryMutation.isPending}
                                  onClick={() => withConfirm({
                                    title: 'Change Category?',
                                    message: `Move ${reg.first_name} ${reg.last_name} from "${cat?.name}" to "${eventCategories.find(c => c.id === newCatId)?.name}". A new bib will be auto-assigned. Item selections will be cleared — participant may need to re-select.`,
                                    confirmLabel: 'Change Category',
                                    variant: 'amber',
                                    action: () => changeCategoryMutation.mutate(newCatId),
                                  })}
                                  style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.35)', color: 'rgba(190,140,255,1)', fontSize: 13, fontWeight: 700, cursor: !newCatId ? 'not-allowed' : 'pointer', opacity: !newCatId ? 0.5 : 1 }}
                                >
                                  {changeCategoryMutation.isPending ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite', display: 'inline' }} /> : 'Confirm Change'}
                                </button>
                                <button
                                  onClick={() => setShowCatSelect(false)}
                                  style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, CheckCircle2, XCircle, Hash, CreditCard, QrCode, AlertCircle } from 'lucide-react';

const ROW = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 13, color: accent || 'rgba(255,255,255,0.85)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{value || '—'}</span>
  </div>
);

const ACTION_BTN = ({ label, onClick, disabled, variant = 'default', loading }) => {
  const styles = {
    default: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' },
    lime:    { background: 'rgba(191,255,0,0.1)',  border: '1px solid rgba(191,255,0,0.3)',  color: '#BFFF00' },
    green:   { background: 'rgba(0,210,110,0.1)',  border: '1px solid rgba(0,210,110,0.3)', color: 'rgb(0,210,110)' },
    amber:   { background: 'rgba(255,180,0,0.1)',  border: '1px solid rgba(255,180,0,0.3)', color: 'rgb(255,180,0)' },
    red:     { background: 'rgba(255,80,80,0.1)',  border: '1px solid rgba(255,80,80,0.25)', color: 'rgba(255,100,100,1)' },
    muted:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' },
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

export default function RegistrationDetailSheet({ reg, eventMap, catMap, registrations, onClose, onUpdated }) {
  const queryClient = useQueryClient();
  const [bibInput, setBibInput] = useState('');
  const [showBibInput, setShowBibInput] = useState(false);
  const [adminNotes, setAdminNotes] = useState(reg.admin_notes || '');

  const ev = eventMap[reg.event_id];
  const cat = catMap[reg.category_id];

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
    const start = cat?.bib_start || 1;
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

  // Check-in eligibility
  const canCheckIn = reg.status === 'confirmed' && (reg.payment_status === 'paid' || reg.payment_status === 'not_required');
  const checkInBlockReason = !canCheckIn
    ? reg.status !== 'confirmed'
      ? 'Registration must be confirmed first'
      : 'Payment must be approved first'
    : null;

  // Item selections
  const hasSelections = reg.item_selections && Object.keys(reg.item_selections).length > 0;

  // Payment status label
  const payLabel = {
    paid: 'Paid', not_required: 'Not Required',
    pending: 'Pending', refunded: 'Refunded',
  }[reg.payment_status] || reg.payment_status;

  return (
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
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Handle + close */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
        </div>
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

          {/* Status badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(() => {
              const s = { pending: ['rgba(255,200,80,0.12)', 'rgba(255,200,80,1)', 'Pending'], confirmed: ['rgba(0,210,110,0.12)', 'rgb(0,210,110)', 'Confirmed'], rejected: ['rgba(255,80,80,0.12)', 'rgba(255,100,100,1)', 'Rejected'], cancelled: ['rgba(255,80,80,0.12)', 'rgba(255,100,100,1)', 'Cancelled'] }[reg.status] || ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.5)', reg.status];
              return <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: s[0], color: s[1] }}>{s[2]}</span>;
            })()}
            {reg.checked_in && <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: 'rgba(191,255,0,0.12)', color: '#BFFF00' }}>✓ Checked In</span>}
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: reg.payment_status === 'paid' ? 'rgba(0,210,110,0.12)' : reg.payment_status === 'pending' ? 'rgba(255,180,0,0.12)' : 'rgba(255,255,255,0.06)', color: reg.payment_status === 'paid' ? 'rgb(0,210,110)' : reg.payment_status === 'pending' ? 'rgb(255,180,0)' : 'rgba(255,255,255,0.45)' }}>
              💳 {payLabel}
            </span>
          </div>

          {/* Details */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '4px 16px' }}>
            <ROW label="Event" value={ev?.title} />
            <ROW label="Category" value={cat?.name} accent="#BFFF00" />
            <ROW label="Bib" value={reg.bib_number} accent="#BFFF00" />
            <ROW label="QR Code" value={reg.qr_code} />
            <ROW label="Phone" value={reg.phone} />
            <ROW label="Date of Birth" value={reg.date_of_birth} />
            <ROW label="Gender" value={reg.gender} />
            <ROW label="Nationality" value={reg.nationality} />
            <ROW label="Blood Type" value={reg.blood_type} />
            {reg.emergency_contact_name && <ROW label="Emergency Contact" value={`${reg.emergency_contact_name}${reg.emergency_contact_phone ? ` · ${reg.emergency_contact_phone}` : ''}`} />}
            {reg.admin_notes && <ROW label="Admin Notes" value={reg.admin_notes} accent="rgba(255,180,0,0.9)" />}
          </div>

          {/* Item Selections */}
          {hasSelections && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Item Selections</p>
              {Object.entries(reg.item_selections).map(([itemId, val]) => (
                <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{itemId.slice(-6)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: val === 'included' ? 'rgba(255,255,255,0.5)' : '#BFFF00' }}>
                    {val === 'included' ? '✓ Included' : val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Approve */}
              <ACTION_BTN
                label="✓ Approve Registration"
                variant="green"
                disabled={reg.status === 'confirmed' || reg.status === 'rejected'}
                loading={update.isPending}
                onClick={() => update.mutate({ status: 'confirmed' })}
              />

              {/* Reject */}
              <ACTION_BTN
                label="✗ Reject Registration"
                variant="red"
                disabled={reg.status === 'rejected' || reg.status === 'cancelled'}
                loading={update.isPending}
                onClick={() => update.mutate({ status: 'rejected' })}
              />

              {/* Bib */}
              {!showBibInput ? (
                <ACTION_BTN
                  label={reg.bib_number ? `# Reassign Bib (current: ${reg.bib_number})` : '# Assign Bib'}
                  variant="amber"
                  loading={update.isPending}
                  onClick={() => { setBibInput(generateBib()); setShowBibInput(true); }}
                />
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={bibInput}
                    onChange={e => setBibInput(e.target.value)}
                    placeholder="e.g. R001"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,180,0,0.3)', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                  <button onClick={handleAssignBib} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.3)', color: 'rgb(255,180,0)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                    Save
                  </button>
                  <button onClick={() => setShowBibInput(false)} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Payment */}
              <ACTION_BTN
                label="💳 Mark Payment Approved"
                variant="lime"
                disabled={reg.payment_status === 'paid' || reg.payment_status === 'not_required'}
                loading={update.isPending}
                onClick={() => update.mutate({ payment_status: 'paid' })}
              />
              <ACTION_BTN
                label="⏳ Mark Payment Pending"
                variant="amber"
                disabled={reg.payment_status === 'pending'}
                loading={update.isPending}
                onClick={() => update.mutate({ payment_status: 'pending' })}
              />

              {/* Check-in */}
              {!reg.checked_in ? (
                <div>
                  <ACTION_BTN
                    label="📍 Confirm Check-In"
                    variant={canCheckIn ? 'lime' : 'muted'}
                    disabled={!canCheckIn}
                    loading={update.isPending}
                    onClick={() => update.mutate({ checked_in: true, checked_in_at: new Date().toISOString() })}
                  />
                  {checkInBlockReason && (
                    <p style={{ fontSize: 11, color: 'rgba(255,180,0,0.7)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} /> {checkInBlockReason}
                    </p>
                  )}
                </div>
              ) : (
                <ACTION_BTN
                  label="↩ Undo Check-In"
                  variant="red"
                  loading={update.isPending}
                  onClick={() => update.mutate({ checked_in: false, checked_in_at: null })}
                />
              )}

              {/* Admin Notes */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px' }}>Admin Notes</p>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
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
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Calendar, MapPin, User, CreditCard, ScanLine,
  CheckCircle2, Clock, XCircle, QrCode, Package,
  Phone, Droplets, AlertCircle, Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import PaymentUpload from './PaymentUpload';
import RewardSection from './RewardSection';
import PostEventResult from './PostEventResult';

// ─── QR canvas renderer ───────────────────────────────────────────────────────
function QRDisplay({ value, size = 180 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    const cellSize = size / 21;
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      return Math.abs(h);
    };
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    const seed = hash(value);
    for (let row = 0; row < 21; row++) {
      for (let col = 0; col < 21; col++) {
        const isCorner = (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
        let filled;
        if (isCorner) {
          filled = (row === 0 || row === 6 || col === 0 || col === 6 ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4));
        } else {
          filled = ((hash(value + row * 100 + col * 13) + seed) % 3 === 0);
        }
        if (filled) ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: size > 100 ? 14 : 8, display: 'block' }} />;
}

// ─── Fullscreen QR overlay ────────────────────────────────────────────────────
function QRFullscreen({ reg, event, category, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ padding: 16, background: 'white', borderRadius: 22, boxShadow: '0 0 60px rgba(191,255,0,0.2)' }}>
          <QRDisplay value={reg.qr_code} size={220} />
        </div>

        <div style={{
          width: '100%', maxWidth: 300, borderRadius: 18,
          background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.2)',
          padding: '14px 18px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
            {event?.title || 'Event'}
            {category ? ` · ${category.name}` : ''}
          </p>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#BFFF00', margin: '0 0 4px', textShadow: '0 0 20px rgba(191,255,0,0.4)' }}>
            {reg.bib_number || 'Pending'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            {[reg.first_name, reg.last_name].filter(Boolean).join(' ')}
          </p>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          {reg.qr_code}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 8, padding: '12px 32px', borderRadius: 14,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  );
}

// ─── Status configs ───────────────────────────────────────────────────────────
const REG_STATUS = {
  pending:   { label: 'Registration Submitted', color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)',  Icon: Clock },
  confirmed: { label: 'Confirmed',              color: '#BFFF00',             bg: 'rgba(191,255,0,0.1)',   border: 'rgba(191,255,0,0.25)',   Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled',              color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
  rejected:  { label: 'Rejected',               color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
};

// Payment states mapped clearly — pending means payment submitted awaiting admin review
const PAY_STATUS = {
  pending:      { label: 'Awaiting Payment Approval', color: 'rgba(255,200,80,1)',      bg: 'rgba(255,200,80,0.08)',   border: 'rgba(255,200,80,0.2)' },
  paid:         { label: 'Payment Approved',          color: 'rgb(0,210,110)',          bg: 'rgba(0,210,110,0.1)',    border: 'rgba(0,210,110,0.25)' },
  not_required: { label: 'No Payment Required',       color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  refunded:     { label: 'Refunded',                  color: 'rgba(138,43,226,0.9)',   bg: 'rgba(138,43,226,0.08)', border: 'rgba(138,43,226,0.2)' },
};

// ─── Info row — renders nothing if value is falsy ─────────────────────────────
function Row({ icon: Icon, label, value, children, last }) {
  // If only a value prop was passed and it's empty, render nothing
  if (value !== undefined && !value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <Icon style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          {label}
        </p>
        {value !== undefined && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '3px 0 0', wordBreak: 'break-word' }}>
            {value}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '18px 0 6px' }}>
      {children}
    </p>
  );
}

// ─── Badge pill ───────────────────────────────────────────────────────────────
function Badge({ label, color, bg, border, Icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 99,
      background: bg, border: `1px solid ${border}`,
      color, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </span>
  );
}

// ─── Payment state callout ────────────────────────────────────────────────────
function PaymentCallout({ paymentStatus }) {
  // Show a prominent callout when payment is still awaiting
  const needsPayment = paymentStatus === 'not_required' ? false : paymentStatus !== 'paid';
  if (!needsPayment) return null;

  const isAwaitingApproval = paymentStatus === 'pending';
  const color = isAwaitingApproval ? 'rgba(255,200,80,1)' : 'rgba(255,140,60,1)';
  const bg = isAwaitingApproval ? 'rgba(255,200,80,0.06)' : 'rgba(255,140,60,0.06)';
  const border = isAwaitingApproval ? 'rgba(255,200,80,0.2)' : 'rgba(255,140,60,0.2)';
  const msg = isAwaitingApproval
    ? 'Your payment slip has been submitted and is awaiting admin approval.'
    : 'Payment is required to confirm your registration.';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px', borderRadius: 12,
      background: bg, border: `1px solid ${border}`,
      marginBottom: 4,
    }}>
      <AlertCircle style={{ width: 14, height: 14, color, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 12, color, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{msg}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TicketDetail({ reg, event, category, onClose, onRemoved }) {
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const queryClient = useQueryClient();

  const isExpired = reg && event?.event_date ? new Date(event.event_date) < new Date() : false;

  const removeMutation = useMutation({
    mutationFn: () => base44.entities.EventRegistration.update(reg?.id, { status: 'cancelled' }),
    onSuccess: () => { if (onRemoved) onRemoved(); },
  });

  const { data: categoryItems = [] } = useQuery({
    queryKey: ['cat-items-ticket', reg?.category_id],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: reg.category_id }),
    enabled: !!reg?.category_id && !!reg?.item_selections && Object.keys(reg?.item_selections || {}).length > 0,
  });

  if (!reg) return null;



  const isCancelled = reg.status === 'cancelled' || reg.status === 'rejected';
  const isConfirmed = reg.status === 'confirmed';
  const regCfg = REG_STATUS[reg.status] || REG_STATUS.pending;

  // Determine correct payment state label:
  // payment_status='pending' means slip uploaded, awaiting approval
  // no slip yet = still "Awaiting Payment" (use a derived key)
  const paymentState = reg.payment_status || 'not_required';
  const payCfg = PAY_STATUS[paymentState] || PAY_STATUS.not_required;

  const hasQR = !!reg.qr_code && !isCancelled;
  const userName = [reg.first_name, reg.last_name].filter(Boolean).join(' ') || '—';
  const needsPayment = category?.price > 0 && paymentState !== 'paid' && !isCancelled;


  const itemNameMap = Object.fromEntries(categoryItems.map(i => [i.id, i.name]));

  // Only show items that have a resolved name (filter out stale/unknown ids)
  const resolvedItems = reg.item_selections
    ? Object.entries(reg.item_selections).filter(([id]) => !!itemNameMap[id])
    : [];
  const hasItems = resolvedItems.length > 0;

  // Conditional participant fields
  const hasPhone = !!reg.phone;
  const hasBloodType = !!reg.blood_type && reg.blood_type !== 'unknown';
  const hasEmergencyName = !!reg.emergency_contact_name;
  const hasEmergencyPhone = !!reg.emergency_contact_phone;
  const hasEmergency = hasEmergencyName || hasEmergencyPhone;
  const hasAnyExtra = hasPhone || hasBloodType || hasEmergency;

  const accentBorder = isConfirmed ? 'rgba(191,255,0,0.3)' : 'rgba(255,255,255,0.1)';

  return (
    <>
      {/* ── BACKDROP + SHEET ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 560,
            background: 'linear-gradient(180deg, #0f0f14 0%, #0a0a0a 100%)',
            borderTopLeftRadius: 26, borderTopRightRadius: 26,
            borderTop: `1.5px solid ${accentBorder}`,
            borderLeft: `1px solid rgba(255,255,255,0.06)`,
            borderRight: `1px solid rgba(255,255,255,0.06)`,
            // maxHeight leaves room so it clearly sits above the page (no overlap)
            maxHeight: 'calc(100dvh - 56px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
          </div>

          {/* Sheet header — "My Ticket" + close */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
              My Ticket
            </p>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.55)' }} />
            </button>
          </div>

          {/* ── CONTENT ── */}
          <div style={{ padding: '16px 20px 0' }}>

            {/* ── COVER IMAGE (if available) ── */}
            {(() => {
              const coverImage = event?.cover_image || event?.banner_url || event?.event_image || event?.image || event?.banner_image;
              if (!coverImage) return null;
              const isOfficial = event?.event_type === 'official' || !event?.group_id;
              const tint = isOfficial ? 'rgba(191,255,0,0.05)' : 'rgba(138,43,226,0.07)';
              return (
                <div style={{ position: 'relative', height: 96, borderRadius: 18, overflow: 'hidden', marginBottom: 14 }}>
                  <img src={coverImage} alt={event?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.65) saturate(0.75)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,12,0.5)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,12,0.92) 0%, rgba(8,8,12,0.25) 55%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: tint }} />
                  <p style={{ position: 'absolute', bottom: 11, left: 14, fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.95)', maxWidth: '80%', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
                    {event?.title}
                  </p>
                </div>
              );
            })()}

            {/* ── TICKET CARD ── */}
            <div style={{
              borderRadius: 20, overflow: 'hidden', background: '#111114',
              border: `1px solid ${isConfirmed ? 'rgba(191,255,0,0.2)' : 'rgba(255,255,255,0.08)'}`,
              marginBottom: 18,
              boxShadow: isConfirmed ? '0 0 32px rgba(191,255,0,0.06)' : 'none',
            }}>
              {/* Banner */}
              <div style={{ position: 'relative', height: 96 }}>
                {event?.banner_image
                  ? <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(138,43,226,0.5), rgba(191,255,0,0.18))' }} />
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111114 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <Badge label={regCfg.label} color={regCfg.color} bg={regCfg.bg} border={regCfg.border} Icon={regCfg.Icon} />
                </div>
                {reg.checked_in && (
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <Badge label="✓ Checked In" color="#BFFF00" bg="rgba(191,255,0,0.15)" border="rgba(191,255,0,0.4)" />
                  </div>
                )}
              </div>

              {/* Event name + category */}
              <div style={{ padding: '6px 16px 12px' }}>
                <p style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 2px', lineHeight: 1.25 }}>
                  {event?.title || '—'}
                </p>
                {category && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: category.color || '#BFFF00', margin: 0, letterSpacing: '0.04em' }}>
                    {category.name}{category.distance_km ? ` · ${category.distance_km} km` : ''}
                  </p>
                )}
              </div>

              {/* Tear line */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginLeft: -8, background: '#0A0A0A' }} />
                <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.08)' }} />
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginRight: -8, background: '#0A0A0A' }} />
              </div>

              {/* Bib + QR row */}
              <div style={{ padding: '14px 16px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 3px' }}>
                    Bib Number
                  </p>
                  <p style={{
                    fontSize: reg.bib_number ? 50 : 32,
                    fontWeight: 900, lineHeight: 1, margin: 0,
                    color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.15)',
                    textShadow: reg.bib_number ? '0 0 22px rgba(191,255,0,0.35)' : 'none',
                    letterSpacing: '-1px',
                  }}>
                    {reg.bib_number || 'Pending'}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>{userName}</p>
                </div>

                {/* Tappable inline QR */}
                {hasQR ? (
                  <button
                    onClick={() => setShowQRFullscreen(true)}
                    style={{
                      flexShrink: 0, position: 'relative',
                      padding: 7, background: 'white', borderRadius: 12,
                      border: 'none', cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <QRDisplay value={reg.qr_code} size={76} />
                    {/* Enlarge hint overlay */}
                    <div style={{
                      position: 'absolute', bottom: 4, right: 4,
                      width: 18, height: 18, borderRadius: 5,
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Maximize2 style={{ width: 9, height: 9, color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                  </button>
                ) : (
                  <div style={{
                    width: 76, height: 76, borderRadius: 12,
                    border: '1px dashed rgba(255,255,255,0.1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    flexShrink: 0,
                  }}>
                    <QrCode style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontWeight: 700 }}>NO QR</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── STATUS SECTION ── */}
            <Section>Status</Section>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 14px' }}>
              <Row icon={regCfg.Icon} label="Registration">
                <Badge label={regCfg.label} color={regCfg.color} bg={regCfg.bg} border={regCfg.border} />
              </Row>
              <Row icon={CreditCard} label="Payment">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 3 }}>
                  <Badge label={payCfg.label} color={payCfg.color} bg={payCfg.bg} border={payCfg.border} />
                  {reg.payment_reference && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Ref: {reg.payment_reference}</p>
                  )}
                </div>
              </Row>
              {reg.checked_in && (
                <Row icon={ScanLine} label="Check-In" last>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 3 }}>
                    <Badge label="✓ Checked In" color="#BFFF00" bg="rgba(191,255,0,0.1)" border="rgba(191,255,0,0.3)" />
                    {reg.checked_in_at && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        {format(new Date(reg.checked_in_at), 'h:mm a · EEE MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </Row>
              )}
            </div>

            {/* ── PAYMENT UPLOAD (when payment still required) ── */}
            {needsPayment && (
              <>
                <Section>Payment</Section>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PaymentCallout paymentStatus={paymentState} />
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                    <PaymentUpload registration={reg} category={category} />
                  </div>
                </div>
              </>
            )}

            {/* ── EVENT DETAILS ── */}
            <Section>Event Details</Section>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 14px' }}>
              {event?.event_date && (
                <Row icon={Calendar} label="Date"
                  value={`${format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}${event.start_time ? ` · ${event.start_time}` : ''}`}
                />
              )}
              {event?.location_name && (
                <Row icon={MapPin} label="Location">
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '3px 0 0' }}>{event.location_name}</p>
                  {event.location_address && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{event.location_address}</p>
                  )}
                </Row>
              )}
              {event?.organizer_name && (
                <Row icon={User} label="Organizer" value={event.organizer_name} last />
              )}
            </div>

            {/* ── ITEM SELECTIONS (only when resolved items exist) ── */}
            {hasItems && (
              <>
                <Section>Your Items</Section>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 14px' }}>
                  {resolvedItems.map(([itemId, val], idx) => {
                    const name = itemNameMap[itemId];
                    const isIncluded = val === 'included';
                    const isLast = idx === resolvedItems.length - 1;
                    return (
                      <div key={itemId} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0',
                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{name}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 6,
                          background: isIncluded ? 'rgba(255,255,255,0.05)' : 'rgba(191,255,0,0.1)',
                          color: isIncluded ? 'rgba(255,255,255,0.4)' : '#BFFF00',
                        }}>
                          {isIncluded ? 'Included' : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── PARTICIPANT INFO (only rows with data) ── */}
            {hasAnyExtra && (
              <>
                <Section>Participant</Section>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 14px' }}>
                  {hasPhone && <Row icon={Phone} label="Phone" value={reg.phone} />}
                  {hasBloodType && <Row icon={Droplets} label="Blood Type" value={reg.blood_type} />}
                  {hasEmergency && (
                    <Row icon={AlertCircle} label="Emergency Contact" last>
                      {hasEmergencyName && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '3px 0 0' }}>{reg.emergency_contact_name}</p>
                      )}
                      {hasEmergencyPhone && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{reg.emergency_contact_phone}</p>
                      )}
                    </Row>
                  )}
                </div>
              </>
            )}

            {/* Post-event result */}
            {isConfirmed && event && (
              <PostEventResult registrationId={reg.id} userEmail={reg.user_email} event={event} />
            )}

            {/* Rewards */}
            {reg.checked_in && (
              <RewardSection registrationId={reg.id} userEmail={reg.user_email} />
            )}

            {/* Remove from My Tickets — only for past/expired events */}
            {isExpired && (
              <div style={{ marginTop: 24, paddingBottom: 8 }}>
                {!confirmRemove ? (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    style={{ width: '100%', padding: '12px 0', borderRadius: 14, background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,100,100,0.8)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove from My Tickets
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px', borderRadius: 14, background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)' }}>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>This will remove the ticket from your list. Are you sure?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => removeMutation.mutate()}
                        disabled={removeMutation.isPending}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: 'rgba(255,100,100,1)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        {removeMutation.isPending && <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,100,100,0.5)', borderTopColor: 'rgba(255,100,100,1)', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />}
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmRemove(false)}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
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
      </div>

      {/* ── QR FULLSCREEN OVERLAY ── */}
      {showQRFullscreen && hasQR && (
        <QRFullscreen
          reg={reg}
          event={event}
          category={category}
          onClose={() => setShowQRFullscreen(false)}
        />
      )}
    </>
  );
}
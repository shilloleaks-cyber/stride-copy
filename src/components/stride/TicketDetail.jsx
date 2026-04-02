import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  X, Calendar, MapPin, User, CreditCard, ScanLine,
  CheckCircle2, Clock, XCircle, QrCode, Package, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import PaymentUpload from './PaymentUpload';
import RewardSection from './RewardSection';
import PostEventResult from './PostEventResult';

// ─── QR visual (same as QRModal) ─────────────────────────────────────────────
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
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 10, display: 'block' }} />;
}

// ─── Status configs ───────────────────────────────────────────────────────────
const REG_STATUS = {
  pending:   { label: 'Registration Submitted', color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)',  Icon: Clock },
  confirmed: { label: 'Confirmed',              color: '#BFFF00',             bg: 'rgba(191,255,0,0.1)',   border: 'rgba(191,255,0,0.25)',   Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled',              color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
  rejected:  { label: 'Rejected',               color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)',    Icon: XCircle },
};

const PAY_STATUS = {
  pending:      { label: 'Awaiting Payment',          color: 'rgba(255,200,80,1)',      bg: 'rgba(255,200,80,0.08)',   border: 'rgba(255,200,80,0.2)' },
  paid:         { label: 'Payment Approved',          color: 'rgb(0,210,110)',          bg: 'rgba(0,210,110,0.1)',    border: 'rgba(0,210,110,0.25)' },
  not_required: { label: 'Free Entry',                color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  refunded:     { label: 'Refunded',                  color: 'rgba(138,43,226,0.9)',   bg: 'rgba(138,43,226,0.08)', border: 'rgba(138,43,226,0.2)' },
};

// ─── Info row ─────────────────────────────────────────────────────────────────
function Row({ icon: Icon, label, value, valueColor, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
        {value !== undefined && (
          <p style={{ fontSize: 13, fontWeight: 600, color: valueColor || 'rgba(255,255,255,0.85)', margin: '3px 0 0', wordBreak: 'break-word' }}>{value || '—'}</p>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '20px 0 4px' }}>
      {children}
    </p>
  );
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Badge({ label, color, bg, border, Icon }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, background: bg, border: `1px solid ${border}`, color, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {Icon && <Icon style={{ width: 11, height: 11 }} />}
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TicketDetail({ reg, event, category, onClose }) {
  if (!reg) return null;

  const isCancelled = reg.status === 'cancelled' || reg.status === 'rejected';
  const isConfirmed = reg.status === 'confirmed';
  const regCfg = REG_STATUS[reg.status] || REG_STATUS.pending;
  const payCfg = PAY_STATUS[reg.payment_status] || PAY_STATUS.pending;
  const hasQR = !!reg.qr_code && !isCancelled;
  const userName = [reg.first_name, reg.last_name].filter(Boolean).join(' ') || '—';

  // Fetch CategoryItems to resolve item_selections keys → human-readable names
  const { data: categoryItems = [] } = useQuery({
    queryKey: ['cat-items-ticket', reg.category_id],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: reg.category_id }),
    enabled: !!reg.category_id && !!reg.item_selections && Object.keys(reg.item_selections || {}).length > 0,
  });
  const itemNameMap = Object.fromEntries(categoryItems.map(i => [i.id, i.name]));

  const hasSelections = reg.item_selections && Object.keys(reg.item_selections).length > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'linear-gradient(180deg, #0f0f14 0%, #0a0a0a 100%)',
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderTop: `1.5px solid ${isConfirmed ? 'rgba(191,255,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
          maxHeight: '92dvh', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            My Ticket
          </p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        <div style={{ padding: '12px 20px 0' }}>

          {/* ── TICKET HEADER ── */}
          <div style={{ borderRadius: 20, overflow: 'hidden', background: '#111114', border: `1px solid ${isConfirmed ? 'rgba(191,255,0,0.22)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 20 }}>

            {/* Banner */}
            <div style={{ position: 'relative', height: 100 }}>
              {event?.banner_image
                ? <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(138,43,226,0.5), rgba(191,255,0,0.2))' }} />
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111114 0%, transparent 60%)' }} />
              {/* Status badge on banner */}
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <Badge label={regCfg.label} color={regCfg.color} bg={regCfg.bg} border={regCfg.border} Icon={regCfg.Icon} />
              </div>
              {reg.checked_in && (
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <Badge label="✓ Checked In" color="#BFFF00" bg="rgba(191,255,0,0.15)" border="rgba(191,255,0,0.4)" />
                </div>
              )}
            </div>

            {/* Event + Category name */}
            <div style={{ padding: '6px 16px 14px' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 3px', lineHeight: 1.2 }}>{event?.title || '—'}</p>
              {category && (
                <p style={{ fontSize: 12, fontWeight: 700, color: category.color || '#BFFF00', margin: 0, letterSpacing: '0.04em' }}>
                  {category.name}{category.distance_km ? ` · ${category.distance_km} km` : ''}
                </p>
              )}
            </div>

            {/* Tear line */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginLeft: -9, background: '#0A0A0A' }} />
              <div style={{ flex: 1, borderTop: '2px dashed rgba(255,255,255,0.09)' }} />
              <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginRight: -9, background: '#0A0A0A' }} />
            </div>

            {/* Bib + QR row */}
            <div style={{ padding: '16px 16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  Bib Number
                </p>
                <p style={{
                  fontSize: reg.bib_number ? 52 : 36,
                  fontWeight: 900, lineHeight: 1, margin: 0,
                  color: reg.bib_number ? '#BFFF00' : 'rgba(255,255,255,0.15)',
                  textShadow: reg.bib_number ? '0 0 24px rgba(191,255,0,0.4)' : 'none',
                  letterSpacing: '-1px',
                }}>
                  {reg.bib_number || 'Pending'}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>{userName}</p>
              </div>
              {/* QR Code inline */}
              {hasQR && (
                <div style={{ flexShrink: 0, padding: 8, background: 'white', borderRadius: 14 }}>
                  <QRDisplay value={reg.qr_code} size={80} />
                </div>
              )}
              {!hasQR && (
                <div style={{ width: 80, height: 80, borderRadius: 14, border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                  <QrCode style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.12)' }} />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>NO QR</span>
                </div>
              )}
            </div>
          </div>

          {/* ── STATUS SECTION ── */}
          <Section>Status</Section>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '8px 14px' }}>
            <Row icon={regCfg.Icon} label="Registration">
              <Badge label={regCfg.label} color={regCfg.color} bg={regCfg.bg} border={regCfg.border} />
            </Row>
            <Row icon={CreditCard} label="Payment">
              <Badge label={payCfg.label} color={payCfg.color} bg={payCfg.bg} border={payCfg.border} />
              {reg.payment_reference && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Ref: {reg.payment_reference}</p>
              )}
            </Row>
            {reg.checked_in && (
              <Row icon={ScanLine} label="Check-In">
                <div>
                  <Badge label="✓ Checked In" color="#BFFF00" bg="rgba(191,255,0,0.1)" border="rgba(191,255,0,0.3)" />
                  {reg.checked_in_at && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '5px 0 0' }}>
                      {format(new Date(reg.checked_in_at), 'h:mm a · EEE MMM d, yyyy')}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'rgba(191,255,0,0.5)', margin: '3px 0 0' }}>You have already checked in.</p>
                </div>
              </Row>
            )}
          </div>

          {/* ── EVENT DETAILS ── */}
          <Section>Event Details</Section>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '8px 14px' }}>
            {event?.event_date && (
              <Row icon={Calendar} label="Date"
                value={`${format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}${event.start_time ? ` · ${event.start_time}` : ''}`}
              />
            )}
            {event?.location_name && (
              <Row icon={MapPin} label="Location">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '3px 0 0' }}>{event.location_name}</p>
                {event.location_address && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{event.location_address}</p>}
              </Row>
            )}
            {event?.organizer_name && (
              <Row icon={User} label="Organizer" value={event.organizer_name} />
            )}
          </div>

          {/* ── ITEM SELECTIONS ── */}
          {hasSelections && (
            <>
              <Section>Your Items</Section>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '8px 14px' }}>
                {Object.entries(reg.item_selections).map(([itemId, val]) => {
                  const name = itemNameMap[itemId] || itemId;
                  const isIncluded = val === 'included';
                  return (
                    <div key={itemId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{name}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 6,
                        background: isIncluded ? 'rgba(255,255,255,0.06)' : 'rgba(191,255,0,0.1)',
                        color: isIncluded ? 'rgba(255,255,255,0.45)' : '#BFFF00',
                      }}>
                        {isIncluded ? 'Included' : val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── PARTICIPANT INFO ── */}
          <Section>Participant</Section>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '8px 14px' }}>
            <Row icon={User} label="Name" value={userName} />
            {reg.phone && <Row icon={Hash} label="Phone" value={reg.phone} />}
            {reg.blood_type && reg.blood_type !== 'unknown' && <Row icon={Hash} label="Blood Type" value={reg.blood_type} />}
            {reg.emergency_contact_name && (
              <Row icon={Hash} label="Emergency Contact"
                value={`${reg.emergency_contact_name}${reg.emergency_contact_phone ? ` · ${reg.emergency_contact_phone}` : ''}`}
              />
            )}
          </div>

          {/* ── PAYMENT UPLOAD ── */}
          {category?.price > 0 && reg.payment_status !== 'paid' && !isCancelled && (
            <>
              <Section>Payment</Section>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
                <PaymentUpload registration={reg} category={category} />
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

        </div>
      </div>
    </div>
  );
}
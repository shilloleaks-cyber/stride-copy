import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';

// ── Minimal QR canvas renderer ──────────────────────────────────────────────
function QRDisplay({ value, size = 140 }) {
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
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 10, display: 'block' }} />;
}

const STATUS_CFG = {
  pending:   { label: 'Pending',    color: 'rgba(255,200,80,1)',  bg: 'rgba(255,200,80,0.12)',  Icon: Clock },
  confirmed: { label: 'Confirmed',  color: '#BFFF00',            bg: 'rgba(191,255,0,0.12)',   Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled',  color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.1)',  Icon: XCircle },
  rejected:  { label: 'Rejected',   color: 'rgba(255,80,80,0.9)', bg: 'rgba(255,80,80,0.1)',  Icon: XCircle },
};

export default function PremiumTicketCard({ reg, event, category }) {
  const isOfficial = event?.event_type === 'official' || !event?.group_id;
  const cfg = STATUS_CFG[reg.status] || STATUS_CFG.pending;
  const isConfirmed = reg.status === 'confirmed';
  const isCancelled = reg.status === 'cancelled' || reg.status === 'rejected';
  const hasQR = !!reg.qr_code && !isCancelled;

  // Glow style based on type and status
  const officialGlow = isConfirmed
    ? '0 0 60px rgba(191,255,0,0.12), 0 0 120px rgba(138,43,226,0.08), 0 8px 40px rgba(0,0,0,0.7)'
    : '0 0 40px rgba(138,43,226,0.08), 0 8px 32px rgba(0,0,0,0.6)';
  const groupGlow = isConfirmed
    ? '0 0 50px rgba(138,43,226,0.14), 0 8px 36px rgba(0,0,0,0.7)'
    : '0 0 30px rgba(138,43,226,0.06), 0 8px 28px rgba(0,0,0,0.55)';

  const cardBorderColor = isCancelled
    ? 'rgba(255,80,80,0.18)'
    : isConfirmed
      ? isOfficial ? 'rgba(191,255,0,0.2)' : 'rgba(138,43,226,0.3)'
      : 'rgba(255,255,255,0.08)';

  const cardGlow = isOfficial ? officialGlow : groupGlow;

  const typeBadge = isOfficial
    ? { label: 'Official', color: '#BFFF00', bg: 'rgba(191,255,0,0.1)', border: 'rgba(191,255,0,0.25)' }
    : { label: 'Group', color: 'rgba(180,120,255,1)', bg: 'rgba(138,43,226,0.12)', border: 'rgba(138,43,226,0.3)' };

  const accentLine = isOfficial
    ? 'linear-gradient(90deg, transparent, rgba(191,255,0,0.6), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(138,43,226,0.7), transparent)';

  return (
    <div style={{
      borderRadius: 28,
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #141418 0%, #0e0e12 60%, #0a0a0e 100%)',
      border: `1px solid ${cardBorderColor}`,
      boxShadow: cardGlow,
      width: '100%',
      maxWidth: 360,
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* Top accent line */}
      <div style={{ height: 1, background: accentLine, opacity: 0.7 }} />

      {/* Header */}
      <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            BOOMX TICKET
          </p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2, maxWidth: 220 }}>
            {event?.title || '—'}
          </p>
          {event?.event_date && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '5px 0 0', fontWeight: 600 }}>
              {format(new Date(event.event_date), 'EEE, MMM d yyyy')}
              {event.start_time && <span style={{ color: 'rgba(255,255,255,0.25)' }}> · {event.start_time}</span>}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, paddingTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: typeBadge.bg, border: `1px solid ${typeBadge.border}`, color: typeBadge.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {typeBadge.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Dashed tear line */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '0 0' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0A0A0A', flexShrink: 0, marginLeft: -9, zIndex: 1 }} />
        <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.07)' }} />
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0A0A0A', flexShrink: 0, marginRight: -9, zIndex: 1 }} />
      </div>

      {/* QR center section */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {hasQR ? (
          <div style={{ padding: 10, background: 'white', borderRadius: 16, boxShadow: isOfficial ? '0 0 30px rgba(191,255,0,0.15)' : '0 0 30px rgba(138,43,226,0.2)' }}>
            <QRDisplay value={reg.qr_code} size={140} />
          </div>
        ) : (
          <div style={{
            width: 160, height: 160, borderRadius: 16,
            border: '1.5px dashed rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <p style={{ fontSize: 28, margin: 0 }}>🎟</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 700, margin: 0 }}>
              {isCancelled ? 'CANCELLED' : 'PENDING'}
            </p>
          </div>
        )}
      </div>

      {/* Dashed tear line */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0A0A0A', flexShrink: 0, marginLeft: -9, zIndex: 1 }} />
        <div style={{ flex: 1, borderTop: '1.5px dashed rgba(255,255,255,0.07)' }} />
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0A0A0A', flexShrink: 0, marginRight: -9, zIndex: 1 }} />
      </div>

      {/* Meta footer */}
      <div style={{ padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
        <MetaCell label="Category" value={category?.name || '—'} accent={category?.color} />
        <MetaCell label="BIB" value={reg.bib_number || '—'} accent={isConfirmed ? '#BFFF00' : undefined} glow={!!reg.bib_number && isConfirmed} />
        <MetaCell label="Location" value={event?.location_name || '—'} />
        <MetaCell label="Status" value={cfg.label} accent={cfg.color} />
      </div>

      {/* Checked-in overlay badge */}
      {reg.checked_in && (
        <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(191,255,0,0.15)', border: '1px solid rgba(191,255,0,0.35)' }}>
          <CheckCircle2 style={{ width: 10, height: 10, color: '#BFFF00' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#BFFF00' }}>CHECKED IN</span>
        </div>
      )}
    </div>
  );
}

function MetaCell({ label, value, accent, glow }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{
        fontSize: 13, fontWeight: 800, margin: 0,
        color: accent || 'rgba(255,255,255,0.7)',
        textShadow: glow ? '0 0 16px rgba(191,255,0,0.4)' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value}
      </p>
    </div>
  );
}
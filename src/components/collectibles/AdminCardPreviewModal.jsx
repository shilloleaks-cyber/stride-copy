import React, { useState } from 'react';
import { X, RotateCcw, Copy, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const RARITY = {
  common:    { label: 'Common',    color: 'rgba(180,180,180,1)', border: 'rgba(180,180,180,0.3)', glow: 'rgba(180,180,180,0.15)' },
  rare:      { label: 'Rare',      color: 'rgba(80,160,255,1)',  border: 'rgba(80,160,255,0.4)',  glow: 'rgba(80,160,255,0.2)' },
  epic:      { label: 'Epic',      color: 'rgba(180,80,255,1)',  border: 'rgba(180,80,255,0.4)',  glow: 'rgba(180,80,255,0.2)' },
  legendary: { label: 'Legendary', color: '#FFD700',             border: 'rgba(255,215,0,0.5)',   glow: 'rgba(255,215,0,0.2)' },
  founder:   { label: 'Founder',   color: '#C8FF00',             border: 'rgba(200,255,0,0.5)',   glow: 'rgba(200,255,0,0.2)' },
  sponsor:   { label: 'Sponsor',   color: '#00e676',             border: 'rgba(0,230,118,0.4)',   glow: 'rgba(0,230,118,0.2)' },
};

const C = {
  lime: '#C8FF00',
  limeDim: 'rgba(200,255,0,0.08)',
  limeBorder: 'rgba(200,255,0,0.25)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.1)',
  purpleBorder: 'rgba(168,85,247,0.3)',
  muted: 'rgba(255,255,255,0.38)',
  line: 'rgba(255,255,255,0.08)',
};

const SOURCE_LABEL = { event: 'Event', purchase: 'Purchase', mission: 'Mission', sponsor: 'Sponsor', admin: 'Admin' };

const STATUS_CFG = {
  draft:       { label: 'Draft',       color: '#FFD700',             border: 'rgba(255,215,0,0.3)',    bg: 'rgba(255,215,0,0.08)' },
  coming_soon: { label: 'Coming Soon', color: '#A855F7',             border: 'rgba(168,85,247,0.3)',   bg: 'rgba(168,85,247,0.1)' },
  published:   { label: 'Live',        color: 'rgba(80,200,120,1)',  border: 'rgba(80,200,120,0.3)',   bg: 'rgba(80,200,120,0.08)' },
  archived:    { label: 'Archived',    color: 'rgba(150,150,150,1)', border: 'rgba(150,150,150,0.25)', bg: 'rgba(150,150,150,0.06)' },
};

function DefaultCardBack() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0D0D0D 0%, #1a0a2e 50%, #0D0D0D 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(200,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.04) 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />
      <div style={{ position: 'absolute', inset: 20, borderRadius: 16, border: '1px solid rgba(200,255,0,0.15)', boxShadow: 'inset 0 0 30px rgba(138,43,226,0.15)' }} />
      {[{ top: 24, left: 24 }, { top: 24, right: 24 }, { bottom: 24, left: 24 }, { bottom: 24, right: 24 }].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 16, height: 16,
          borderTop: i < 2 ? '2px solid rgba(200,255,0,0.5)' : 'none',
          borderBottom: i >= 2 ? '2px solid rgba(200,255,0,0.5)' : 'none',
          borderLeft: (i === 0 || i === 2) ? '2px solid rgba(200,255,0,0.5)' : 'none',
          borderRight: (i === 1 || i === 3) ? '2px solid rgba(200,255,0,0.5)' : 'none',
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.35em', color: 'rgba(200,255,0,0.9)', textTransform: 'uppercase', marginBottom: 6, textShadow: '0 0 20px rgba(200,255,0,0.6)' }}>BOOMX</div>
        <div style={{ width: 48, height: 48, margin: '0 auto', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.4) 0%, rgba(200,255,0,0.1) 70%, transparent 100%)', border: '1.5px solid rgba(200,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 24px rgba(200,255,0,0.2), 0 0 40px rgba(138,43,226,0.2)' }}>✦</div>
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Collectibles</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const isLong = String(value).length > 6;
  return (
    <div style={{
      flex: '1 1 calc(50% - 5px)', minWidth: 0, textAlign: 'center',
      padding: '14px 10px', background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: isLong ? 14 : 26, fontWeight: 900, color: accent || '#fff', margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

export default function AdminCardPreviewModal({ card, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const r = RARITY[card?.rarity] || RARITY.common;
  const frontImg = card?.front_image_url || card?.image_url;
  const backImg = card?.back_image_url;

  const { data: userCards = [] } = useQuery({
    queryKey: ['admin-preview-usercards', card.id],
    queryFn: () => base44.entities.UserCards.filter({ card_id: card.id }),
  });

  const { data: claimTokens = [] } = useQuery({
    queryKey: ['admin-preview-tokens', card.id],
    queryFn: () => base44.entities.ClaimTokens.filter({ card_id: card.id }),
  });

  const activeTokens = claimTokens.filter(t => !t.is_used && (!t.expires_at || new Date(t.expires_at) > new Date()));

  const claimed = userCards.length;
  const maxSupply = card.max_supply || 0;
  const supplyDisplay = maxSupply > 0 ? maxSupply : 'Unlimited';
  const remainingDisplay = maxSupply > 0 ? Math.max(0, maxSupply - claimed) : 'Unlimited';
  const remaining = maxSupply > 0 ? Math.max(0, maxSupply - claimed) : null;

  // Supply progress bar %
  const progressPct = maxSupply > 0 ? Math.min(100, (claimed / maxSupply) * 100) : 0;

  const handleCopyId = () => {
    navigator.clipboard.writeText(card.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Status
  const soldOut = maxSupply > 0 && claimed >= maxSupply;
  const cardStatus = soldOut ? null : (card.status || 'draft');
  const statusCfg = soldOut
    ? { label: 'Sold Out', color: 'rgba(255,80,80,0.9)', border: 'rgba(255,80,80,0.25)', bg: 'rgba(255,80,80,0.08)' }
    : STATUS_CFG[cardStatus] || STATUS_CFG.draft;
  const qrBlocked = !soldOut && cardStatus !== 'published';

  // Serial example
  const digits = card.serial_digits || 4;
  const serialExample = card.serial_prefix
    ? `${card.serial_prefix}-${'47'.padStart(digits, '0')}`
    : null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, background: '#111',
          borderRadius: '28px 28px 0 0',
          border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
          padding: '0 0 48px',
          maxHeight: '94dvh', overflowY: 'auto',
          boxShadow: `0 -20px 60px rgba(0,0,0,0.5), 0 0 40px ${r.glow}`,
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: '16px 20px 0', position: 'sticky', top: 0, background: '#111', zIndex: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,255,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Card Preview</p>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          {/* Card flip */}
          <div
            style={{ width: 180, margin: '0 auto 16px', aspectRatio: '2/3', perspective: 1000, cursor: 'pointer' }}
            onClick={() => setFlipped(f => !f)}
          >
            <div style={{
              width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
              transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              borderRadius: 18,
              boxShadow: `0 0 30px ${r.glow}, 0 20px 50px rgba(0,0,0,0.6)`,
            }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${r.border}`, background: 'rgba(18,18,18,0.98)' }}>
                {frontImg ? (
                  <img src={frontImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 56 }}>✦</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${r.border}`, transform: 'rotateY(180deg)' }}>
                {backImg ? <img src={backImg} alt="back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <DefaultCardBack />}
              </div>
            </div>
          </div>

          {/* Flip button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <button onClick={() => setFlipped(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw style={{ width: 12, height: 12 }} />
              {flipped ? 'Show Front' : backImg ? 'Flip to Back' : 'Flip Card'}
            </button>
          </div>

          {/* Card name + badges */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.3px' }}>{card.name}</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 8, color: r.color, border: `1px solid ${r.border}`, background: `${r.glow}30`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 8, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', textTransform: 'capitalize' }}>{SOURCE_LABEL[card.source_type] || card.source_type}</span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 8, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, background: statusCfg.bg, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{statusCfg.label}</span>
            </div>
            {qrBlocked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.2)' }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <p style={{ fontSize: 12, color: 'rgba(255,165,0,0.85)', fontWeight: 600, margin: 0 }}>QR generation disabled until published.</p>
              </div>
            )}
            {card.description && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '12px 0 0' }}>{card.description}</p>
            )}
          </div>

          {/* 2x2 Stats Grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <StatCard label="Supply"     value={supplyDisplay}         accent="rgba(200,200,200,0.85)" />
            <StatCard label="Claimed"    value={claimed}               accent={C.lime} />
            <StatCard label="Remaining"  value={remainingDisplay}      accent={remaining === 0 ? 'rgba(255,80,80,1)' : 'rgba(80,200,120,1)'} />
            <StatCard label="Active QR"  value={activeTokens.length}   accent={C.purple} />
          </div>

          {/* Supply progress bar */}
          {maxSupply > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Supply Progress</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{Math.round(progressPct)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${progressPct}%`,
                  background: progressPct >= 100 ? 'rgba(255,80,80,0.8)' : progressPct >= 80 ? 'rgba(255,165,0,0.8)' : C.lime,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* Serial config */}
          <div style={{ marginBottom: 16, padding: '14px 16px', background: card.enable_serial_random ? 'rgba(200,255,0,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${card.enable_serial_random ? C.limeBorder : 'rgba(255,255,255,0.07)'}`, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: card.enable_serial_random ? 12 : 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0 }}>Serial Numbers</p>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
                color: card.enable_serial_random ? C.lime : 'rgba(255,255,255,0.3)',
                border: `1px solid ${card.enable_serial_random ? C.limeBorder : 'rgba(255,255,255,0.1)'}`,
                background: card.enable_serial_random ? C.limeDim : 'rgba(255,255,255,0.03)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{card.enable_serial_random ? 'Enabled' : 'Disabled'}</span>
            </div>
            {card.enable_serial_random && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Prefix', val: card.serial_prefix || '—' },
                  { label: 'Max Supply', val: maxSupply > 0 ? maxSupply : '∞' },
                  { label: 'Digits', val: digits },
                  { label: 'Example', val: serialExample || '—' },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(200,255,0,0.08)' }}>
                    <p style={{ fontSize: 9, color: 'rgba(200,255,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', fontWeight: 700 }}>{label}</p>
                    <p style={{ fontSize: 12, color: C.lime, fontFamily: label === 'Example' ? 'monospace' : 'inherit', fontWeight: 800, margin: 0 }}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Card ID</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all', lineHeight: 1.5 }}>{card.id}</p>
            </div>
            <button onClick={handleCopyId} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, background: copiedId ? C.limeDim : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedId ? C.limeBorder : 'rgba(255,255,255,0.1)'}`, color: copiedId ? C.lime : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {copiedId ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
              {copiedId ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
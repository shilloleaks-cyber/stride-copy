import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

const RARITY = {
  common:    { label: 'Common',    color: 'rgba(180,180,180,1)', border: 'rgba(180,180,180,0.3)', glow: 'rgba(180,180,180,0.2)' },
  rare:      { label: 'Rare',      color: 'rgba(80,160,255,1)',  border: 'rgba(80,160,255,0.4)',  glow: 'rgba(80,160,255,0.3)' },
  epic:      { label: 'Epic',      color: 'rgba(180,80,255,1)',  border: 'rgba(180,80,255,0.4)',  glow: 'rgba(180,80,255,0.3)' },
  legendary: { label: 'Legendary', color: '#FFD700',             border: 'rgba(255,215,0,0.5)',   glow: 'rgba(255,215,0,0.35)' },
  founder:   { label: 'Founder',   color: '#BFFF00',             border: 'rgba(191,255,0,0.5)',   glow: 'rgba(191,255,0,0.35)' },
  sponsor:   { label: 'Sponsor',   color: '#00e676',             border: 'rgba(0,230,118,0.4)',   glow: 'rgba(0,230,118,0.3)' },
};

const SOURCE_LABEL = { event: 'Event', purchase: 'Purchase', mission: 'Mission', sponsor: 'Sponsor', admin: 'Admin Drop' };

// Default BOOMX card back design (SVG-based)
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
        backgroundImage: `
          linear-gradient(rgba(191,255,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(191,255,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
      }} />
      <div style={{ position: 'absolute', inset: 20, borderRadius: 16, border: '1px solid rgba(191,255,0,0.15)', boxShadow: 'inset 0 0 30px rgba(138,43,226,0.15)' }} />
      {[{ top: 24, left: 24 }, { top: 24, right: 24 }, { bottom: 24, left: 24 }, { bottom: 24, right: 24 }].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 16, height: 16,
          borderTop: i < 2 ? '2px solid rgba(191,255,0,0.5)' : 'none',
          borderBottom: i >= 2 ? '2px solid rgba(191,255,0,0.5)' : 'none',
          borderLeft: (i === 0 || i === 2) ? '2px solid rgba(191,255,0,0.5)' : 'none',
          borderRight: (i === 1 || i === 3) ? '2px solid rgba(191,255,0,0.5)' : 'none',
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.35em', color: 'rgba(191,255,0,0.9)', textTransform: 'uppercase', marginBottom: 6, textShadow: '0 0 20px rgba(191,255,0,0.6)' }}>BOOMX</div>
        <div style={{ width: 48, height: 48, margin: '0 auto', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.4) 0%, rgba(191,255,0,0.1) 70%, transparent 100%)', border: '1.5px solid rgba(191,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 0 24px rgba(191,255,0,0.2), 0 0 40px rgba(138,43,226,0.2)' }}>✦</div>
        <div style={{ marginTop: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Collectibles</div>
      </div>
    </div>
  );
}

// card: Cards entity, userCard: UserCards record (optional, only for owned cards)
export default function CardDetailModal({ card, userCard, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const r = RARITY[card?.rarity] || RARITY.common;

  const frontImg = card?.front_image_url || card?.image_url;
  const backImg = card?.back_image_url;

  const claimedDate = userCard?.claimed_at
    ? new Date(userCard.claimed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const isFounder = card?.rarity === 'founder';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ alignSelf: 'flex-end', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Flip card */}
        <div style={{ width: '100%', aspectRatio: '2/3', perspective: 1000, cursor: 'pointer' }} onClick={() => setFlipped(f => !f)}>
          <div style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            borderRadius: 20,
            boxShadow: isFounder
              ? `0 0 50px rgba(191,255,0,0.3), 0 0 100px rgba(138,43,226,0.2), 0 20px 60px rgba(0,0,0,0.6)`
              : `0 0 40px ${r.glow}, 0 20px 60px rgba(0,0,0,0.6)`,
          }}>
            {/* Front */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${r.border}`, background: 'rgba(18,18,18,0.98)' }}>
              {frontImg ? (
                <img src={frontImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 64 }}>✦</div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />
              {/* Serial overlay on front if owned */}
              {userCard?.serial_code && (
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 7px', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: r.color, fontFamily: 'monospace' }}>{userCard.serial_code}</span>
                </div>
              )}
            </div>
            {/* Back */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${r.border}`, transform: 'rotateY(180deg)' }}>
              {backImg ? (
                <img src={backImg} alt={`${card.name} back`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <DefaultCardBack />
              )}
            </div>
          </div>
        </div>

        {/* Card info */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{card.name}</p>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6, color: r.color, border: `1px solid ${r.border}`, background: `${r.glow}30`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
            {card.source_type && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                {SOURCE_LABEL[card.source_type] || card.source_type}
              </span>
            )}
            {card.event_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>{card.event_name}</span>}
            {card.sponsor_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,230,118,0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.05)' }}>{card.sponsor_name}</span>}
          </div>

          {card.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 10px' }}>{card.description}</p>
          )}

          {/* Serial + supply block */}
          {userCard?.serial_code && (
            <div style={{ margin: '0 0 10px', padding: '10px 14px', background: isFounder ? 'rgba(191,255,0,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isFounder ? 'rgba(191,255,0,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: r.color, fontFamily: 'monospace', margin: '0 0 2px', letterSpacing: '0.05em' }}>{userCard.serial_code}</p>
              {userCard.supply_position && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>{userCard.supply_position}</p>
              )}
            </div>
          )}

          {/* Claimed date */}
          {claimedDate && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>Claimed {claimedDate}</p>
          )}
        </div>

        {/* Flip button */}
        <button
          onClick={() => setFlipped(f => !f)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <RotateCcw style={{ width: 12, height: 12 }} />
          {flipped ? 'Show Front' : backImg ? 'Flip to Back' : 'Flip Card'}
        </button>
      </div>
    </div>
  );
}
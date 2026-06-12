import React, { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { RARITY_CONFIG, injectRarityKeyframes, SPARKLE_POSITIONS } from './rarityEffects';

const SOURCE_LABEL = { event: 'Event', purchase: 'Purchase', mission: 'Mission', sponsor: 'Sponsor', admin: 'Admin Drop' };

function DefaultCardBack() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #0D0D0D 0%, #1a0a2e 50%, #0D0D0D 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(191,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(191,255,0,0.03) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
      <div style={{ position: 'absolute', inset: 20, borderRadius: 16, border: '1px solid rgba(191,255,0,0.1)', boxShadow: 'inset 0 0 30px rgba(138,43,226,0.08)' }} />
      {[{ top: 24, left: 24 }, { top: 24, right: 24 }, { bottom: 24, left: 24 }, { bottom: 24, right: 24 }].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', ...pos, width: 16, height: 16,
          borderTop: i < 2 ? '1px solid rgba(191,255,0,0.3)' : 'none',
          borderBottom: i >= 2 ? '1px solid rgba(191,255,0,0.3)' : 'none',
          borderLeft: (i === 0 || i === 2) ? '1px solid rgba(191,255,0,0.3)' : 'none',
          borderRight: (i === 1 || i === 3) ? '1px solid rgba(191,255,0,0.3)' : 'none',
        }} />
      ))}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.4em', color: 'rgba(191,255,0,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>BOOMX</div>
        <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.2) 0%, transparent 100%)', border: '1px solid rgba(191,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(191,255,0,0.5)' }}>✦</div>
        <div style={{ marginTop: 8, fontSize: 8, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>Collectibles</div>
      </div>
    </div>
  );
}

export default function CardDetailModal({ card, userCard, onClose }) {
  useEffect(() => { injectRarityKeyframes(); }, []);

  const [flipped, setFlipped] = useState(false);
  const r = RARITY_CONFIG[card?.rarity] || RARITY_CONFIG.common;
  const rarity = card?.rarity || 'common';
  const isOwned = !!userCard;

  const frontImg = card?.front_image_url || card?.image_url;
  const backImg = card?.back_image_url;

  const claimedDate = userCard?.claimed_at
    ? new Date(userCard.claimed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const glowClassMap = { founder: 'bx-glow-lime', legendary: 'bx-glow-gold', epic: 'bx-glow-purple', rare: 'bx-glow-rare', sponsor: 'bx-glow-sponsor' };
  const outerGlowClass = isOwned ? (glowClassMap[rarity] || '') : '';
  const floatClass = isOwned && r.floatAnim ? 'bx-float' : '';

  // Shine color
  const shineColor = rarity === 'founder'
    ? 'rgba(191,255,0,0.22)'
    : rarity === 'epic'
      ? 'rgba(180,80,255,0.18)'
      : 'rgba(255,255,255,0.16)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Close */}
        <button onClick={onClose} style={{ alignSelf: 'flex-end', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Card flip area */}
        <div style={{ width: '100%', aspectRatio: '2/3', perspective: 900, cursor: 'pointer', position: 'relative' }}>

          {/* Sparkles — outside the flip card so they don't rotate */}
          {isOwned && r.sparkles && SPARKLE_POSITIONS.map((sp, i) => (
            <div key={i} className="bx-sparkle" style={{
              position: 'absolute', zIndex: 20, pointerEvents: 'none',
              top: sp.top, left: sp.left,
              animationDelay: sp.delay, animationDuration: sp.dur,
              width: sp.size + 1, height: sp.size + 1, borderRadius: '50%',
              background: '#FFD700',
              boxShadow: `0 0 5px #FFD700, 0 0 10px rgba(255,215,0,0.6)`,
            }} />
          ))}

          {/* The flip card */}
          <div
            className={[floatClass, outerGlowClass].filter(Boolean).join(' ')}
            onClick={() => setFlipped(f => !f)}
            style={{
              width: '100%', height: '100%', position: 'relative', zIndex: 1,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              borderRadius: 20,
            }}
          >
            {/* === FRONT FACE === */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              borderRadius: 20, overflow: 'hidden',
              border: `1.5px solid ${r.border}`,
              background: '#0e0e0e',
            }}>
              {frontImg
                ? <img src={frontImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 64, color: r.color }}>✦</div>
              }

              {/* Holographic overlay */}
              {isOwned && r.holographic && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 4, borderRadius: 'inherit', pointerEvents: 'none',
                  background: rarity === 'founder'
                    ? 'linear-gradient(125deg, rgba(191,255,0,0.0) 0%, rgba(138,43,226,0.14) 35%, rgba(191,255,0,0.1) 55%, rgba(138,43,226,0.0) 100%)'
                    : 'linear-gradient(125deg, rgba(255,215,0,0.0) 0%, rgba(255,100,0,0.12) 30%, rgba(255,215,0,0.1) 55%, rgba(100,180,255,0.1) 75%, rgba(255,215,0,0.0) 100%)',
                  backgroundSize: '300% 300%',
                  animation: `bx-holo-sweep ${rarity === 'founder' ? 14 : 10}s ease-in-out infinite`,
                }} />
              )}

              {/* Shine sweep */}
              {isOwned && r.shinePeriod && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '45%',
                    background: `linear-gradient(90deg, transparent 0%, ${shineColor} 50%, transparent 100%)`,
                    animation: `bx-shine ${r.shinePeriod}s ease-in-out infinite`,
                  }} />
                </div>
              )}

              {/* Very thin bottom accent */}
              {rarity !== 'common' && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent 10%, ${r.color}60 50%, transparent 90%)`,
                  zIndex: 6,
                }} />
              )}

              {/* Serial overlay */}
              {userCard?.serial_code && (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10, zIndex: 7,
                  background: 'rgba(0,0,0,0.75)', borderRadius: 7, padding: '3px 9px',
                  backdropFilter: 'blur(4px)',
                  border: `1px solid ${r.border}40`,
                }}>
                  <span
                    className={r.serialGlow ? 'bx-serial-glow' : ''}
                    style={{ fontSize: 10, fontWeight: 900, color: r.color, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                  >
                    {userCard.serial_code}
                  </span>
                </div>
              )}
            </div>

            {/* === BACK FACE === */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              borderRadius: 20, overflow: 'hidden',
              border: `1.5px solid ${r.border}`,
              transform: 'rotateY(180deg)',
            }}>
              {backImg
                ? <img src={backImg} alt={`${card.name} back`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <DefaultCardBack />
              }
            </div>
          </div>
        </div>

        {/* Card info */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{card.name}</p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
              color: r.color, border: `1px solid ${r.border}`,
              background: r.bg, textTransform: 'uppercase', letterSpacing: '0.1em',
              display: 'inline-block',
            }}>{r.label}</span>
            {card.source_type && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                {SOURCE_LABEL[card.source_type] || card.source_type}
              </span>
            )}
            {card.event_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>{card.event_name}</span>}
            {card.sponsor_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.05)' }}>{card.sponsor_name}</span>}
          </div>

          {card.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: '0 0 10px' }}>{card.description}</p>
          )}

          {userCard?.serial_code && (
            <div style={{
              margin: '0 0 10px', padding: '10px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${r.border}50`,
              borderRadius: 12,
            }}>
              <p className={r.serialGlow ? 'bx-serial-glow' : ''} style={{ fontSize: 14, fontWeight: 900, color: r.color, fontFamily: 'monospace', margin: '0 0 2px', letterSpacing: '0.05em' }}>
                {userCard.serial_code}
              </p>
              {userCard.supply_position && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, fontFamily: 'monospace' }}>{userCard.supply_position}</p>
              )}
            </div>
          )}

          {claimedDate && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '0 0 4px' }}>Claimed {claimedDate}</p>
          )}
        </div>

        <button
          onClick={() => setFlipped(f => !f)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <RotateCcw style={{ width: 12, height: 12 }} />
          {flipped ? 'Show Front' : backImg ? 'Flip to Back' : 'Flip Card'}
        </button>
      </div>
    </div>
  );
}
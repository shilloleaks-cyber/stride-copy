import React, { useState, useEffect, useRef } from 'react';
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
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(191,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(191,255,0,0.04) 1px, transparent 1px)`,
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

  // 3D tilt for founder
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    if (!r.tilt3d || !isOwned) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((e.clientY - cy) / rect.height) * 14, y: -((e.clientX - cx) / rect.width) * 14 });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });
  const handleTouchMove = (e) => {
    if (!r.tilt3d || !isOwned) return;
    const t = e.touches[0];
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((t.clientY - cy) / rect.height) * 12, y: -((t.clientX - cx) / rect.width) * 12 });
  };
  const handleTouchEnd = () => setTilt({ x: 0, y: 0 });

  // Card outer glow
  const cardGlow = () => {
    if (!isOwned) return `0 0 30px ${r.glow}80, 0 20px 50px rgba(0,0,0,0.5)`;
    switch (rarity) {
      case 'common':    return `0 8px 32px rgba(0,0,0,0.7)`;
      case 'rare':      return `0 0 40px rgba(191,255,0,0.35), 0 0 80px rgba(191,255,0,0.12), 0 20px 60px rgba(0,0,0,0.6)`;
      case 'epic':      return `0 0 50px rgba(180,80,255,0.45), 0 0 90px rgba(191,255,0,0.15), 0 20px 60px rgba(0,0,0,0.6)`;
      case 'legendary': return `0 0 60px rgba(255,215,0,0.5), 0 0 110px rgba(255,215,0,0.22), 0 20px 60px rgba(0,0,0,0.7)`;
      case 'founder':   return `0 0 70px rgba(191,255,0,0.45), 0 0 120px rgba(138,43,226,0.35), 0 20px 70px rgba(0,0,0,0.8)`;
      case 'sponsor':   return `0 0 50px rgba(255,215,0,0.4), 0 0 90px rgba(191,255,0,0.12), 0 20px 60px rgba(0,0,0,0.6)`;
      default: return `0 0 40px ${r.glow}, 0 20px 60px rgba(0,0,0,0.6)`;
    }
  };

  const floatStyle = isOwned && r.floatAnim
    ? { animation: 'bx-float 4s ease-in-out infinite' }
    : {};

  const pulseBorderAnim = isOwned && r.pulseBorder
    ? { animation: 'bx-pulse-border 2.5s ease-in-out infinite' }
    : {};

  // Holographic overlay
  const holoOverlay = isOwned && r.holographic ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 2, borderRadius: 20, pointerEvents: 'none',
      background: 'linear-gradient(115deg, transparent 20%, rgba(255,50,50,0.14) 30%, rgba(255,165,0,0.14) 40%, rgba(255,255,0,0.14) 50%, rgba(0,200,100,0.12) 60%, rgba(0,100,255,0.14) 70%, rgba(180,0,255,0.14) 80%, transparent 90%)',
      backgroundSize: '200% 200%',
      animation: 'bx-holo 3.5s linear infinite',
      mixBlendMode: 'screen',
    }} />
  ) : null;

  // Shine sweep
  const shineOverlay = isOwned && r.shinePeriod ? (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, borderRadius: 20, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '40%',
        background: `linear-gradient(90deg, transparent, ${r.shimmerColor}, transparent)`,
        animation: `bx-shine ${r.shinePeriod}s ease-in-out infinite`,
      }} />
    </div>
  ) : null;

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
        <button
          onClick={onClose}
          style={{ alignSelf: 'flex-end', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Flip card */}
        <div
          ref={cardRef}
          style={{
            width: '100%', aspectRatio: '2/3', perspective: 1000, cursor: 'pointer',
            ...floatStyle,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setFlipped(f => !f)}
        >
          <div style={{
            width: '100%', height: '100%', position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `${r.tilt3d && isOwned ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)` : `rotateY(${flipped ? 180 : 0}deg)`}`,
            borderRadius: 20,
            boxShadow: cardGlow(),
          }}>

            {/* Pulse border ring */}
            {isOwned && r.pulseBorder && (
              <div style={{
                position: 'absolute', inset: -1, zIndex: 10, borderRadius: 21, pointerEvents: 'none',
                border: `1.5px solid ${r.border}`,
                ...pulseBorderAnim,
              }} />
            )}

            {/* Sparkles for legendary */}
            {isOwned && rarity === 'legendary' && SPARKLE_POSITIONS.map((sp, i) => (
              <div key={i} style={{
                position: 'absolute', zIndex: 9, pointerEvents: 'none',
                top: sp.top, left: sp.left,
                width: 5, height: 5, borderRadius: '50%',
                background: '#FFD700',
                boxShadow: '0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.7)',
                animation: `bx-sparkle ${sp.dur} ease-in-out infinite`,
                animationDelay: sp.delay,
              }} />
            ))}

            {/* Front face */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              borderRadius: 20, overflow: 'hidden',
              border: `1.5px solid ${r.border}`,
              background: 'rgba(14,14,14,0.98)',
            }}>
              {frontImg ? (
                <img src={frontImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 64 }}>✦</div>
              )}

              {/* Holo overlay */}
              {holoOverlay}

              {/* Shine sweep */}
              {shineOverlay}

              {/* Bottom shimmer bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: rarity === 'founder' ? 5 : 3,
                background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
                boxShadow: (rarity === 'legendary' || rarity === 'founder') ? `0 0 10px ${r.color}` : 'none',
                zIndex: 4,
              }} />

              {/* Serial overlay on front — glowing for founder */}
              {userCard?.serial_code && (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10, zIndex: 5,
                  background: 'rgba(0,0,0,0.75)', borderRadius: 7, padding: '3px 8px',
                  backdropFilter: 'blur(4px)',
                  border: r.serialGlow ? `1px solid ${r.border}` : 'none',
                  boxShadow: r.serialGlow ? `0 0 10px ${r.glow}` : 'none',
                  animation: r.serialGlow ? 'bx-glow-pulse 2.5s ease-in-out infinite' : 'none',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: r.color, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{userCard.serial_code}</span>
                </div>
              )}
            </div>

            {/* Back face */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              borderRadius: 20, overflow: 'hidden',
              border: `1.5px solid ${r.border}`,
              transform: 'rotateY(180deg)',
            }}>
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
          <p style={{
            fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px',
            textShadow: (rarity === 'founder' || rarity === 'legendary') ? `0 0 20px ${r.color}60` : 'none',
          }}>{card.name}</p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
              color: r.color, border: `1px solid ${r.border}`,
              background: `${r.glow}30`, textTransform: 'uppercase', letterSpacing: '0.1em',
              animation: rarity === 'sponsor' ? 'bx-sponsor-badge 2s ease-in-out infinite' : 'none',
            }}>{r.label}</span>
            {card.source_type && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                {SOURCE_LABEL[card.source_type] || card.source_type}
              </span>
            )}
            {card.event_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>{card.event_name}</span>}
            {card.sponsor_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.75)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.25)', background: 'rgba(255,215,0,0.06)' }}>{card.sponsor_name}</span>}
          </div>

          {card.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 10px' }}>{card.description}</p>
          )}

          {/* Serial + supply */}
          {userCard?.serial_code && (
            <div style={{
              margin: '0 0 10px', padding: '10px 14px',
              background: r.serialGlow ? 'rgba(191,255,0,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${r.serialGlow ? 'rgba(191,255,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              boxShadow: r.serialGlow ? `0 0 16px rgba(191,255,0,0.15)` : 'none',
              animation: r.serialGlow ? 'bx-glow-pulse 3s ease-in-out infinite' : 'none',
            }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: r.color, fontFamily: 'monospace', margin: '0 0 2px', letterSpacing: '0.05em' }}>{userCard.serial_code}</p>
              {userCard.supply_position && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>{userCard.supply_position}</p>
              )}
            </div>
          )}

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
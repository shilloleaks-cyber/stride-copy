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
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(191,255,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(191,255,0,0.04) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
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

// Spinning conic border wrapper for modal
function SpinningBorderModal({ color1, color2 }) {
  return (
    <div style={{ position: 'absolute', inset: -3, zIndex: 0, borderRadius: 23, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: -80,
        background: `conic-gradient(from 0deg, transparent 0%, ${color1} 12%, ${color2} 28%, transparent 42%, transparent 58%, ${color2} 72%, ${color1} 88%, transparent 100%)`,
        animation: 'bx-border-spin 3s linear infinite',
      }} />
      <div style={{ position: 'absolute', inset: 3, borderRadius: 20, background: '#0a0a0a' }} />
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
  const onMouseMove = (e) => {
    if (!r.tilt3d || !isOwned) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((e.clientY - cy) / rect.height) * 16, y: -((e.clientX - cx) / rect.width) * 16 });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0 });
  const onTouchMove = (e) => {
    if (!r.tilt3d || !isOwned) return;
    const t = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((t.clientY - cy) / rect.height) * 14, y: -((t.clientX - cx) / rect.width) * 14 });
  };
  const onTouchEnd = () => setTilt({ x: 0, y: 0 });

  // Glow class for outer glow
  const glowClassMap = { founder: 'bx-glow-lime', legendary: 'bx-glow-gold', epic: 'bx-glow-purple', rare: 'bx-glow-rare', sponsor: 'bx-glow-sponsor' };
  const outerGlowClass = isOwned ? (glowClassMap[rarity] || '') : '';
  const floatClass = isOwned && r.floatAnim ? 'bx-float' : '';

  const tiltTransform = r.tilt3d && isOwned
    ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`
    : `rotateY(${flipped ? 180 : 0}deg)`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {/* Close */}
        <button onClick={onClose} style={{ alignSelf: 'flex-end', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Card flip area */}
        <div style={{ width: '100%', aspectRatio: '2/3', perspective: 900, cursor: 'pointer', position: 'relative' }}>

          {/* Spinning border wrapper */}
          {isOwned && (rarity === 'founder' || rarity === 'legendary') && (
            <SpinningBorderModal
              color1={rarity === 'founder' ? '#BFFF00' : '#FFD700'}
              color2={rarity === 'founder' ? '#8A2BE2' : '#ff6600'}
            />
          )}

          {/* Sparkle positions (outside the flip so they don't flip) */}
          {isOwned && r.sparkles && SPARKLE_POSITIONS.map((sp, i) => (
            <div key={i} className="bx-sparkle" style={{
              position: 'absolute', zIndex: 20, pointerEvents: 'none',
              top: sp.top, left: sp.left,
              animationDelay: sp.delay, animationDuration: sp.dur,
              width: sp.size + 1, height: sp.size + 1, borderRadius: '50%',
              background: '#FFD700',
              boxShadow: `0 0 8px #FFD700, 0 0 16px rgba(255,215,0,0.9)`,
            }} />
          ))}

          {/* The 3D flip card */}
          <div
            ref={cardRef}
            className={[floatClass, outerGlowClass].filter(Boolean).join(' ')}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={() => setFlipped(f => !f)}
            style={{
              width: '100%', height: '100%', position: 'relative', zIndex: 1,
              transformStyle: 'preserve-3d',
              transition: r.tilt3d ? 'transform 0.08s ease' : 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
              transform: tiltTransform,
              borderRadius: 20,
            }}
          >
            {/* Pulse border overlay (epic/rare/sponsor) */}
            {isOwned && r.pulseBorder && rarity !== 'founder' && rarity !== 'legendary' && (
              <div className="bx-border-pulse" style={{
                position: 'absolute', inset: -1, zIndex: 10, borderRadius: 21, pointerEvents: 'none',
                border: `2px solid ${r.border}`,
              }} />
            )}

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
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 64 }}>✦</div>
              }

              {/* Holographic overlay */}
              {isOwned && r.holographic && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 4, borderRadius: 'inherit', pointerEvents: 'none',
                  background: 'linear-gradient(125deg, rgba(255,0,100,0.3) 0%, rgba(255,165,0,0.3) 16%, rgba(255,255,0,0.3) 32%, rgba(0,255,120,0.28) 48%, rgba(0,150,255,0.3) 64%, rgba(180,0,255,0.3) 80%, rgba(255,0,100,0.3) 100%)',
                  backgroundSize: '300% 300%',
                  animation: 'bx-holo-sweep 3s ease-in-out infinite',
                  mixBlendMode: 'screen',
                }} />
              )}

              {/* Shine sweep */}
              {isOwned && r.shinePeriod && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: '55%',
                    background: rarity === 'founder'
                      ? 'linear-gradient(90deg, transparent 0%, rgba(191,255,0,0.55) 50%, transparent 100%)'
                      : rarity === 'legendary'
                        ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)'
                        : rarity === 'sponsor'
                          ? 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.5) 50%, transparent 100%)'
                          : 'linear-gradient(90deg, transparent 0%, rgba(191,255,0,0.4) 50%, transparent 100%)',
                    animation: `bx-shine ${r.shinePeriod}s ease-in-out infinite`,
                    animationDelay: '-0.5s',
                  }} />
                </div>
              )}

              {/* Bottom bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: rarity === 'founder' || rarity === 'legendary' ? 5 : 3,
                background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
                boxShadow: `0 0 10px ${r.color}`,
                zIndex: 6,
              }} />

              {/* Serial overlay */}
              {userCard?.serial_code && (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10, zIndex: 7,
                  background: 'rgba(0,0,0,0.8)', borderRadius: 7, padding: '3px 9px',
                  backdropFilter: 'blur(4px)',
                  border: r.serialGlow ? `1px solid rgba(191,255,0,0.4)` : '1px solid rgba(255,255,255,0.1)',
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
          <p style={{
            fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px',
            textShadow: (rarity === 'founder' || rarity === 'legendary') ? `0 0 20px ${r.color}80` : 'none',
          }}>{card.name}</p>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <span
              className={rarity === 'sponsor' ? 'bx-badge-pulse' : ''}
              style={{
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                color: r.color, border: `1px solid ${r.border}`,
                background: `${r.bg}`, textTransform: 'uppercase', letterSpacing: '0.1em',
                display: 'inline-block',
              }}
            >{r.label}</span>
            {card.source_type && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                {SOURCE_LABEL[card.source_type] || card.source_type}
              </span>
            )}
            {card.event_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>{card.event_name}</span>}
            {card.sponsor_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.8)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.07)' }}>{card.sponsor_name}</span>}
          </div>

          {card.description && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 10px' }}>{card.description}</p>
          )}

          {userCard?.serial_code && (
            <div style={{
              margin: '0 0 10px', padding: '10px 14px',
              background: r.serialGlow ? 'rgba(191,255,0,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${r.serialGlow ? 'rgba(191,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12,
              boxShadow: r.serialGlow ? '0 0 20px rgba(191,255,0,0.2)' : 'none',
            }}>
              <p className={r.serialGlow ? 'bx-serial-glow' : ''} style={{ fontSize: 14, fontWeight: 900, color: r.color, fontFamily: 'monospace', margin: '0 0 2px', letterSpacing: '0.05em' }}>
                {userCard.serial_code}
              </p>
              {userCard.supply_position && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontFamily: 'monospace' }}>{userCard.supply_position}</p>
              )}
            </div>
          )}

          {claimedDate && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>Claimed {claimedDate}</p>
          )}
        </div>

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
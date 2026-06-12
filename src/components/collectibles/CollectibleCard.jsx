import React, { useEffect, useRef, useState } from 'react';
import { RARITY_CONFIG, injectRarityKeyframes, SPARKLE_POSITIONS } from './rarityEffects';

// Returns the glow class name for a rarity
function glowClass(rarity) {
  switch (rarity) {
    case 'founder':   return 'bx-glow-lime';
    case 'legendary': return 'bx-glow-gold';
    case 'epic':      return 'bx-glow-purple';
    case 'rare':      return 'bx-glow-rare';
    case 'sponsor':   return 'bx-glow-sponsor';
    default: return '';
  }
}

// Animated spinning conic border for founder/legendary
function SpinningBorder({ color1, color2 }) {
  return (
    <div style={{
      position: 'absolute', inset: -2, zIndex: 0, borderRadius: 'inherit',
      overflow: 'hidden', pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: -60,
        background: `conic-gradient(from 0deg, transparent 0%, ${color1} 15%, ${color2} 30%, transparent 45%, transparent 55%, ${color2} 70%, ${color1} 85%, transparent 100%)`,
        animation: 'bx-border-spin 3s linear infinite',
      }} />
      {/* Inner mask to only show border ring */}
      <div style={{
        position: 'absolute', inset: 2, borderRadius: 'inherit',
        background: '#0e0e0e',
      }} />
    </div>
  );
}

// Shine sweep layer
function ShineSweep({ color, period }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
      borderRadius: 'inherit', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '50%',
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        animation: `bx-shine ${period}s ease-in-out infinite`,
        animationDelay: '-1s',
      }} />
    </div>
  );
}

// Holographic rainbow overlay
function HoloOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
      borderRadius: 'inherit',
      background: 'linear-gradient(125deg, rgba(255,0,100,0.25) 0%, rgba(255,165,0,0.25) 16%, rgba(255,255,0,0.25) 32%, rgba(0,255,120,0.25) 48%, rgba(0,150,255,0.25) 64%, rgba(180,0,255,0.25) 80%, rgba(255,0,100,0.25) 100%)',
      backgroundSize: '300% 300%',
      animation: 'bx-holo-sweep 3s ease-in-out infinite',
      mixBlendMode: 'screen',
    }} />
  );
}

export default function CollectibleCard({ card, owned = false, small = false, onClick, comingSoon = false }) {
  useEffect(() => { injectRarityKeyframes(); }, []);

  const r = RARITY_CONFIG[card?.rarity] || RARITY_CONFIG.common;
  const rarity = card?.rarity || 'common';
  const frontImg = card?.front_image_url || card?.image_url;

  // 3D tilt for founder
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMouseMove = (e) => {
    if (!r.tilt3d || !owned) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((e.clientY - cy) / rect.height) * 14, y: -((e.clientX - cx) / rect.width) * 14 });
  };
  const onMouseLeave = () => setTilt({ x: 0, y: 0 });
  const onTouchMove = (e) => {
    if (!r.tilt3d || !owned) return;
    const t = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((t.clientY - cy) / rect.height) * 12, y: -((t.clientX - cx) / rect.width) * 12 });
  };
  const onTouchEnd = () => setTilt({ x: 0, y: 0 });

  const isAnimated = owned && rarity !== 'common';
  const opacity = owned ? 1 : comingSoon ? 0.65 : 0.35;

  // Wrapper classes
  const floatClass = owned && r.floatAnim ? 'bx-float' : '';
  const activeGlowClass = owned ? glowClass(rarity) : '';

  const tiltTransform = r.tilt3d && owned
    ? `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
    : 'none';

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
      className={[floatClass, activeGlowClass].filter(Boolean).join(' ')}
      style={{
        borderRadius: small ? 14 : 18,
        position: 'relative',
        opacity,
        cursor: onClick ? 'pointer' : 'default',
        transform: tiltTransform,
        transition: r.tilt3d ? 'transform 0.1s ease' : 'none',
        // Non-animated fallback border/glow for static display
        border: `1.5px solid ${owned ? r.border : comingSoon ? `${r.border}50` : 'rgba(255,255,255,0.07)'}`,
        background: '#0e0e0e',
        overflow: 'visible', // allow spinning border to bleed
      }}
    >
      {/* Spinning animated border — founder & legendary */}
      {owned && (rarity === 'founder' || rarity === 'legendary') && (
        <SpinningBorder
          color1={rarity === 'founder' ? '#BFFF00' : '#FFD700'}
          color2={rarity === 'founder' ? '#8A2BE2' : '#ff6600'}
        />
      )}

      {/* Inner card (clips content) */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderRadius: small ? 13 : 17,
        overflow: 'hidden',
        background: '#0e0e0e',
      }}>

        {/* Pulse border for epic/rare/sponsor */}
        {owned && r.pulseBorder && rarity !== 'founder' && rarity !== 'legendary' && (
          <div className="bx-border-pulse" style={{
            position: 'absolute', inset: 0, zIndex: 8, borderRadius: 'inherit', pointerEvents: 'none',
            border: `2px solid ${r.border}`,
          }} />
        )}

        {/* Image area */}
        <div style={{
          width: '100%', paddingTop: '100%', position: 'relative',
          background: owned ? r.bg : comingSoon ? `${r.bg}50` : 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
        }}>
          {frontImg ? (
            <img
              src={frontImg}
              alt={card.name}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                filter: owned ? 'none' : comingSoon ? 'grayscale(0.5) blur(0.5px)' : 'grayscale(1) blur(2px)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: small ? 28 : 40,
            }}>
              {owned ? '✦' : '?'}
            </div>
          )}

          {/* Holographic overlay */}
          {owned && r.holographic && <HoloOverlay />}

          {/* Shine sweep */}
          {owned && r.shinePeriod && (
            <ShineSweep
              color={rarity === 'founder' ? 'rgba(191,255,0,0.45)' : rarity === 'legendary' ? 'rgba(255,255,255,0.45)' : rarity === 'sponsor' ? 'rgba(255,215,0,0.4)' : 'rgba(191,255,0,0.35)'}
              period={r.shinePeriod}
            />
          )}

          {/* Sparkles for legendary */}
          {owned && r.sparkles && SPARKLE_POSITIONS.map((sp, i) => (
            <div key={i} className="bx-sparkle" style={{
              position: 'absolute', zIndex: 6, pointerEvents: 'none',
              top: sp.top, left: sp.left,
              animationDelay: sp.delay,
              animationDuration: sp.dur,
              width: small ? sp.size - 1 : sp.size,
              height: small ? sp.size - 1 : sp.size,
              borderRadius: '50%',
              background: '#FFD700',
              boxShadow: `0 0 6px #FFD700, 0 0 12px rgba(255,215,0,0.8)`,
            }} />
          ))}

          {/* Coming soon teaser glow */}
          {comingSoon && !owned && (
            <div className="bx-teaser" style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              background: `radial-gradient(ellipse at 50% 40%, ${r.glow} 0%, transparent 70%)`,
            }} />
          )}

          {/* Bottom shimmer bar */}
          {owned && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: rarity === 'founder' || rarity === 'legendary' ? 4 : 3,
              background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
              zIndex: 7,
            }} />
          )}

          {/* Lock overlay */}
          {!owned && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: comingSoon ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.45)',
              fontSize: small ? 16 : 26,
            }}>
              {comingSoon ? '👁' : '🔒'}
            </div>
          )}
        </div>

        {/* Info bar */}
        <div style={{ padding: small ? '7px 8px 9px' : '9px 11px 11px', position: 'relative', zIndex: 9, background: '#0e0e0e' }}>
          <p style={{
            fontSize: small ? 11 : 13, fontWeight: 800,
            color: owned ? '#fff' : comingSoon ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
            margin: '0 0 4px', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {owned ? card?.name : comingSoon ? card?.name : '???'}
          </p>

          <span
            className={owned && rarity === 'sponsor' ? 'bx-badge-pulse' : ''}
            style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
              background: owned ? r.bg : 'rgba(255,255,255,0.04)',
              border: `1px solid ${owned ? r.border : comingSoon ? `${r.border}40` : 'rgba(255,255,255,0.08)'}`,
              color: owned ? r.color : comingSoon ? `${r.color}70` : 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'inline-block',
            }}
          >
            {r.label}
          </span>

          {owned && card?.event_name && (
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', lineHeight: 1.3 }}>
              {card.event_name}
            </p>
          )}
          {owned && card?.sponsor_name && (
            <p style={{ fontSize: 9, color: 'rgba(255,215,0,0.6)', margin: '4px 0 0', lineHeight: 1.3 }}>
              {card.sponsor_name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
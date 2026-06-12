import React, { useEffect, useRef, useState } from 'react';
import { RARITY_CONFIG, injectRarityKeyframes, SPARKLE_POSITIONS } from './rarityEffects';

export default function CollectibleCard({ card, owned = false, small = false, onClick, comingSoon = false }) {
  useEffect(() => { injectRarityKeyframes(); }, []);

  const r = RARITY_CONFIG[card?.rarity] || RARITY_CONFIG.common;
  const frontImg = card?.front_image_url || card?.image_url;
  const rarity = card?.rarity || 'common';

  // 3D tilt for founder cards (touch + mouse)
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    if (!r.tilt3d || !owned) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mx = e.clientX - cx;
    const my = e.clientY - cy;
    setTilt({ x: (my / rect.height) * 12, y: -(mx / rect.width) * 12 });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });
  const handleTouchMove = (e) => {
    if (!r.tilt3d || !owned) return;
    const t = e.touches[0];
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({ x: ((t.clientY - cy) / rect.height) * 10, y: -((t.clientX - cx) / rect.width) * 10 });
  };
  const handleTouchEnd = () => setTilt({ x: 0, y: 0 });

  // Glow box-shadow
  const buildGlow = () => {
    if (!owned && !comingSoon) return 'none';
    if (comingSoon && !owned) {
      return `0 0 20px ${r.glow}, 0 0 40px ${r.glow}40`;
    }
    switch (rarity) {
      case 'common':    return '0 4px 12px rgba(0,0,0,0.6)';
      case 'rare':      return `0 0 18px rgba(191,255,0,0.28), 0 6px 20px rgba(0,0,0,0.5)`;
      case 'epic':      return `0 0 24px rgba(180,80,255,0.4), 0 0 40px rgba(191,255,0,0.12), 0 6px 20px rgba(0,0,0,0.5)`;
      case 'legendary': return `0 0 32px rgba(255,215,0,0.45), 0 0 60px rgba(255,215,0,0.2), 0 8px 24px rgba(0,0,0,0.6)`;
      case 'founder':   return `0 0 36px rgba(191,255,0,0.4), 0 0 64px rgba(138,43,226,0.3), 0 8px 28px rgba(0,0,0,0.7)`;
      case 'sponsor':   return `0 0 22px rgba(255,215,0,0.35), 0 0 40px rgba(191,255,0,0.1), 0 6px 20px rgba(0,0,0,0.5)`;
      default: return 'none';
    }
  };

  // Border color
  const borderColor = owned
    ? r.border
    : comingSoon
      ? `${r.border}60`
      : 'rgba(255,255,255,0.07)';

  // Float animation
  const floatStyle = owned && r.floatAnim
    ? { animation: 'bx-float 4s ease-in-out infinite' }
    : {};

  // Pulse border animation
  const pulseBorderStyle = owned && r.pulseBorder
    ? { animation: 'bx-pulse-border 2.5s ease-in-out infinite' }
    : {};

  // Holographic overlay gradient
  const holoStyle = owned && r.holographic ? {
    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', borderRadius: 'inherit',
    background: 'linear-gradient(115deg, transparent 20%, rgba(255,50,50,0.12) 30%, rgba(255,165,0,0.12) 40%, rgba(255,255,0,0.12) 50%, rgba(0,255,0,0.12) 60%, rgba(0,100,255,0.12) 70%, rgba(180,0,255,0.12) 80%, transparent 90%)',
    backgroundSize: '200% 200%',
    animation: 'bx-holo 4s linear infinite',
    mixBlendMode: 'screen',
  } : null;

  // Shine sweep overlay
  const shineStyle = owned && r.shinePeriod ? {
    position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', borderRadius: 'inherit', overflow: 'hidden',
  } : null;

  const shineInnerStyle = owned && r.shinePeriod ? {
    position: 'absolute', top: 0, bottom: 0, width: '45%',
    background: `linear-gradient(90deg, transparent, ${r.shimmerColor}, transparent)`,
    animation: `bx-shine ${r.shinePeriod}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 2}s`,
  } : null;

  const opacity = owned ? 1 : comingSoon ? 0.6 : 0.38;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        borderRadius: small ? 14 : 18,
        overflow: 'hidden',
        background: 'rgba(14,14,14,0.98)',
        border: `1.5px solid ${borderColor}`,
        boxShadow: buildGlow(),
        opacity,
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: r.tilt3d && owned
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : 'none',
        ...floatStyle,
      }}
    >
      {/* Pulse border overlay */}
      {owned && r.pulseBorder && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, borderRadius: 'inherit', pointerEvents: 'none',
          border: `1.5px solid ${r.border}`,
          ...pulseBorderStyle,
        }} />
      )}

      {/* Holographic overlay */}
      {holoStyle && <div style={holoStyle} />}

      {/* Shine sweep */}
      {shineStyle && (
        <div style={shineStyle}>
          <div style={shineInnerStyle} />
        </div>
      )}

      {/* Sparkles for legendary */}
      {owned && rarity === 'legendary' && SPARKLE_POSITIONS.map((sp, i) => (
        <div key={i} style={{
          position: 'absolute', zIndex: 4, pointerEvents: 'none',
          top: sp.top, left: sp.left,
          width: small ? 3 : 4, height: small ? 3 : 4,
          borderRadius: '50%',
          background: '#FFD700',
          boxShadow: '0 0 4px #FFD700, 0 0 8px rgba(255,215,0,0.6)',
          animation: `bx-sparkle ${sp.dur} ease-in-out infinite`,
          animationDelay: sp.delay,
        }} />
      ))}

      {/* Coming soon teaser glow */}
      {comingSoon && !owned && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 40%, ${r.glow}50 0%, transparent 70%)`,
          animation: 'bx-glow-pulse 3s ease-in-out infinite',
        }} />
      )}

      {/* Image area */}
      <div style={{
        width: '100%',
        paddingTop: '100%',
        position: 'relative',
        background: owned ? r.bg : comingSoon ? `${r.bg}60` : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}>
        {frontImg ? (
          <img
            src={frontImg}
            alt={card.name}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              filter: owned ? 'none' : comingSoon ? 'grayscale(0.6) blur(0.5px)' : 'grayscale(1) blur(1.5px)',
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

        {/* Bottom shimmer bar */}
        {owned && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: rarity === 'founder' ? 4 : 3,
            background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
            boxShadow: owned && (rarity === 'legendary' || rarity === 'founder') ? `0 0 8px ${r.color}` : 'none',
          }} />
        )}

        {/* Lock overlay */}
        {!owned && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: comingSoon ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)',
            fontSize: small ? 18 : 28,
          }}>
            {comingSoon ? '👁' : '🔒'}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: small ? '8px 8px 10px' : '10px 12px 12px', position: 'relative', zIndex: 5 }}>
        <p style={{
          fontSize: small ? 11 : 13, fontWeight: 800,
          color: owned ? '#fff' : comingSoon ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
          margin: '0 0 4px', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {owned ? card?.name : comingSoon ? card?.name : '???'}
        </p>

        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
          background: owned ? r.bg : 'rgba(255,255,255,0.04)',
          border: `1px solid ${owned ? r.border : comingSoon ? `${r.border}50` : 'rgba(255,255,255,0.08)'}`,
          color: owned ? r.color : comingSoon ? `${r.color}80` : 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          // Sponsor badge pulse
          ...(owned && rarity === 'sponsor' ? { animation: 'bx-sponsor-badge 2s ease-in-out infinite' } : {}),
        }}>
          {r.label}
        </span>

        {owned && card?.event_name && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '5px 0 0', lineHeight: 1.3 }}>
            {card.event_name}
          </p>
        )}
        {owned && card?.sponsor_name && (
          <p style={{ fontSize: 9, color: 'rgba(255,215,0,0.55)', margin: '5px 0 0', lineHeight: 1.3 }}>
            {card.sponsor_name}
          </p>
        )}
      </div>
    </div>
  );
}
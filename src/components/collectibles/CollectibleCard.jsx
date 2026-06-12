import React, { useEffect } from 'react';
import { RARITY_CONFIG, injectRarityKeyframes, SPARKLE_POSITIONS } from './rarityEffects';

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

// Subtle shine sweep — uses animation-duration equal to the period
// The keyframe itself only moves during first ~18% of the cycle, then hides
function ShineSweep({ period, rarity }) {
  const color = rarity === 'legendary' || rarity === 'sponsor'
    ? 'rgba(255,255,255,0.18)'
    : rarity === 'founder'
      ? 'rgba(191,255,0,0.22)'
      : rarity === 'epic'
        ? 'rgba(180,80,255,0.18)'
        : 'rgba(191,255,0,0.16)';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
      borderRadius: 'inherit', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '45%',
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        animation: `bx-shine ${period}s ease-in-out infinite`,
      }} />
    </div>
  );
}

// Barely-visible holographic overlay
function HoloOverlay({ rarity }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
      borderRadius: 'inherit',
      background: rarity === 'founder'
        ? 'linear-gradient(125deg, rgba(191,255,0,0.0) 0%, rgba(138,43,226,0.12) 35%, rgba(191,255,0,0.08) 55%, rgba(138,43,226,0.0) 100%)'
        : 'linear-gradient(125deg, rgba(255,215,0,0.0) 0%, rgba(255,100,0,0.1) 30%, rgba(255,215,0,0.08) 55%, rgba(100,180,255,0.08) 75%, rgba(255,215,0,0.0) 100%)',
      backgroundSize: '300% 300%',
      animation: `bx-holo-sweep ${rarity === 'founder' ? 14 : 10}s ease-in-out infinite`,
    }} />
  );
}

export default function CollectibleCard({ card, owned = false, small = false, onClick, comingSoon = false }) {
  useEffect(() => { injectRarityKeyframes(); }, []);

  const r = RARITY_CONFIG[card?.rarity] || RARITY_CONFIG.common;
  const rarity = card?.rarity || 'common';
  const frontImg = card?.front_image_url || card?.image_url;

  const isOwned = owned;
  const opacity = isOwned ? 1 : comingSoon ? 0.6 : 0.3;

  const floatClass = isOwned && r.floatAnim ? 'bx-float' : '';
  const activeGlowClass = isOwned ? glowClass(rarity) : '';

  return (
    <div
      onClick={onClick}
      className={[floatClass, activeGlowClass].filter(Boolean).join(' ')}
      style={{
        borderRadius: small ? 14 : 18,
        position: 'relative',
        opacity,
        cursor: onClick ? 'pointer' : 'default',
        border: `1.5px solid ${isOwned ? r.border : comingSoon ? `${r.border}50` : 'rgba(255,255,255,0.06)'}`,
        background: '#0e0e0e',
        overflow: 'hidden',
      }}
    >
      {/* Image area */}
      <div style={{
        width: '100%', paddingTop: '100%', position: 'relative',
        background: isOwned ? r.bg : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}>
        {frontImg ? (
          <img
            src={frontImg}
            alt={card.name}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              filter: isOwned ? 'none' : comingSoon ? 'grayscale(0.4) blur(0.5px)' : 'grayscale(1) blur(2px)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: small ? 28 : 40,
          }}>
            {isOwned ? '✦' : '?'}
          </div>
        )}

        {/* Holographic overlay */}
        {isOwned && r.holographic && <HoloOverlay rarity={rarity} />}

        {/* Shine sweep */}
        {isOwned && r.shinePeriod && <ShineSweep period={r.shinePeriod} rarity={rarity} />}

        {/* Sparkles — legendary only, slow drifting particles */}
        {isOwned && r.sparkles && SPARKLE_POSITIONS.map((sp, i) => (
          <div key={i} style={{
            position: 'absolute', zIndex: 6, pointerEvents: 'none',
            top: sp.top, left: sp.left,
            width: small ? sp.size - 1 : sp.size,
            height: small ? sp.size - 1 : sp.size,
            borderRadius: '50%',
            background: '#FFD700',
            boxShadow: `0 0 4px #FFD700, 0 0 8px rgba(255,215,0,0.5)`,
            animation: `bx-sparkle-${sp.idx} ${sp.dur} ease-in-out ${sp.delay} infinite`,
          }} />
        ))}

        {/* Coming soon teaser */}
        {comingSoon && !isOwned && (
          <div className="bx-teaser" style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 40%, ${r.glow} 0%, transparent 65%)`,
          }} />
        )}

        {/* Bottom accent bar — very thin */}
        {isOwned && rarity !== 'common' && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 10%, ${r.color}60 50%, transparent 90%)`,
            zIndex: 7,
          }} />
        )}

        {/* Lock overlay */}
        {!isOwned && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: comingSoon ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.5)',
            fontSize: small ? 16 : 26,
          }}>
            {comingSoon ? '👁' : '🔒'}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div style={{ padding: small ? '7px 8px 9px' : '9px 11px 11px', background: '#0e0e0e', position: 'relative', zIndex: 9 }}>
        <p style={{
          fontSize: small ? 11 : 13, fontWeight: 800,
          color: isOwned ? '#fff' : comingSoon ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)',
          margin: '0 0 4px', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isOwned ? card?.name : comingSoon ? card?.name : '???'}
        </p>

        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
          background: isOwned ? r.bg : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isOwned ? r.border : comingSoon ? `${r.border}30` : 'rgba(255,255,255,0.07)'}`,
          color: isOwned ? r.color : comingSoon ? `${r.color}60` : 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          display: 'inline-block',
        }}>
          {r.label}
        </span>

        {isOwned && card?.event_name && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', lineHeight: 1.3 }}>
            {card.event_name}
          </p>
        )}
        {isOwned && card?.sponsor_name && (
          <p style={{ fontSize: 9, color: 'rgba(255,215,0,0.5)', margin: '4px 0 0', lineHeight: 1.3 }}>
            {card.sponsor_name}
          </p>
        )}
      </div>
    </div>
  );
}
import React from 'react';

const RARITY = {
  common:    { label: 'Common',    color: 'rgba(180,180,180,1)',  bg: 'rgba(180,180,180,0.08)', border: 'rgba(180,180,180,0.25)', glow: 'rgba(180,180,180,0.15)' },
  rare:      { label: 'Rare',      color: 'rgba(80,160,255,1)',   bg: 'rgba(80,160,255,0.08)',  border: 'rgba(80,160,255,0.3)',   glow: 'rgba(80,160,255,0.2)' },
  epic:      { label: 'Epic',      color: 'rgba(180,80,255,1)',   bg: 'rgba(180,80,255,0.08)',  border: 'rgba(180,80,255,0.3)',   glow: 'rgba(180,80,255,0.2)' },
  legendary: { label: 'Legendary', color: '#FFD700',              bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.4)',    glow: 'rgba(255,215,0,0.25)' },
  founder:   { label: 'Founder',   color: '#BFFF00',              bg: 'rgba(191,255,0,0.08)',   border: 'rgba(191,255,0,0.4)',    glow: 'rgba(191,255,0,0.25)' },
  sponsor:   { label: 'Sponsor',   color: '#00e676',              bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.3)',    glow: 'rgba(0,230,118,0.2)' },
};

export default function CollectibleCard({ card, owned = false, small = false, onClick }) {
  const r = RARITY[card?.rarity] || RARITY.common;
  const frontImg = card?.front_image_url || card?.image_url;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: small ? 14 : 18,
        overflow: 'hidden',
        background: 'rgba(18,18,18,0.98)',
        border: `1.5px solid ${owned ? r.border : 'rgba(255,255,255,0.08)'}`,
        boxShadow: owned ? `0 0 18px ${r.glow}` : 'none',
        opacity: owned ? 1 : 0.45,
        position: 'relative',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}>
      {/* Image */}
      <div style={{
        width: '100%',
        paddingTop: '100%',
        position: 'relative',
        background: owned ? r.bg : 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}>
        {frontImg ? (
          <img
            src={frontImg}
            alt={card.name}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              filter: owned ? 'none' : 'grayscale(1) blur(1px)',
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

        {/* Rarity shimmer bar */}
        {owned && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
          }} />
        )}

        {/* Lock overlay */}
        {!owned && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            fontSize: small ? 18 : 28,
          }}>🔒</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: small ? '8px 8px 10px' : '10px 12px 12px' }}>
        <p style={{
          fontSize: small ? 11 : 13, fontWeight: 800, color: '#fff',
          margin: '0 0 4px', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {owned ? card?.name : '???'}
        </p>

        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
          background: owned ? r.bg : 'rgba(255,255,255,0.05)',
          border: `1px solid ${owned ? r.border : 'rgba(255,255,255,0.1)'}`,
          color: owned ? r.color : 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {r.label}
        </span>

        {owned && card?.event_name && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '5px 0 0', lineHeight: 1.3 }}>
            {card.event_name}
          </p>
        )}
        {owned && card?.sponsor_name && (
          <p style={{ fontSize: 9, color: 'rgba(0,230,118,0.5)', margin: '5px 0 0', lineHeight: 1.3 }}>
            {card.sponsor_name}
          </p>
        )}
      </div>
    </div>
  );
}
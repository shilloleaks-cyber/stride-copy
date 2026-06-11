import React, { useState } from 'react';
import { X, RotateCcw, Copy, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const RARITY = {
  common:    { label: 'Common',    color: 'rgba(180,180,180,1)', border: 'rgba(180,180,180,0.3)', glow: 'rgba(180,180,180,0.2)' },
  rare:      { label: 'Rare',      color: 'rgba(80,160,255,1)',  border: 'rgba(80,160,255,0.4)',  glow: 'rgba(80,160,255,0.3)' },
  epic:      { label: 'Epic',      color: 'rgba(180,80,255,1)',  border: 'rgba(180,80,255,0.4)',  glow: 'rgba(180,80,255,0.3)' },
  legendary: { label: 'Legendary', color: '#FFD700',             border: 'rgba(255,215,0,0.5)',   glow: 'rgba(255,215,0,0.35)' },
  founder:   { label: 'Founder',   color: '#BFFF00',             border: 'rgba(191,255,0,0.5)',   glow: 'rgba(191,255,0,0.35)' },
  sponsor:   { label: 'Sponsor',   color: '#00e676',             border: 'rgba(0,230,118,0.4)',   glow: 'rgba(0,230,118,0.3)' },
};

const C = {
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.08)',
  limeBorder: 'rgba(191,255,0,0.25)',
  muted: 'rgba(255,255,255,0.35)',
  line: 'rgba(255,255,255,0.07)',
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

function StatPill({ label, value, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
      <p style={{ fontSize: 18, fontWeight: 900, color: accent || '#fff', margin: '0 0 2px' }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
    </div>
  );
}

export default function AdminCardPreviewModal({ card, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const r = RARITY[card?.rarity] || RARITY.common;
  const frontImg = card?.front_image_url || card?.image_url;
  const backImg = card?.back_image_url;

  // Fetch claim stats
  const { data: userCards = [] } = useQuery({
    queryKey: ['admin-preview-usercards', card.id],
    queryFn: () => base44.entities.UserCards.filter({ card_id: card.id }),
  });

  const { data: claimTokens = [] } = useQuery({
    queryKey: ['admin-preview-tokens', card.id],
    queryFn: () => base44.entities.ClaimTokens.filter({ card_id: card.id }),
  });

  const activeTokens = claimTokens.filter(t => !t.is_used && (!t.expires_at || new Date(t.expires_at) > new Date()));

  const createdDate = card.created_date
    ? new Date(card.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const claimed = userCards.length;
  const maxSupply = card.max_supply || 0;
  const remaining = maxSupply > 0 ? maxSupply - claimed : null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(card.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const SOURCE_LABEL = { event: 'Event', purchase: 'Purchase', mission: 'Mission', sponsor: 'Sponsor', admin: 'Admin' };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, background: '#111', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '20px 20px 40px', maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(191,255,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Card Preview</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Card flip */}
        <div style={{ width: 200, margin: '0 auto 20px', aspectRatio: '2/3', perspective: 1000, cursor: 'pointer' }} onClick={() => setFlipped(f => !f)}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', borderRadius: 18, boxShadow: `0 0 32px ${r.glow}, 0 16px 48px rgba(0,0,0,0.6)` }}>
            {/* Front */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${r.border}`, background: 'rgba(18,18,18,0.98)' }}>
              {frontImg ? (
                <img src={frontImg} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${r.glow} 0%, transparent 70%)`, fontSize: 56 }}>✦</div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />
            </div>
            {/* Back */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, overflow: 'hidden', border: `1.5px solid ${r.border}`, transform: 'rotateY(180deg)' }}>
              {backImg ? <img src={backImg} alt="back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <DefaultCardBack />}
            </div>
          </div>
        </div>

        {/* Flip button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button onClick={() => setFlipped(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <RotateCcw style={{ width: 12, height: 12 }} />
            {flipped ? 'Show Front' : backImg ? 'Flip to Back' : 'Flip Card'}
          </button>
        </div>

        {/* Card name + rarity */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{card.name}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6, color: r.color, border: `1px solid ${r.border}`, background: `${r.glow}30`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', textTransform: 'capitalize' }}>{SOURCE_LABEL[card.source_type] || card.source_type}</span>
            {card.event_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>{card.event_name}</span>}
            {card.sponsor_name && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,230,118,0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,230,118,0.2)', background: 'rgba(0,230,118,0.05)' }}>{card.sponsor_name}</span>}
          </div>
          {card.description && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '10px 0 0' }}>{card.description}</p>}
        </div>

        {/* Serial info */}
        {card.enable_serial_random && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: C.limeDim, border: `1px solid ${C.limeBorder}`, borderRadius: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(191,255,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Serial System</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.lime, fontFamily: 'monospace' }}>{card.serial_prefix || '—'}-{'1'.padStart(card.serial_digits || 4, '0')}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Digits: {card.serial_digits || 4}</span>
              {maxSupply > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Max: {maxSupply}</span>}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <StatPill label="Claimed" value={claimed} accent={C.lime} />
          {remaining !== null ? (
            <StatPill label="Remaining" value={remaining} accent={remaining === 0 ? 'rgba(255,80,80,1)' : 'rgba(80,160,255,1)'} />
          ) : (
            <StatPill label="Active Tokens" value={activeTokens.length} accent="rgba(80,160,255,1)" />
          )}
          <StatPill label="Tokens" value={activeTokens.length} accent="rgba(180,80,255,1)" />
        </div>

        {/* Card ID row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ flex: 1, fontSize: 10, color: C.muted, fontFamily: 'monospace', margin: 0, wordBreak: 'break-all', lineHeight: 1.5 }}>ID: {card.id}</p>
          <button onClick={handleCopyId} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: copiedId ? C.limeDim : 'rgba(255,255,255,0.06)', border: `1px solid ${copiedId ? C.limeBorder : 'rgba(255,255,255,0.1)'}`, color: copiedId ? C.lime : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {copiedId ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
            {copiedId ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
      </div>
    </div>
  );
}
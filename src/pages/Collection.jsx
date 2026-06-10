import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, QrCode } from 'lucide-react';
import CollectibleCard from '@/components/collectibles/CollectibleCard';
import ClaimQRSheet from '@/components/collectibles/ClaimQRSheet';

const C = {
  bg: '#0D0D0D',
  card: 'rgba(22,22,22,0.95)',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.08)',
  limeBorder: 'rgba(191,255,0,0.25)',
  muted: 'rgba(255,255,255,0.35)',
  text: '#fff',
  line: 'rgba(255,255,255,0.07)',
};

const RARITY_ORDER = ['founder', 'legendary', 'epic', 'rare', 'sponsor', 'common'];
const FILTERS = ['All', 'Owned', 'Locked'];
const RARITY_FILTERS = ['All', 'founder', 'legendary', 'epic', 'rare', 'sponsor', 'common'];

export default function Collection() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [showClaim, setShowClaim] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: allCards = [] } = useQuery({
    queryKey: ['all-cards'],
    queryFn: () => base44.entities.Cards.filter({ is_active: true }),
  });

  const { data: userCards = [], refetch: refetchUserCards } = useQuery({
    queryKey: ['user-cards', user?.id],
    queryFn: () => base44.entities.UserCards.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const ownedCardIds = useMemo(() => new Set(userCards.map(uc => uc.card_id)), [userCards]);

  const sortedCards = useMemo(() => {
    return [...allCards].sort((a, b) =>
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
    );
  }, [allCards]);

  const filtered = useMemo(() => {
    return sortedCards.filter(card => {
      const owned = ownedCardIds.has(card.id);
      if (filter === 'Owned' && !owned) return false;
      if (filter === 'Locked' && owned) return false;
      if (rarityFilter !== 'All' && card.rarity !== rarityFilter) return false;
      return true;
    });
  }, [sortedCards, ownedCardIds, filter, rarityFilter]);

  const ownedCount = ownedCardIds.size;
  const totalCount = allCards.length;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.bg, color: C.text, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 16px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: C.muted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 18, padding: 0,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Profile
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(191,255,0,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              BOOMX
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: '0 0 4px' }}>
              My Collection
            </h1>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              {ownedCount} / {totalCount} cards collected
            </p>
          </div>

          {/* Claim via QR */}
          <button
            onClick={() => setShowClaim(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 12,
              background: C.limeDim, border: `1px solid ${C.limeBorder}`,
              color: C.lime, fontSize: 12, fontWeight: 800,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <QrCode style={{ width: 15, height: 15 }} />
            Claim
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ margin: '0 20px 20px', height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: `linear-gradient(90deg, ${C.lime}, rgba(191,255,0,0.5))`,
          width: totalCount > 0 ? `${(ownedCount / totalCount) * 100}%` : '0%',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Status filter */}
      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20,
              border: filter === f ? `1.5px solid ${C.lime}` : '1.5px solid rgba(255,255,255,0.1)',
              background: filter === f ? C.limeDim : 'rgba(255,255,255,0.03)',
              color: filter === f ? C.lime : C.muted,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />
        {RARITY_FILTERS.map(r => (
          <button
            key={r}
            onClick={() => setRarityFilter(r)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20,
              border: rarityFilter === r ? '1.5px solid rgba(180,100,255,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
              background: rarityFilter === r ? 'rgba(180,100,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: rarityFilter === r ? 'rgba(200,140,255,1)' : 'rgba(255,255,255,0.35)',
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              textTransform: 'capitalize',
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div style={{ padding: '8px 20px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontSize: 14 }}>
            No cards match this filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {filtered.map(card => (
              <CollectibleCard
                key={card.id}
                card={card}
                owned={ownedCardIds.has(card.id)}
                small
              />
            ))}
          </div>
        )}
      </div>

      {/* Claim sheet */}
      {showClaim && (
        <ClaimQRSheet onClose={() => setShowClaim(false)} onClaimed={refetchUserCards} />
      )}
    </div>
  );
}
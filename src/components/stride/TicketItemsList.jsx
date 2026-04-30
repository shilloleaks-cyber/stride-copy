import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Package } from 'lucide-react';

const ITEM_TYPE_EMOJI = {
  apparel: '👕', gear: '🎒', consumable: '💧', voucher: '🎟️', benefit: '⭐', other: '📦',
};

// Fullscreen image lightbox
function ImageLightbox({ url, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{ position: 'relative', maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="item detail"
          style={{ width: '100%', borderRadius: 18, objectFit: 'contain', maxHeight: '82dvh', display: 'block' }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -12, right: -12,
            width: 32, height: 32, borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X style={{ width: 16, height: 16, color: '#0A0A0A' }} />
        </button>
      </div>
    </div>
  );
}

/**
 * Rich "Your Items" section for ticket screens.
 * Queries CategoryItem by registration.category_id so admin updates are always reflected.
 * Reads registration.item_selections to show selected variant labels.
 *
 * Props:
 *   categoryId      {string}  - registration.category_id
 *   itemSelections  {object}  - registration.item_selections  { [itemId]: 'included' | variantLabel }
 */
export default function TicketItemsList({ categoryId, itemSelections }) {
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ['category-items-ticket-rich', categoryId],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: categoryId }),
    enabled: !!categoryId,
    // Mirror the same filter as CategoryItemsPicker: only active items
    select: data => data.filter(i => i.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  });

  if (!itemSelections || Object.keys(itemSelections).length === 0) return null;
  if (items.length === 0) return null;

  // Only show items that appear in the registration's item_selections
  const selectedIds = new Set(Object.keys(itemSelections));
  const displayItems = items.filter(item => selectedIds.has(item.id));
  if (displayItems.length === 0) return null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayItems.map((item, idx) => {
          const selectionValue = itemSelections[item.id];
          const isIncluded = selectionValue === 'included' || !item.has_variant;
          const variantLabel = !isIncluded ? selectionValue : null;
          const isLast = idx === displayItems.length - 1;
          const emoji = ITEM_TYPE_EMOJI[item.item_type] || '📦';

          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 0',
                borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Thumbnail — detail image or emoji fallback */}
              {item.detail_image_url ? (
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => setLightboxUrl(item.detail_image_url)}
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', padding: 0, background: 'rgba(255,255,255,0.05)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <img
                      src={item.detail_image_url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                  {/* Eye icon — below thumbnail */}
                  <div style={{
                    width: 21, height: 21, borderRadius: 6,
                    background: 'rgba(90,30,160,0.45)',
                    border: '1px solid rgba(180,100,255,0.45)',
                    boxShadow: '0 0 6px rgba(150,80,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Eye style={{ width: 11, height: 11, color: 'rgba(210,160,255,1)' }} />
                  </div>
                </div>
              ) : (
                <div style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {emoji}
                </div>
              )}

              {/* Name + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.3 }}>
                  {item.name}
                </p>
                {item.description && (
                  <p style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0',
                    lineHeight: 1.55, whiteSpace: 'pre-line',
                  }}>
                    {item.description}
                  </p>
                )}
              </div>

              {/* Badge: variant or Included + Eye */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }}>
                {variantLabel ? (
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    padding: '4px 10px', borderRadius: 8,
                    background: 'rgba(191,255,0,0.1)', color: '#BFFF00',
                    border: '1px solid rgba(191,255,0,0.2)',
                    whiteSpace: 'nowrap',
                  }}>
                    {variantLabel}
                  </span>
                ) : (
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    padding: '4px 10px', borderRadius: 8,
                    background: 'rgba(0,210,110,0.1)', color: 'rgb(0,210,110)',
                    border: '1px solid rgba(0,210,110,0.2)',
                    whiteSpace: 'nowrap',
                  }}>
                    Included
                  </span>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}
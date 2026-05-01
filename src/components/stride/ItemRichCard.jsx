import React from 'react';
import { Eye } from 'lucide-react';

const ITEM_TYPE_EMOJI = {
  apparel: '👕', gear: '🎒', consumable: '💧', voucher: '🎟️', benefit: '⭐', other: '📦',
};

/**
 * Shared rich item display card used in both:
 * - CategoryItemsPicker (pre-registration)
 * - TicketItemsList (post-registration / ticket view)
 *
 * Props:
 *   item            {object}          - CategoryItem record
 *   variantLabel    {string|null}     - selected variant label (if any)
 *   isIncluded      {boolean}         - show "Included" badge
 *   needsChoice     {boolean}         - show "Choose required" warning state
 *   onImageTap      {function}        - called with image URL when tapped
 *   children        {ReactNode}       - optional slot for variant picker buttons
 */
export default function ItemRichCard({ item, variantLabel, isIncluded, needsChoice, onImageTap, children }) {
  const emoji = ITEM_TYPE_EMOJI[item.item_type] || '📦';
  const borderColor = needsChoice ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.08)';

  return (
    <div style={{
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${borderColor}`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header: name + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px 10px' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', margin: 0, flex: 1, minWidth: 0 }}>
          {item.name}
        </p>
        {variantLabel ? (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: 'rgba(191,255,0,0.1)', color: '#BFFF00', border: '1px solid rgba(191,255,0,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {variantLabel}
          </span>
        ) : isIncluded ? (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,210,110,0.1)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Included
          </span>
        ) : needsChoice ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,180,0,0.1)', color: 'rgba(255,180,0,0.9)', border: '1px solid rgba(255,180,0,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Choose required
          </span>
        ) : null}
      </div>

      {/* Image area */}
      {item.detail_image_url ? (
        <button
          type="button"
          onClick={() => onImageTap && onImageTap(item.detail_image_url)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px 10px',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ width: '100%', background: 'white', borderRadius: 12, padding: 8, boxShadow: '0 0 16px rgba(191,255,0,0.06)' }}>
            <img
              src={item.detail_image_url}
              alt={item.name}
              style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, display: 'block' }}
            />
          </div>
          <span style={{ marginTop: 7, fontSize: 11, color: 'rgba(180,120,255,0.8)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye style={{ width: 11, height: 11 }} /> Tap to view full image
          </span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 14px', fontSize: 38 }}>
          {emoji}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, padding: '0 14px 12px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {item.description}
        </p>
      )}

      {/* Slot for variant picker */}
      {children && (
        <div style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
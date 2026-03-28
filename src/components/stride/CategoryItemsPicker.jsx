import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Eye, X, CheckCircle2 } from 'lucide-react';

const ITEM_TYPE_EMOJI = {
  apparel: '👕', gear: '🎒', consumable: '💧', voucher: '🎟️', benefit: '⭐', other: '📦',
};

// Used inside RegistrationForm to show items and collect variant selections
// Returns selections object: { [itemId]: selectedVariant | 'included' }
export default function CategoryItemsPicker({ categoryId, selections, onChange, onValidation }) {
  const [viewingImage, setViewingImage] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['category-items', categoryId],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: categoryId }),
    enabled: !!categoryId,
    select: data => data.filter(i => i.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  });

  // Auto-populate non-variant items as 'included' when items load
  useEffect(() => {
    if (items.length === 0) return;
    const updates = {};
    items.forEach(item => {
      if (!item.has_variant && !selections[item.id]) {
        updates[item.id] = 'included';
      }
    });
    if (Object.keys(updates).length > 0) {
      onChange({ ...selections, ...updates });
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent whether any required variant items are unselected
  useEffect(() => {
    if (!onValidation) return;
    const missing = items.some(
      item => item.has_variant && item.is_required && item.variant_options?.length > 0 && !selections[item.id]
    );
    onValidation(missing);
  }, [items, selections, onValidation]);

  if (isLoading || items.length === 0) return null;

  const setSelection = (itemId, value) => {
    onChange({ ...selections, [itemId]: value });
  };

  return (
    <div>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontWeight: 700 }}>
        Included Items
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => {
          const selected = selections[item.id];
          const needsChoice = item.has_variant && item.is_required;
          const hasChosen = item.has_variant ? !!selected : true;
          return (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${needsChoice && !hasChosen ? 'rgba(255,180,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 14, padding: '12px 14px',
            }}>
              {/* Item header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: item.has_variant ? 10 : 0 }}>
                <span style={{ fontSize: 20 }}>{ITEM_TYPE_EMOJI[item.item_type] || '📦'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{item.name}</p>
                    {!item.has_variant && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,210,110,0.12)', color: 'rgb(0,210,110)' }}>Included</span>
                    )}
                    {item.has_variant && hasChosen && (
                      <CheckCircle2 style={{ width: 14, height: 14, color: '#BFFF00', flexShrink: 0 }} />
                    )}
                    {needsChoice && !hasChosen && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,180,0,0.1)', color: 'rgba(255,180,0,0.9)' }}>Choose required</span>
                    )}
                  </div>
                  {item.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{item.description}</p>}
                </div>
                {item.detail_image_url && (
                  <button type="button" onClick={() => setViewingImage(item.detail_image_url)}
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)' }}>
                    <Eye style={{ width: 14, height: 14, color: '#c084fc' }} />
                  </button>
                )}
              </div>

              {/* Variant picker */}
              {item.has_variant && item.variant_options?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {item.variant_options.map(opt => (
                    <button key={opt} type="button" onClick={() => setSelection(item.id, opt)}
                      style={{
                        padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        ...(selected === opt
                          ? { background: '#BFFF00', color: '#0A0A0A', border: 'none' }
                          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }
                        ),
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail image lightbox */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
            <img src={viewingImage} alt="item detail" style={{ width: '100%', borderRadius: 16, objectFit: 'contain', maxHeight: '82dvh' }} />
            <button onClick={() => setViewingImage(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: 16, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16, color: '#0A0A0A' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
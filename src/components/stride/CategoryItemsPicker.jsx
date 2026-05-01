import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import ItemRichCard from '@/components/stride/ItemRichCard';

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

// Used inside RegistrationForm to show items and collect variant selections
// Returns selections object: { [itemId]: selectedVariant | 'included' }
export default function CategoryItemsPicker({ categoryId, selections, onChange, onValidation }) {
  const [lightboxUrl, setLightboxUrl] = useState(null);
  // Keep a ref to always read fresh selections inside the items-load effect
  const selectionsRef = useRef(selections);
  selectionsRef.current = selections;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['category-items', categoryId],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: categoryId }),
    enabled: !!categoryId,
    select: data => data.filter(i => i.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  });

  // Auto-populate non-variant items as 'included' when items load
  useEffect(() => {
    if (items.length === 0) return;
    const currentSelections = selectionsRef.current;
    const updates = {};
    items.forEach(item => {
      if (!item.has_variant && !currentSelections[item.id]) {
        updates[item.id] = 'included';
      }
    });
    if (Object.keys(updates).length > 0) {
      onChangeRef.current({ ...currentSelections, ...updates });
    }
  }, [items]);

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(item => {
          const selected = selections[item.id];
          const needsChoice = item.has_variant && item.is_required && !selected;
          const hasChosen = item.has_variant ? !!selected : true;
          const isIncluded = !item.has_variant;
          const variantLabel = item.has_variant && selected ? selected : null;

          return (
            <ItemRichCard
              key={item.id}
              item={item}
              variantLabel={variantLabel}
              isIncluded={isIncluded}
              needsChoice={needsChoice}
              onImageTap={setLightboxUrl}
            >
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
            </ItemRichCard>
          );
        })}
      </div>

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
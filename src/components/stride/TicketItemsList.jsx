import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
    select: data => data.filter(i => i.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  });

  if (!itemSelections || Object.keys(itemSelections).length === 0) return null;
  if (items.length === 0) return null;

  const selectedIds = new Set(Object.keys(itemSelections));
  const displayItems = items.filter(item => selectedIds.has(item.id));
  if (displayItems.length === 0) return null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
        {displayItems.map((item) => {
          const selectionValue = itemSelections[item.id];
          const isIncluded = selectionValue === 'included' || !item.has_variant;
          const variantLabel = !isIncluded ? selectionValue : null;

          return (
            <ItemRichCard
              key={item.id}
              item={item}
              variantLabel={variantLabel}
              isIncluded={isIncluded}
              onImageTap={setLightboxUrl}
            />
          );
        })}
      </div>

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import CategoryItemsManager from '@/components/stride/CategoryItemsManager';

export default function CreateEventCategoryCard({ cat, itemCount, onEdit, onDelete, onItemsChanged }) {
  const [expanded, setExpanded] = useState(false);
  const hasNoItems = itemCount === 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      borderLeft: `3px solid ${cat.color || '#BFFF00'}`,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
            {cat.distance_km ? `${cat.distance_km} km · ` : ''}
            {cat.price === 0 ? 'Free' : `฿${cat.price}`}
            {cat.max_slots > 0 ? ` · ${cat.max_slots} slots` : ''}
          </p>
          <div style={{ marginTop: 6 }}>
            {hasNoItems ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.2)', color: 'rgba(255,180,0,0.85)' }}>
                ⚠️ No included items yet
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.2)', color: '#BFFF00' }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''} included
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button type="button" onClick={() => onEdit(cat)}
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.2)' }}>
            <Pencil style={{ width: 12, height: 12, color: '#c084fc' }} />
          </button>
          <button type="button" onClick={() => onDelete(cat)}
            style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.18)' }}>
            <Trash2 style={{ width: 12, height: 12, color: 'rgba(255,100,100,0.7)' }} />
          </button>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '8px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
          color: expanded ? '#BFFF00' : 'rgba(255,255,255,0.38)',
        }}
      >
        {expanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
        {expanded ? 'Hide Included Items' : 'Manage Included Items'}
      </button>

      {/* Inline items manager */}
      {expanded && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <CategoryItemsManager categoryId={cat.id} onItemsChanged={onItemsChanged} />
        </div>
      )}
    </div>
  );
}
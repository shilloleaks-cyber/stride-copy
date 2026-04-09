import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import CreateEventCategoryForm from '@/components/stride/CreateEventCategoryForm';
import CreateEventCategoryCard from '@/components/stride/CreateEventCategoryCard';

export default function CategoriesWithItemsManager({ eventId, onCategoryCountChange }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const { data: eventData } = useQuery({
    queryKey: ['stride-event-data', eventId],
    queryFn: async () => { const r = await base44.entities.StrideEvent.filter({ id: eventId }); return r[0] || null; },
    enabled: !!eventId,
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId, is_active: true }),
    enabled: !!eventId,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['all-category-items-create', eventId],
    queryFn: async () => {
      if (categories.length === 0) return [];
      const results = await Promise.all(
        categories.map(c => base44.entities.CategoryItem.filter({ event_category_id: c.id, is_active: true }))
      );
      return results.flat();
    },
    enabled: categories.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
    queryClient.invalidateQueries({ queryKey: ['all-category-items-create', eventId] });
    queryClient.invalidateQueries({ queryKey: ['stride-event-data', eventId] });
  };

  useEffect(() => {
    if (onCategoryCountChange) onCategoryCountChange(categories.length);
  }, [categories.length]);

  const handleSaved = () => {
    invalidate();
    setShowAddForm(false);
    setEditingCat(null);
  };

  const handleDelete = async (cat) => {
    await base44.entities.EventCategory.update(cat.id, { is_active: false });
    invalidate();
  };

  const getItemCount = (catId) => allItems.filter(i => i.event_category_id === catId).length;
  const catsWithNoItems = categories.filter(c => getItemCount(c.id) === 0);

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading…</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Category cards */}
      {categories.map(cat =>
        editingCat?.id === cat.id ? (
          <CreateEventCategoryForm
            key={cat.id}
            eventId={eventId}
            eventData={eventData}
            existingCategories={categories}
            initial={editingCat}
            editingId={cat.id}
            onSaved={handleSaved}
            onCancel={() => setEditingCat(null)}
          />
        ) : (
          <CreateEventCategoryCard
            key={cat.id}
            cat={cat}
            itemCount={getItemCount(cat.id)}
            onEdit={(c) => setEditingCat({
              ...c,
              distance_km: c.distance_km != null ? String(c.distance_km) : '',
              price: c.price != null ? String(c.price) : '',
              max_slots: c.max_slots != null ? String(c.max_slots) : '',
              bib_prefix: c.bib_prefix || '',
              bib_start: String(c.bib_start || 1),
            })}
            onDelete={handleDelete}
          />
        )
      )}

      {/* Add new category form */}
      {showAddForm && (
        <CreateEventCategoryForm
          eventId={eventId}
          eventData={eventData}
          existingCategories={categories}
          editingId={null}
          onSaved={handleSaved}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Add button */}
      {!showAddForm && !editingCat && (
        <button type="button" onClick={() => setShowAddForm(true)}
          style={{ width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(191,255,0,0.06)', border: '1px dashed rgba(191,255,0,0.25)', color: 'rgba(191,255,0,0.7)' }}>
          + Add Race Category
        </button>
      )}

      {categories.length === 0 && !showAddForm && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', padding: '6px 0' }}>
          No categories yet — add at least one before publishing
        </p>
      )}

      {/* Warning for categories with no items */}
      {catsWithNoItems.length > 0 && categories.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 11, background: 'rgba(255,180,0,0.05)', border: '1px solid rgba(255,180,0,0.15)' }}>
          <AlertTriangle style={{ width: 13, height: 13, color: 'rgba(255,180,0,0.8)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'rgba(255,180,0,0.75)', margin: 0, lineHeight: 1.6 }}>
            {catsWithNoItems.map(c => c.name).join(', ')} {catsWithNoItems.length === 1 ? 'has' : 'have'} no included items yet. You can still publish — items are optional.
          </p>
        </div>
      )}
    </div>
  );
}
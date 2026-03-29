import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, ImagePlus, X, CheckCircle2, Globe,
  ChevronDown, ChevronUp, Pencil, Trash2, AlertTriangle,
} from 'lucide-react';
import CategoryItemsManager from '@/components/stride/CategoryItemsManager';

// ─── Inline Category Form ────────────────────────────────────────────────────
function CategoryForm({ eventId, existingCategories, initial, editingId, onSaved, onCancel }) {
  const isEdit = !!editingId;
  const [form, setForm] = useState(initial || { name: '', distance_km: '', price: '', max_slots: '', bib_prefix: '', bib_start: '1', color: '#BFFF00' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const isDup = existingCategories.some(
      c => c.name.trim().toLowerCase() === form.name.trim().toLowerCase() && c.id !== editingId
    );
    if (isDup) { alert('A category with this name already exists.'); return; }
    setSaving(true);
    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
      price: form.price !== '' ? parseFloat(form.price) : 0,
      max_slots: form.max_slots !== '' ? parseInt(form.max_slots) : 0,
      bib_prefix: form.bib_prefix.trim() || null,
      bib_start: parseInt(form.bib_start) || 1,
      color: form.color,
      is_active: true,
    };
    if (isEdit) {
      await base44.entities.EventCategory.update(editingId, payload);
    } else {
      await base44.entities.EventCategory.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  const inp = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10, color: 'white', padding: '10px 12px',
    width: '100%', outline: 'none', fontSize: 13, boxSizing: 'border-box',
  };
  const lbl = {
    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 5,
  };

  return (
    <div style={{
      background: isEdit ? 'rgba(138,43,226,0.05)' : 'rgba(191,255,0,0.04)',
      border: `1px solid ${isEdit ? 'rgba(138,43,226,0.25)' : 'rgba(191,255,0,0.18)'}`,
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 11,
    }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: isEdit ? '#c084fc' : '#BFFF00', margin: 0 }}>
        {isEdit ? '✏️ Edit Category' : '＋ New Category'}
      </p>

      <div>
        <label style={lbl}>Category Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 10K, Half Marathon" style={inp} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Distance (km)</label>
          <input type="number" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} placeholder="e.g. 10" min="0" style={inp} />
        </div>
        <div>
          <label style={lbl}>Price (THB)</label>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0 = free" min="0" style={inp} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Max Slots</label>
          <input type="number" value={form.max_slots} onChange={e => set('max_slots', e.target.value)} placeholder="0 = unlimited" min="0" style={inp} />
        </div>
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 40, height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{form.color}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>Bib Prefix</label>
          <input value={form.bib_prefix} onChange={e => set('bib_prefix', e.target.value)} placeholder="e.g. A, VIP" maxLength={5} style={inp} />
        </div>
        <div>
          <label style={lbl}>Bib Start #</label>
          <input type="number" value={form.bib_start} onChange={e => set('bib_start', e.target.value)} min="1" style={inp} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: isEdit ? 'rgba(138,43,226,0.12)' : 'rgba(191,255,0,0.1)',
            border: isEdit ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(191,255,0,0.3)',
            color: isEdit ? '#c084fc' : '#BFFF00',
          }}>
          {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}

// ─── Category Card (with expand/collapse items) ───────────────────────────────
function CategoryCard({ cat, allCategories, onEdit, onDelete, itemCount }) {
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
      {/* Category header row */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
            {cat.distance_km ? `${cat.distance_km} km · ` : ''}
            {cat.price === 0 ? 'Free' : `฿${cat.price}`}
            {cat.max_slots > 0 ? ` · ${cat.max_slots} slots` : ''}
          </p>
          {/* Item count badge */}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
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

      {/* Expand/collapse items toggle */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '8px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,0.04)' : 'transparent',
          borderTop: '1px solid rgba(255,255,255,0.06)', border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: expanded ? '#BFFF00' : 'rgba(255,255,255,0.38)',
        }}
      >
        {expanded ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
        {expanded ? 'Hide Included Items' : 'Manage Included Items'}
      </button>

      {/* Inline items manager */}
      {expanded && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <CategoryItemsManager categoryId={cat.id} />
        </div>
      )}
    </div>
  );
}

// ─── Categories + Items Manager (Phase 2 section) ────────────────────────────
function CategoriesWithItemsManager({ eventId, onCategoryCountChange }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId, is_active: true }),
    enabled: !!eventId,
  });

  // Fetch item counts per category to drive the warning badges
  const { data: allItems = [] } = useQuery({
    queryKey: ['all-category-items', eventId],
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
    queryClient.invalidateQueries({ queryKey: ['all-category-items', eventId] });
  };

  React.useEffect(() => {
    onCategoryCountChange(categories.length);
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

  if (isLoading) return <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Category cards */}
      {categories.map(cat => (
        editingCat?.id === cat.id ? (
          <CategoryForm
            key={cat.id}
            eventId={eventId}
            existingCategories={categories}
            initial={editingCat}
            editingId={cat.id}
            onSaved={handleSaved}
            onCancel={() => setEditingCat(null)}
          />
        ) : (
          <CategoryCard
            key={cat.id}
            cat={cat}
            allCategories={categories}
            itemCount={getItemCount(cat.id)}
            onEdit={(c) => setEditingCat({ ...c, distance_km: c.distance_km != null ? String(c.distance_km) : '', price: c.price != null ? String(c.price) : '', max_slots: c.max_slots != null ? String(c.max_slots) : '', bib_prefix: c.bib_prefix || '', bib_start: String(c.bib_start || 1) })}
            onDelete={handleDelete}
          />
        )
      ))}

      {/* Add new category form */}
      {showAddForm && (
        <CategoryForm
          eventId={eventId}
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

      {/* Warning: categories with no items */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState('form'); // 'form' | 'categories'
  const [draftEvent, setDraftEvent] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [categoryCount, setCategoryCount] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', location_name: '', event_date: '', max_participants: '', banner_image: '',
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  if (!userLoading && user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold mb-2">Admin Only</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setBannerPreview(URL.createObjectURL(file));
    const result = await base44.integrations.Core.UploadFile({ file });
    handleChange('banner_image', result.file_url);
    setIsUploadingBanner(false);
  };

  const clearBanner = () => { setBannerPreview(null); handleChange('banner_image', ''); };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !user) return;
    setIsSavingDraft(true);
    const datePart = form.event_date.split('T')[0];
    const timePart = form.event_date.split('T')[1]?.slice(0, 5) || '';
    const created = await base44.entities.StrideEvent.create({
      title: form.title,
      description: form.description,
      banner_image: form.banner_image,
      location_name: form.location_name,
      event_date: datePart,
      start_time: timePart,
      max_participants: form.max_participants ? parseInt(form.max_participants) : 0,
      visibility: 'public',
      event_type: 'official',
      creator_email: user.email,
      status: 'draft',
    });
    setIsSavingDraft(false);
    if (created?.id) { setDraftEvent(created); setPhase('categories'); }
  };

  const handlePublish = async () => {
    if (!draftEvent?.id) return;
    setIsPublishing(true);
    await base44.entities.StrideEvent.update(draftEvent.id, { status: 'open' });
    queryClient.invalidateQueries({ queryKey: ['stride-events'] });
    queryClient.invalidateQueries({ queryKey: ['stride-events-drafts'] });
    setIsPublishing(false);
    navigate(`/StrideEventDetail?id=${draftEvent.id}`);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px', color: 'white', padding: '13px 16px',
    width: '100%', outline: 'none', fontSize: '15px', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
    letterSpacing: '0.10em', marginBottom: '8px', display: 'block', fontWeight: 700,
  };

  const formDisabled = isSavingDraft || !form.title || !form.event_date;
  const hasCategories = categoryCount > 0;

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Header */}
      <div
        className="sticky top-0 z-50 px-5 pb-4 flex items-center gap-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          backgroundColor: 'rgba(10,10,10,0.96)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <button type="button" onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Admin · Official</p>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, marginTop: 1 }}>Create Official Event</h1>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {['Event Info', 'Categories & Items'].map((label, i) => {
            const stepNum = i + 1;
            const active = (phase === 'form' && stepNum === 1) || (phase === 'categories' && stepNum === 2);
            const done = (phase === 'categories' && stepNum === 1);
            return (
              <React.Fragment key={stepNum}>
                {i > 0 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.15)' }} />}
                <div style={{
                  width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  background: done ? 'rgba(0,210,110,0.2)' : active ? '#BFFF00' : 'rgba(255,255,255,0.08)',
                  color: done ? 'rgb(0,210,110)' : active ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
                }}>
                  {done ? '✓' : stepNum}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── PHASE 1: Event Details ── */}
      {phase === 'form' && (
        <form onSubmit={handleSaveDraft} style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div>
            <label style={labelStyle}>Event Title *</label>
            <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. BoomX City Run 2026" required style={inputStyle} />
          </div>

          {/* Banner */}
          <div>
            <label style={labelStyle}>Banner Image</label>
            {bannerPreview ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                {isUploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#BFFF00' }} />
                  </div>
                )}
                {!isUploadingBanner && (
                  <button type="button" onClick={clearBanner} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', height: 110 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImagePlus style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Upload banner image</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: '3px 0 0' }}>Recommended: 1200 × 600 px</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
              </label>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => handleChange('description', e.target.value)}
              placeholder="Tell participants about this event…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input type="text" value={form.location_name} onChange={e => handleChange('location_name', e.target.value)}
              placeholder="e.g. Lumpini Park, Bangkok" style={inputStyle} />
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          <div>
            <label style={labelStyle}>Date &amp; Time *</label>
            <input type="datetime-local" value={form.event_date} onChange={e => handleChange('event_date', e.target.value)}
              required style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={labelStyle}>Max Participants</label>
            <input type="number" value={form.max_participants} onChange={e => handleChange('max_participants', e.target.value)}
              placeholder="Leave blank or 0 for unlimited" min="0" style={inputStyle} />
          </div>

          <div style={{ padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📋</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
              Saves as a draft first. You'll add race categories &amp; included items next, then publish.
            </p>
          </div>

          <div style={{ paddingBottom: 16 }}>
            <button type="submit" disabled={formDisabled} style={{
              width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
              fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: formDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.18s ease',
              ...(formDisabled
                ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }
                : { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00', boxShadow: '0 0 24px rgba(191,255,0,0.1)' }
              ),
            }}>
              {isSavingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSavingDraft ? 'Saving Draft…' : 'Save Draft & Setup Categories →'}
            </button>
          </div>
        </form>
      )}

      {/* ── PHASE 2: Categories + Items + Publish ── */}
      {phase === 'categories' && draftEvent && (
        <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Draft saved confirmation */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,110,0.07)', border: '1px solid rgba(0,210,110,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: 'rgb(0,210,110)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'rgb(0,210,110)', margin: 0 }}>Draft Saved</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }} className="truncate">"{draftEvent.title}"</p>
            </div>
          </div>

          {/* Section header */}
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Race Categories &amp; Included Items</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              Add each race distance/tier. Then expand it to add shirts, medals, vouchers, or any other included items.
            </p>
          </div>

          {/* Inline categories + items manager */}
          <CategoriesWithItemsManager
            eventId={draftEvent.id}
            onCategoryCountChange={setCategoryCount}
          />

          {/* Publish readiness banner */}
          <div style={{
            padding: '13px 16px', borderRadius: 14,
            background: hasCategories ? 'rgba(191,255,0,0.05)' : 'rgba(255,180,0,0.05)',
            border: `1px solid ${hasCategories ? 'rgba(191,255,0,0.18)' : 'rgba(255,180,0,0.18)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{hasCategories ? '🏁' : '⚠️'}</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: hasCategories ? 'rgba(191,255,0,0.75)' : 'rgba(255,180,0,0.85)', margin: 0, lineHeight: 1.6 }}>
              {hasCategories
                ? `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} ready. Publish to open registration.`
                : 'Add at least one race category before publishing so participants can register.'
              }
            </p>
          </div>

          {/* Publish button */}
          <div style={{ paddingBottom: 16 }}>
            <button type="button" onClick={handlePublish} disabled={isPublishing || !hasCategories}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 16,
                fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: (isPublishing || !hasCategories) ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                ...((isPublishing || !hasCategories)
                  ? { background: 'rgba(255,255,255,0.07)', border: '1px solid transparent', color: 'rgba(255,255,255,0.25)' }
                  : { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00', boxShadow: '0 0 24px rgba(191,255,0,0.1)' }
                ),
              }}>
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {isPublishing ? 'Publishing…' : 'Publish Official Event'}
            </button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 10 }}>
              Categories and items can be edited anytime after publishing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
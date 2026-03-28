import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X, CheckCircle2, Globe } from 'lucide-react';
import CategoryItemsManager from '@/components/stride/CategoryItemsManager';

export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState('form'); // 'form' | 'categories'
  const [draftEvent, setDraftEvent] = useState(null); // saved StrideEvent record
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location_name: '',
    event_date: '',
    max_participants: '',
    banner_image: '',
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Track how many active categories exist for this draft (for publish helper text)
  const { data: draftCategories = [] } = useQuery({
    queryKey: ['event-categories', draftEvent?.id],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: draftEvent.id, is_active: true }),
    enabled: !!draftEvent?.id,
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

  const clearBanner = () => {
    setBannerPreview(null);
    handleChange('banner_image', '');
  };

  // Phase 1: Save as Draft
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
    if (created?.id) {
      setDraftEvent(created);
      setPhase('categories');
    }
  };

  // Phase 2: Publish
  const handlePublish = async () => {
    if (!draftEvent?.id) return;
    setIsPublishing(true);
    await base44.entities.StrideEvent.update(draftEvent.id, { status: 'open' });
    queryClient.invalidateQueries({ queryKey: ['stride-events'] });
    setIsPublishing(false);
    navigate(`/StrideEventDetail?id=${draftEvent.id}`);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '14px',
    color: 'white',
    padding: '13px 16px',
    width: '100%',
    outline: 'none',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.38)',
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    marginBottom: '8px',
    display: 'block',
    fontWeight: 700,
  };

  const formDisabled = isSavingDraft || !form.title || !form.event_date;
  const hasCategories = draftCategories.length > 0;

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
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Admin · Official
          </p>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, marginTop: 1 }}>Create Official Event</h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800,
            background: phase === 'form' ? '#BFFF00' : 'rgba(191,255,0,0.2)',
            color: phase === 'form' ? '#0A0A0A' : '#BFFF00',
          }}>1</div>
          <div style={{ width: 12, height: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{
            width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800,
            background: phase === 'categories' ? '#BFFF00' : 'rgba(255,255,255,0.08)',
            color: phase === 'categories' ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
          }}>2</div>
        </div>
      </div>

      {/* ── PHASE 1: Event Details Form ── */}
      {phase === 'form' && (
        <form onSubmit={handleSaveDraft} style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div>
            <label style={labelStyle}>Event Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. BoomX City Run 2026"
              required
              style={inputStyle}
            />
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
              <label
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', height: 110 }}
              >
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
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Tell participants about this event…"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={form.location_name}
              onChange={e => handleChange('location_name', e.target.value)}
              placeholder="e.g. Lumpini Park, Bangkok"
              style={inputStyle}
            />
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          <div>
            <label style={labelStyle}>Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={e => handleChange('event_date', e.target.value)}
              required
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Max Participants</label>
            <input
              type="number"
              value={form.max_participants}
              onChange={e => handleChange('max_participants', e.target.value)}
              placeholder="Leave blank or 0 for unlimited"
              min="0"
              style={inputStyle}
            />
          </div>

          {/* Info notice */}
          <div style={{ padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📋</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
              Saves as a draft first. You'll add race categories next, then choose when to publish.
            </p>
          </div>

          <div style={{ paddingBottom: 16 }}>
            <button
              type="submit"
              disabled={formDisabled}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
                fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: formDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                ...(formDisabled
                  ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)' }
                  : { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00', boxShadow: '0 0 24px rgba(191,255,0,0.1)' }
                ),
              }}
            >
              {isSavingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSavingDraft ? 'Saving Draft…' : 'Save Draft & Add Categories →'}
            </button>
          </div>
        </form>
      )}

      {/* ── PHASE 2: Categories + Publish ── */}
      {phase === 'categories' && draftEvent && (
        <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Draft saved banner */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,110,0.07)', border: '1px solid rgba(0,210,110,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: 'rgb(0,210,110)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'rgb(0,210,110)', margin: 0 }}>Draft Saved</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }} className="truncate">"{draftEvent.title}"</p>
            </div>
          </div>

          {/* Categories section */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>Race Categories</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', lineHeight: 1.5 }}>
                Add 5K, 10K, Half Marathon, VIP tiers — each with price, slots, and bib settings.
              </p>
            </div>
            <CategoryItemsManagerWrapper eventId={draftEvent.id} />
          </div>

          {/* Publish helper text */}
          <div style={{
            padding: '13px 16px', borderRadius: 14,
            background: hasCategories ? 'rgba(191,255,0,0.05)' : 'rgba(255,180,0,0.05)',
            border: `1px solid ${hasCategories ? 'rgba(191,255,0,0.18)' : 'rgba(255,180,0,0.18)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{hasCategories ? '🏁' : '⚠️'}</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: hasCategories ? 'rgba(191,255,0,0.75)' : 'rgba(255,180,0,0.85)', margin: 0, lineHeight: 1.6 }}>
              {hasCategories
                ? `${draftCategories.length} ${draftCategories.length === 1 ? 'category' : 'categories'} added. You can publish now — registration will be open to participants.`
                : 'This event can be published now, but registration will remain unavailable until at least one category is added.'
              }
            </p>
          </div>

          {/* Publish button */}
          <div style={{ paddingBottom: 16 }}>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 16, border: 'none',
                fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: isPublishing ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                background: isPublishing ? 'rgba(255,255,255,0.07)' : 'rgba(191,255,0,0.12)',
                border: isPublishing ? 'none' : '1px solid rgba(191,255,0,0.35)',
                color: isPublishing ? 'rgba(255,255,255,0.25)' : '#BFFF00',
                boxShadow: isPublishing ? 'none' : '0 0 24px rgba(191,255,0,0.1)',
              }}
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {isPublishing ? 'Publishing…' : 'Publish Official Event'}
            </button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 10 }}>
              You can always add or edit categories after publishing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper that uses EventCategory management (not CategoryItemsManager which is per-category-items)
// This shows the full category list for an event, reusing ManageCategories logic inline
function CategoryItemsManagerWrapper({ eventId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', distance_km: '', price: '', max_slots: '', bib_prefix: '', bib_start: '1', color: '#BFFF00' });
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId, is_active: true }),
    enabled: !!eventId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await base44.entities.EventCategory.create({
      event_id: eventId,
      name: form.name.trim(),
      distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
      price: form.price ? parseFloat(form.price) : 0,
      max_slots: form.max_slots ? parseInt(form.max_slots) : 0,
      bib_prefix: form.bib_prefix.trim() || null,
      bib_start: parseInt(form.bib_start) || 1,
      color: form.color,
      is_active: true,
    });
    setSaving(false);
    setForm({ name: '', distance_km: '', price: '', max_slots: '', bib_prefix: '', bib_start: '1', color: '#BFFF00' });
    setShowForm(false);
    invalidate();
  };

  const handleDelete = async (cat) => {
    await base44.entities.EventCategory.delete(cat.id);
    invalidate();
  };

  const inp = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10, color: 'white', padding: '10px 12px',
    width: '100%', outline: 'none', fontSize: 13, boxSizing: 'border-box',
  };
  const lbl = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 5 };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Existing categories */}
      {categories.map(cat => (
        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${cat.color || '#BFFF00'}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>
              {cat.distance_km ? `${cat.distance_km} km · ` : ''}{cat.price === 0 ? 'Free' : `฿${cat.price}`}{cat.max_slots > 0 ? ` · ${cat.max_slots} slots` : ''}
            </p>
          </div>
          <button type="button" onClick={() => handleDelete(cat)} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)', flexShrink: 0 }}>
            <X style={{ width: 12, height: 12, color: 'rgba(255,100,100,0.7)' }} />
          </button>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div style={{ background: 'rgba(191,255,0,0.04)', border: '1px solid rgba(191,255,0,0.18)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div>
            <label style={lbl}>Category Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 10K, Half Marathon" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Distance (km)</label>
              <input type="number" value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="e.g. 10" min="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Price (THB)</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0 = free" min="0" style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={lbl}>Max Slots</label>
              <input type="number" value={form.max_slots} onChange={e => setForm(f => ({ ...f, max_slots: e.target.value }))} placeholder="0 = unlimited" min="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 38, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{form.color}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }}>
              Cancel
            </button>
            <button type="button" onClick={handleAdd} disabled={saving || !form.name.trim()} style={{ flex: 2, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00' }}>
              {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              {saving ? 'Saving…' : 'Add Category'}
            </button>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} style={{ width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(191,255,0,0.06)', border: '1px dashed rgba(191,255,0,0.25)', color: 'rgba(191,255,0,0.7)' }}>
          + Add Race Category
        </button>
      )}

      {categories.length === 0 && !showForm && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', padding: '6px 0' }}>
          No categories yet — you can publish now and add them later
        </p>
      )}
    </div>
  );
}
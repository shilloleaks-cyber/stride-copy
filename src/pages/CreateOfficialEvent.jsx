import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X, CheckCircle2, Globe } from 'lucide-react';
import CategoriesWithItemsManager from '@/components/stride/CategoriesWithItemsManager';

export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check for existing draft being resumed via ?event_id=
  const urlParams = new URLSearchParams(window.location.search);
  const editEventId = urlParams.get('event_id');
  const isEditMode = !!editEventId;

  const [phase, setPhase] = useState('form'); // 'form' | 'categories'
  const [draftEvent, setDraftEvent] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [categoryCount, setCategoryCount] = useState(0);
  const [paymentBlocking, setPaymentBlocking] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', location_name: '', event_date: '', max_participants: '', banner_image: '',
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Load existing draft if editing
  const { data: existingDraft, isLoading: draftLoading } = useQuery({
    queryKey: ['draft-event-edit', editEventId],
    queryFn: () => base44.entities.StrideEvent.filter({ id: editEventId }),
    enabled: isEditMode,
  });

  const { data: existingCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['event-categories-edit', editEventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: editEventId, is_active: true }),
    enabled: isEditMode,
  });

  // Wait for BOTH draft AND categories to finish loading before prefilling
  useEffect(() => {
    if (!isEditMode || draftLoaded) return;
    if (draftLoading || categoriesLoading) return; // wait for both
    const draft = existingDraft?.[0];
    if (!draft) return;

    const dateStr = draft.event_date
      ? `${draft.event_date}${draft.start_time ? 'T' + draft.start_time : 'T00:00'}`
      : '';

    setForm({
      title: draft.title || '',
      description: draft.description || '',
      location_name: draft.location_name || '',
      event_date: dateStr,
      max_participants: draft.max_participants ? String(draft.max_participants) : '',
      banner_image: draft.banner_image || '',
    });

    if (draft.banner_image) setBannerPreview(draft.banner_image);
    setDraftEvent(draft);
    setDraftLoaded(true);

    // Resume at step 2 only if categories are confirmed to exist
    if (existingCategories && existingCategories.length > 0) {
      setPhase('categories');
    }
  }, [existingDraft, existingCategories, draftLoading, categoriesLoading, isEditMode, draftLoaded]);

  if (!userLoading && user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold mb-2">Admin Only</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  // Show loading spinner while fetching draft + categories
  if (isEditMode && (draftLoading || categoriesLoading || !draftLoaded)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#BFFF00' }} />
        <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading draft…</p>
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

  const buildPayload = () => {
    const datePart = form.event_date.split('T')[0];
    const timePart = form.event_date.split('T')[1]?.slice(0, 5) || '';
    return {
      title: form.title,
      description: form.description,
      banner_image: form.banner_image,
      location_name: form.location_name,
      event_date: datePart,
      start_time: timePart,
      max_participants: form.max_participants ? parseInt(form.max_participants) : 0,
      visibility: 'public',
      event_type: 'official',
      status: 'draft',
    };
  };

  // Create new draft (Step 1 for a brand-new event)
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !user) return;
    setIsSavingDraft(true);
    const created = await base44.entities.StrideEvent.create({
      ...buildPayload(),
      creator_email: user.email,
    });
    setIsSavingDraft(false);
    if (created?.id) { setDraftEvent(created); setPhase('categories'); }
  };

  // Update existing draft then advance to step 2 (edit mode Step 1)
  const handleUpdateAndContinue = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !draftEvent?.id) return;
    setIsUpdatingDraft(true);
    const updated = await base44.entities.StrideEvent.update(draftEvent.id, buildPayload());
    queryClient.invalidateQueries({ queryKey: ['stride-events-drafts'] });
    setIsUpdatingDraft(false);
    setDraftEvent(prev => ({ ...prev, ...buildPayload() }));
    setPhase('categories');
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

  const saving = isSavingDraft || isUpdatingDraft;
  const formDisabled = saving || !form.title || !form.event_date;
  const hasCategories = categoryCount > 0;
  const canPublish = hasCategories && !paymentBlocking;

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>

      {/* Header */}
      <div className="sticky top-0 z-50 px-5 pb-4 flex items-center gap-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', backgroundColor: 'rgba(10,10,10,0.96)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(14px)' }}>
        <button type="button" onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Admin · Official</p>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, marginTop: 1 }}>
            {isEditMode ? 'Edit Draft Event' : 'Create Official Event'}
          </h1>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {[1, 2].map((stepNum, i) => {
            const active = (phase === 'form' && stepNum === 1) || (phase === 'categories' && stepNum === 2);
            const done = phase === 'categories' && stepNum === 1;
            return (
              <React.Fragment key={stepNum}>
                {i > 0 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.15)' }} />}
                <button
                  type="button"
                  onClick={() => {
                    if (stepNum === 1 && phase === 'categories') setPhase('form');
                  }}
                  style={{
                    width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, border: 'none',
                    cursor: stepNum === 1 && phase === 'categories' ? 'pointer' : 'default',
                    background: done ? 'rgba(0,210,110,0.2)' : active ? '#BFFF00' : 'rgba(255,255,255,0.08)',
                    color: done ? 'rgb(0,210,110)' : active ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {done ? '✓' : stepNum}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── PHASE 1: Event Details ── */}
      {phase === 'form' && (
        <form onSubmit={isEditMode ? handleUpdateAndContinue : handleSaveDraft}
          style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>

          <div>
            <label style={labelStyle}>Event Title *</label>
            <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. BoomX City Run 2026" required style={inputStyle} />
          </div>

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
                  <button type="button" onClick={clearBanner} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
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

          {!isEditMode && (
            <div style={{ padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📋</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
                Saves as a draft first. You'll add race categories &amp; included items next, then publish.
              </p>
            </div>
          )}

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
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving
                ? (isEditMode ? 'Saving…' : 'Saving Draft…')
                : (isEditMode ? 'Update & Continue →' : 'Save Draft & Setup Categories →')
              }
            </button>
          </div>
        </form>
      )}

      {/* ── PHASE 2: Categories + Items + Publish ── */}
      {phase === 'categories' && draftEvent && (
        <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,210,110,0.07)', border: '1px solid rgba(0,210,110,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: 'rgb(0,210,110)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'rgb(0,210,110)', margin: 0 }}>
                {isEditMode ? 'Resuming Draft' : 'Draft Saved'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }} className="truncate">"{draftEvent.title}"</p>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Race Categories &amp; Included Items</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              Add each race distance/tier. Then expand it to add shirts, medals, vouchers, or other included items.
            </p>
          </div>

          <CategoriesWithItemsManager
            eventId={draftEvent.id}
            onCategoryCountChange={setCategoryCount}
            onReadinessChange={({ paymentBlocking: pb }) => setPaymentBlocking(pb)}
          />

          {/* Publish readiness */}
          <div style={{
            padding: '13px 16px', borderRadius: 14,
            background: canPublish ? 'rgba(191,255,0,0.05)' : 'rgba(255,180,0,0.05)',
            border: `1px solid ${canPublish ? 'rgba(191,255,0,0.18)' : 'rgba(255,180,0,0.18)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{canPublish ? '🏁' : '⚠️'}</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: canPublish ? 'rgba(191,255,0,0.75)' : 'rgba(255,180,0,0.85)', margin: 0, lineHeight: 1.6 }}>
              {!hasCategories
                ? 'Add at least one race category before publishing so participants can register.'
                : paymentBlocking
                  ? 'Complete payment setup for paid categories before publishing.'
                  : `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} ready. Publish to open registration.`
              }
            </p>
          </div>

          <div style={{ paddingBottom: 16 }}>
            <button type="button" onClick={handlePublish} disabled={isPublishing || !canPublish}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 16,
                fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: (isPublishing || !canPublish) ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s ease',
                ...((isPublishing || !canPublish)
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
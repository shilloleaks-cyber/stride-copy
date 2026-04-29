import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X, CheckCircle2, Globe, MapPin, ExternalLink, AlertCircle } from 'lucide-react';
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
    title: '', description: '', location_name: '', maps_link: '', event_date: '', max_participants: '', banner_image: '',
  });
  const [coordStatus, setCoordStatus] = useState(null); // null | 'resolving' | 'found' | 'not_found'
  const [resolvedCoords, setResolvedCoords] = useState(null); // { latitude, longitude }
  const mapsLinkTimerRef = useRef(null);

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
      maps_link: draft.maps_link || '',
      event_date: dateStr,
      max_participants: draft.max_participants ? String(draft.max_participants) : '',
      banner_image: draft.banner_image || '',
    });
    // Restore coords from draft
    if (draft.latitude && draft.longitude) {
      setResolvedCoords({ latitude: draft.latitude, longitude: draft.longitude });
      setCoordStatus('found');
    }

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

  // Debounced maps_link resolver
  const handleMapsLinkChange = (value) => {
    handleChange('maps_link', value);
    setCoordStatus(null);
    setResolvedCoords(null);
    if (mapsLinkTimerRef.current) clearTimeout(mapsLinkTimerRef.current);
    if (!value) return;
    mapsLinkTimerRef.current = setTimeout(async () => {
      setCoordStatus('resolving');
      try {
        const res = await base44.functions.invoke('resolveMapsLinkCoordinates', { maps_link: value });
        if (res.data?.success) {
          setResolvedCoords({ latitude: res.data.latitude, longitude: res.data.longitude });
          setCoordStatus('found');
        } else {
          setCoordStatus('not_found');
        }
      } catch {
        setCoordStatus('not_found');
      }
    }, 800);
  };

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
      maps_link: form.maps_link || null,
      latitude: resolvedCoords?.latitude ?? null,
      longitude: resolvedCoords?.longitude ?? null,
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

  const inp = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '16px',
    color: 'white',
    padding: '14px 16px',
    width: '100%',
    outline: 'none',
    fontSize: '15px',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
    transition: 'border-color 0.2s',
  };
  const lbl = {
    fontSize: '10px', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase',
    letterSpacing: '0.13em', marginBottom: '9px', display: 'block', fontWeight: 800,
  };

  const saving = isSavingDraft || isUpdatingDraft;
  const formDisabled = saving || !form.title || !form.event_date;
  const hasCategories = categoryCount > 0;
  const canPublish = hasCategories && !paymentBlocking;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0A0A0A', paddingBottom: 110 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-5"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
          paddingBottom: 14,
          backgroundColor: 'rgba(10,10,10,0.94)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(18px)',
        }}>

        {/* Back */}
        <button type="button" onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <ArrowLeft style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.85)' }} />
        </button>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#BFFF00', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, opacity: 0.75 }}>
            ADMIN · OFFICIAL
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, marginTop: 1, letterSpacing: '-0.2px' }}>
            {isEditMode ? 'Edit Draft Event' : 'Create Official Event'}
          </h1>
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {[1, 2].map((stepNum, i) => {
            const active = (phase === 'form' && stepNum === 1) || (phase === 'categories' && stepNum === 2);
            const done = phase === 'categories' && stepNum === 1;
            return (
              <React.Fragment key={stepNum}>
                {i > 0 && <div style={{ width: 14, height: 1.5, borderRadius: 99, background: active || done ? 'rgba(191,255,0,0.4)' : 'rgba(255,255,255,0.12)' }} />}
                <button
                  type="button"
                  onClick={() => { if (stepNum === 1 && phase === 'categories') setPhase('form'); }}
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900, border: 'none',
                    cursor: stepNum === 1 && phase === 'categories' ? 'pointer' : 'default',
                    background: done ? 'rgba(0,210,110,0.2)' : active ? '#BFFF00' : 'rgba(255,255,255,0.07)',
                    color: done ? 'rgb(0,210,110)' : active ? '#0A0A0A' : 'rgba(255,255,255,0.25)',
                    boxShadow: active ? '0 0 10px rgba(191,255,0,0.35)' : 'none',
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
          style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Event Name */}
          <div>
            <label style={lbl}>Event Name *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g. BoomX City Run 2026"
              required
              style={inp}
            />
          </div>

          {/* Banner Image */}
          <div>
            <label style={lbl}>Banner Image</label>
            {bannerPreview ? (
              <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: 170 }}>
                <img src={bannerPreview} alt="Banner preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                {isUploadingBanner && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                    <Loader2 style={{ width: 26, height: 26, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {!isUploadingBanner && (
                  <button type="button" onClick={clearBanner}
                    style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 9, background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X style={{ width: 13, height: 13, color: 'white' }} />
                  </button>
                )}
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                borderRadius: 18, cursor: 'pointer', height: 140,
                background: 'rgba(191,255,0,0.02)',
                border: '1.5px dashed rgba(191,255,0,0.18)',
                boxShadow: '0 0 30px rgba(191,255,0,0.03) inset',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImagePlus style={{ width: 18, height: 18, color: 'rgba(191,255,0,0.6)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Tap to upload banner</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: '4px 0 0', letterSpacing: '0.03em' }}>Recommended: 1200 × 600 px</p>
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
              </label>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Tell participants about this event — route, highlights, what's included…"
              rows={4}
              style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
            />
          </div>

          {/* Location Name */}
          <div>
            <label style={lbl}>Location Name</label>
            <input
              type="text"
              value={form.location_name}
              onChange={e => handleChange('location_name', e.target.value)}
              placeholder="e.g. Lumpini Park, Bangkok"
              style={inp}
            />
          </div>

          {/* Google Maps Link */}
          <div>
            <label style={lbl}>Google Maps Link</label>
            <input
              type="url"
              value={form.maps_link}
              onChange={e => handleMapsLinkChange(e.target.value)}
              placeholder="https://maps.app.goo.gl/… or https://maps.google.com/…"
              style={inp}
            />
            {/* Coordinate status row */}
            <div style={{ marginTop: 10 }}>
              {coordStatus === 'resolving' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Loader2 style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Detecting coordinates…</span>
                </div>
              )}
              {coordStatus === 'found' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderRadius: 12, background: 'rgba(0,210,110,0.06)', border: '1px solid rgba(0,210,110,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 style={{ width: 13, height: 13, color: 'rgb(0,210,110)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgb(0,210,110)' }}>
                      Map coordinates detected ({resolvedCoords?.latitude?.toFixed(4)}, {resolvedCoords?.longitude?.toFixed(4)})
                    </span>
                  </div>
                  {form.maps_link && (
                    <a href={form.maps_link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', flexShrink: 0 }}>
                      <ExternalLink style={{ width: 10, height: 10 }} /> Open
                    </a>
                  )}
                </div>
              )}
              {coordStatus === 'not_found' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)' }}>
                  <AlertCircle style={{ width: 13, height: 13, color: 'rgba(255,180,0,0.9)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,180,0,0.9)' }}>Could not detect coordinates. Map preview may be inaccurate.</span>
                </div>
              )}
              {!coordStatus && !form.maps_link && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MapPin style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>Paste a Google Maps link — coordinates auto-detected</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />

          {/* Date & Time */}
          <div>
            <label style={lbl}>Date &amp; Time *</label>
            <input
              type="datetime-local"
              value={form.event_date}
              onChange={e => handleChange('event_date', e.target.value)}
              required
              style={{ ...inp, colorScheme: 'dark', fontSize: 14 }}
            />
          </div>

          {/* Max Participants */}
          <div>
            <label style={lbl}>Max Participants</label>
            <input
              type="number"
              value={form.max_participants}
              onChange={e => handleChange('max_participants', e.target.value)}
              placeholder="0 = Unlimited"
              min="0"
              style={inp}
            />
          </div>

          {/* Helper note */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 1px 12px rgba(0,0,0,0.25) inset',
          }}>
            <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>📋</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.7 }}>
              Saves as a draft first. You'll add race categories &amp; included items next, then publish.
            </p>
          </div>

          {/* Spacer for sticky CTA */}
          <div style={{ height: 16 }} />
        </form>
      )}

      {/* ── Sticky CTA (Phase 1) ── */}
      {phase === 'form' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '12px 20px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, rgba(10,10,10,1) 65%, rgba(10,10,10,0))',
          backdropFilter: 'blur(2px)',
        }}>
          <button
            type="button"
            onClick={(e) => { isEditMode ? handleUpdateAndContinue(e) : handleSaveDraft(e); }}
            disabled={formDisabled}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 18, border: 'none',
              fontSize: 15, fontWeight: 900, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: formDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              ...(formDisabled
                ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)' }
                : {
                    background: '#BFFF00',
                    color: '#0A0A0A',
                    boxShadow: '0 0 28px rgba(191,255,0,0.35), 0 4px 16px rgba(0,0,0,0.4)',
                  }
              ),
            }}
          >
            {saving && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            {saving
              ? (isEditMode ? 'Saving…' : 'Saving Draft…')
              : (isEditMode ? 'Update & Continue →' : 'Save Draft & Setup Categories →')
            }
          </button>
        </div>
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
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X } from 'lucide-react';

export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Guard: non-admin cannot access this page
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date || !user) return;
    setIsSubmitting(true);

    const dtValue = form.event_date;
    const datePart = dtValue.split('T')[0];
    const timePart = dtValue.split('T')[1]?.slice(0, 5) || '';

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
      status: 'open',
    });

    setIsSubmitting(false);
    if (created?.id) {
      navigate(`/StrideEventDetail?id=${created.id}`);
    } else {
      navigate('/StrideEvents');
    }
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

  const isDisabled = isSubmitting || !form.title || !form.event_date;

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
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Admin · Official</p>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, marginTop: 1 }}>Create Official Event</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Title */}
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
            <div className="relative rounded-2xl overflow-hidden" style={{ height: '160px' }}>
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
              className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.12)',
                height: '110px',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
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

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Description */}
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

        {/* Location */}
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

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* Date & Time */}
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

        {/* Max participants */}
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

        {/* Status notice */}
        <div style={{
          padding: '13px 16px', borderRadius: 14,
          background: 'rgba(191,255,0,0.04)',
          border: '1px solid rgba(191,255,0,0.14)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>🏅</span>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(191,255,0,0.8)', margin: 0, lineHeight: 1.5 }}>
            Publishes immediately as an Official Event, visible to all users
          </p>
        </div>

        {/* Submit */}
        <div style={{ paddingTop: 4, paddingBottom: 16 }}>
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              width: '100%', padding: '15px 0',
              borderRadius: 16,
              border: 'none',
              fontSize: 15, fontWeight: 800, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
              ...(isDisabled ? {
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.25)',
              } : {
                background: 'rgba(191,255,0,0.12)',
                border: '1px solid rgba(191,255,0,0.35)',
                color: '#BFFF00',
                boxShadow: '0 0 24px rgba(191,255,0,0.1)',
              }),
            }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Publishing…' : 'Publish Official Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
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
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '12px',
    color: 'white',
    padding: '12px 14px',
    width: '100%',
    outline: 'none',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    display: 'block',
  };

  const isDisabled = isSubmitting || !form.title || !form.event_date;

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-6 pt-10 pb-4 flex items-center gap-4"
        style={{ backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Admin · Official</p>
          <h1 className="text-lg font-bold">Create Official Event</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-6 space-y-5">

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
            <div className="relative rounded-xl overflow-hidden" style={{ height: '140px' }}>
              <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
              {isUploadingBanner && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#BFFF00' }} />
                </div>
              )}
              {!isUploadingBanner && (
                <button type="button" onClick={clearBanner} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', height: '100px' }}>
              <ImagePlus className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to upload banner</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
          )}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Tell participants about this official event..."
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
          <label style={labelStyle}>Max Participants (0 = unlimited)</label>
          <input
            type="number"
            value={form.max_participants}
            onChange={e => handleChange('max_participants', e.target.value)}
            placeholder="0"
            min="0"
            style={inputStyle}
          />
        </div>

        {/* Official badge notice */}
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(191,255,0,0.06)', border: '1px solid rgba(191,255,0,0.18)',
        }}>
          <p className="text-xs font-semibold" style={{ color: '#BFFF00' }}>
            ✓ Official Event — will appear publicly in the Official Events section
          </p>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-4 rounded-2xl font-bold text-base mt-4 flex items-center justify-center gap-2 transition-all"
          style={{ background: isDisabled ? 'rgba(191,255,0,0.25)' : '#BFFF00', color: '#0A0A0A' }}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Creating...' : 'Publish Official Event'}
        </button>
      </form>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X, Star } from 'lucide-react';

export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location_name: '',
    start_at: '',
    end_at: '',
    max_attendees: '',
    registration_required: true,
    visibility: 'public',
    banner_image: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

  const clearBanner = () => {
    setBannerPreview(null);
    handleChange('banner_image', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_at || !user) return;
    setIsSubmitting(true);

    const event = await base44.entities.Event.create({
      event_kind: 'official',
      created_by_user_email: user.email,
      created_by_user_name: user.full_name,
      title: form.title,
      description: form.description,
      banner_image: form.banner_image,
      location_name: form.location_name,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : 0,
      registration_required: form.registration_required,
      visibility: form.visibility,
      status: 'published',
      attendee_count: 1,
    });

    await Promise.all([
      base44.entities.EventAdmin.create({ event_id: event.id, user_email: user.email, role: 'owner' }),
      base44.entities.EventParticipant.create({
        event_id: event.id,
        user_email: user.email,
        user_name: user.full_name,
        status: 'registered',
      }),
    ]);

    setIsSubmitting(false);
    navigate(createPageUrl('EventDetail') + '?id=' + event.id);
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
  };

  const labelStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    display: 'block',
  };

  const isDisabled = isSubmitting || !form.title || !form.start_at;

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
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: '#BFFF00' }} />
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
            placeholder="e.g. Bangkok Marathon 2026"
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
                <button
                  type="button"
                  onClick={clearBanner}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer"
              style={{ background: 'rgba(191,255,0,0.04)', border: '1px dashed rgba(191,255,0,0.2)', height: '100px' }}
            >
              <ImagePlus className="w-6 h-6" style={{ color: 'rgba(191,255,0,0.3)' }} />
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
            placeholder="Tell participants about this event..."
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

        {/* Start Date/Time */}
        <div>
          <label style={labelStyle}>Start Date &amp; Time *</label>
          <input
            type="datetime-local"
            value={form.start_at}
            onChange={e => handleChange('start_at', e.target.value)}
            required
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* End Date/Time */}
        <div>
          <label style={labelStyle}>End Date &amp; Time</label>
          <input
            type="datetime-local"
            value={form.end_at}
            onChange={e => handleChange('end_at', e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* Max Attendees */}
        <div>
          <label style={labelStyle}>Max Attendees (0 = unlimited)</label>
          <input
            type="number"
            value={form.max_attendees}
            onChange={e => handleChange('max_attendees', e.target.value)}
            placeholder="0"
            min="0"
            style={inputStyle}
          />
        </div>

        {/* Registration Required */}
        <div>
          <label style={labelStyle}>Registration Required</label>
          <div className="flex gap-3">
            {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handleChange('registration_required', opt.value)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={
                  form.registration_required === opt.value
                    ? { background: '#BFFF00', color: '#0A0A0A' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label style={labelStyle}>Visibility</label>
          <div className="flex gap-3">
            {[{ value: 'public', label: 'Public' }, { value: 'group_only', label: 'Limited' }].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleChange('visibility', opt.value)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={
                  form.visibility === opt.value
                    ? { background: '#BFFF00', color: '#0A0A0A' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-4 rounded-2xl font-bold text-base mt-4 flex items-center justify-center gap-2 transition-all"
          style={{ background: isDisabled ? 'rgba(191,255,0,0.3)' : '#BFFF00', color: '#0A0A0A' }}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Creating...' : 'Create Official Event'}
        </button>

      </form>
    </div>
  );
}
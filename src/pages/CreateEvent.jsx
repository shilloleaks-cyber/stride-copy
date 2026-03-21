import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, ImagePlus, X } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledGroupId = urlParams.get('group_id') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    group_id: prefilledGroupId,
    title: '',
    description: '',
    location_name: '',
    event_date: '',
    start_time: '',
    max_participants: '',
    visibility: 'group_only',
    banner_image: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // Only load group picker if no group prefilled
  const { data: memberships = [] } = useQuery({
    queryKey: ['group-memberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user?.email && !prefilledGroupId,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['groups-create-event'],
    queryFn: () => base44.entities.Group.list('-created_date', 100),
    enabled: memberships.length > 0,
  });

  const userGroups = allGroups.filter(g => memberships.map(m => m.group_id).includes(g.id));

  // Fetch group name if prefilled
  const { data: prefilledGroup } = useQuery({
    queryKey: ['group', prefilledGroupId],
    queryFn: () => base44.entities.Group.filter({ id: prefilledGroupId }).then(r => r[0]),
    enabled: !!prefilledGroupId,
  });

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
    if (!form.group_id || !form.title || !form.event_date || !user) return;
    setIsSubmitting(true);

    // Extract date and time from datetime-local value
    const dtValue = form.event_date; // "2026-03-25T07:00"
    const datePart = dtValue.split('T')[0];
    const timePart = dtValue.split('T')[1]?.slice(0, 5) || '';

    await base44.entities.StrideEvent.create({
      title: form.title,
      description: form.description,
      banner_image: form.banner_image,
      location_name: form.location_name,
      event_date: datePart,
      start_time: timePart,
      max_participants: form.max_participants ? parseInt(form.max_participants) : 0,
      visibility: form.visibility,
      event_type: 'community',
      group_id: form.group_id,
      creator_email: user.email,
      status: 'open',
    });

    setIsSubmitting(false);

    // Redirect back to group if we came from one, else to events
    if (prefilledGroupId) {
      navigate(`/GroupDetail?id=${prefilledGroupId}`);
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

  const isDisabled = isSubmitting || !form.group_id || !form.title || !form.event_date;

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
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
          <h1 className="text-lg font-bold">Schedule Event</h1>
          {prefilledGroup && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{prefilledGroup.name}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-6 space-y-5">

        {/* Group selector — only shown if no group_id prefilled */}
        {!prefilledGroupId && (
          <div>
            <label style={labelStyle}>Group *</label>
            <select
              value={form.group_id}
              onChange={e => handleChange('group_id', e.target.value)}
              required
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="" style={{ background: '#1a1a1a' }}>Select a group</option>
              {userGroups.map(g => (
                <option key={g.id} value={g.id} style={{ background: '#1a1a1a' }}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Event Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g. Saturday Morning 5K"
            required
            style={inputStyle}
          />
        </div>

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

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Tell people what this event is about..."
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

        <div>
          <label style={labelStyle}>Visibility</label>
          <div className="flex gap-3">
            {[{ value: 'group_only', label: 'Group Only' }, { value: 'public', label: 'Public' }].map(opt => (
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
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Public events appear in the Community Events section for everyone.
          </p>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full py-4 rounded-2xl font-bold text-base mt-4 flex items-center justify-center gap-2 transition-all"
          style={{ background: isDisabled ? 'rgba(191,255,0,0.3)' : '#BFFF00', color: '#0A0A0A' }}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}
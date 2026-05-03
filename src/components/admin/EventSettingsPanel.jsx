import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ImagePlus, X, CheckCircle2, MapPin, ExternalLink, AlertCircle } from 'lucide-react';
import { logActivity } from '@/lib/eventActivityLog';

const LIME   = '#B6FF00';
const ACCENT = LIME;

const inp = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
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

const divider = { height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' };

export default function EventSettingsPanel({ event, onUpdated, actorEmail }) {
  const queryClient = useQueryClient();
  const mapsLinkTimerRef = useRef(null);

  const [form, setForm] = useState({
    title: event.title || '',
    banner_image: event.banner_image || '',
    description: event.description || '',
    location_name: event.location_name || '',
    maps_link: event.maps_link || '',
    event_date: event.event_date || '',
    start_time: event.start_time || '',
    max_participants: event.max_participants != null ? String(event.max_participants) : '',
    status: event.status || 'draft',
  });

  const [bannerPreview, setBannerPreview] = useState(event.banner_image || null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [coordStatus, setCoordStatus] = useState(
    event.latitude && event.longitude ? 'found' : null
  );
  const [resolvedCoords, setResolvedCoords] = useState(
    event.latitude && event.longitude ? { latitude: event.latitude, longitude: event.longitude } : null
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setBannerPreview(URL.createObjectURL(file));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange('banner_image', file_url);
    setBannerPreview(file_url);
    setIsUploadingBanner(false);
  };

  const clearBanner = () => { setBannerPreview(null); handleChange('banner_image', ''); };

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.StrideEvent.update(event.id, data),
    onSuccess: (_, data) => {
      logActivity({ eventId: event.id, actorEmail, actionType: 'event_settings_updated', targetType: 'event', targetId: event.id, summary: `Updated event settings for "${event.title}"`, meta: { status: data.status } });
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
      queryClient.invalidateQueries({ queryKey: ['stride-event', event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (onUpdated) onUpdated();
    },
  });

  const handleSave = () => {
    const payload = {
      title: form.title,
      banner_image: form.banner_image,
      description: form.description,
      location_name: form.location_name,
      maps_link: form.maps_link || null,
      latitude: resolvedCoords?.latitude ?? (form.maps_link === event.maps_link ? event.latitude : null),
      longitude: resolvedCoords?.longitude ?? (form.maps_link === event.maps_link ? event.longitude : null),
      event_date: form.event_date,
      start_time: form.start_time,
      max_participants: form.max_participants !== '' ? parseInt(form.max_participants) : 0,
      status: form.status,
    };
    updateMutation.mutate(payload);
  };

  return (
    <div style={{ padding: '0 20px 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Event Name */}
      <div>
        <label style={lbl}>Event Name *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          placeholder="e.g. BoomX City Run 2026"
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
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImagePlus style={{ width: 18, height: 18, color: 'rgba(191,255,0,0.6)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Tap to upload banner</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', margin: '4px 0 0' }}>Recommended: 1200 × 600 px</p>
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
          </label>
        )}
      </div>

      <div style={divider} />

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
                  Coordinates detected ({resolvedCoords?.latitude?.toFixed(4)}, {resolvedCoords?.longitude?.toFixed(4)})
                </span>
              </div>
              {form.maps_link && (
                <a href={form.maps_link} target="_blank" rel="noreferrer"
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

      <div style={divider} />

      {/* Date & Time */}
      <div>
        <label style={lbl}>Date &amp; Time *</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="date"
            value={form.event_date}
            onChange={e => handleChange('event_date', e.target.value)}
            style={{ ...inp, flex: 2, colorScheme: 'dark', fontSize: 14 }}
          />
          <input
            type="time"
            value={form.start_time}
            onChange={e => handleChange('start_time', e.target.value)}
            style={{ ...inp, flex: 1, colorScheme: 'dark', fontSize: 14 }}
          />
        </div>
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

      {/* Publish Status */}
      <div>
        <label style={lbl}>Publish Status</label>
        <select
          value={form.status}
          onChange={e => handleChange('status', e.target.value)}
          style={{ ...inp, appearance: 'none', WebkitAppearance: 'none' }}
        >
          <option value="draft">Draft (hidden from public)</option>
          <option value="open">Published (open for registration)</option>
          <option value="closed">Closed (no more registrations)</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={updateMutation.isPending || !form.title}
        style={{
          width: '100%', padding: '16px 0', borderRadius: 18, fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: saved ? 'rgba(182,255,0,0.1)' : (updateMutation.isPending || !form.title) ? 'rgba(255,255,255,0.07)' : LIME,
          color: saved ? LIME : (updateMutation.isPending || !form.title) ? 'rgba(255,255,255,0.2)' : '#080808',
          border: saved ? `1px solid rgba(182,255,0,0.35)` : 'none',
          boxShadow: (!saved && !updateMutation.isPending && form.title) ? '0 0 28px rgba(182,255,0,0.25)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {updateMutation.isPending
          ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving…</>
          : saved ? '✓ Saved' : 'Save Changes'
        }
      </button>
    </div>
  );
}
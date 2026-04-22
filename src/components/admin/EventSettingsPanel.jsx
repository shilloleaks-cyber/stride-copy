import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';

const ACCENT = '#00e676';
const CARD_BG = 'rgba(10,30,18,0.9)';
const BORDER = 'rgba(0,200,80,0.12)';

export default function EventSettingsPanel({ event, onUpdated }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: event.title || '',
    event_date: event.event_date || '',
    start_time: event.start_time || '',
    location_name: event.location_name || '',
    location_address: event.location_address || '',
    description: event.description || '',
    status: event.status || 'draft',
    banner_image: event.banner_image || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.StrideEvent.update(event.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (onUpdated) onUpdated();
    },
  });

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, banner_image: file_url }));
    setUploading(false);
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 13px',
    borderRadius: 10, background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.15)',
    color: '#fff', fontSize: 13, outline: 'none',
  };

  const labelStyle = { fontSize: 10, fontWeight: 800, color: 'rgba(0,230,118,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px', display: 'block' };

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Banner */}
      <div>
        <label style={labelStyle}>Event Banner</label>
        <div style={{ position: 'relative', height: 120, borderRadius: 14, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}` }}>
          {form.banner_image && <img src={form.banner_image} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <label style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: form.banner_image ? 'rgba(0,0,0,0.45)' : 'transparent' }}>
            {uploading ? <Loader2 style={{ width: 22, height: 22, color: ACCENT, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 22, height: 22, color: 'rgba(0,230,118,0.6)' }} />}
            <span style={{ fontSize: 11, color: 'rgba(0,230,118,0.6)', fontWeight: 700 }}>{form.banner_image ? 'Change Banner' : 'Upload Banner'}</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>Event Title</label>
        <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
      </div>

      {/* Date + Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" style={inputStyle} value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Start Time</label>
          <input type="time" style={inputStyle} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
        </div>
      </div>

      {/* Location */}
      <div>
        <label style={labelStyle}>Location Name</label>
        <input style={inputStyle} value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="e.g. Lumpini Park" />
      </div>
      <div>
        <label style={labelStyle}>Location Address</label>
        <input style={inputStyle} value={form.location_address} onChange={e => setForm(f => ({ ...f, location_address: e.target.value }))} placeholder="Full address" />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Event description..."
          rows={3}
        />
      </div>

      {/* Publish Status */}
      <div>
        <label style={labelStyle}>Publish Status</label>
        <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          <option value="draft">Draft (hidden from public)</option>
          <option value="open">Published (visible to all)</option>
          <option value="closed">Closed (no more registrations)</option>
        </select>
      </div>

      {/* Save */}
      <button
        onClick={() => updateMutation.mutate(form)}
        disabled={updateMutation.isPending}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: saved ? 'rgba(0,230,118,0.15)' : ACCENT,
          color: saved ? ACCENT : '#050f08',
          border: saved ? `1px solid rgba(0,230,118,0.4)` : 'none',
          transition: 'all 0.3s',
        }}
      >
        {updateMutation.isPending ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving...</> : saved ? '✓ Saved' : 'Save Changes'}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
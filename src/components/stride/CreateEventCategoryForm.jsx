import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function CreateEventCategoryForm({ eventId, existingCategories, initial, editingId, onSaved, onCancel }) {
  const isEdit = !!editingId;
  const [form, setForm] = useState(initial || {
    name: '', distance_km: '', price: '', max_slots: '',
    bib_prefix: '', bib_start: '1', color: '#BFFF00',
  });
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
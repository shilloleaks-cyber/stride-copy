import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const SHIRT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EMPTY_FORM = {
  name: '',
  distance_km: '',
  price: '',
  max_slots: '',
  bib_prefix: '',
  bib_start: '1',
  shirt_sizes: ['S', 'M', 'L', 'XL'],
  color: '#BFFF00',
  is_active: true,
};

function CategoryForm({ eventId, onSaved, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const toggleShirtSize = (size) => {
    set('shirt_sizes', form.shirt_sizes.includes(size)
      ? form.shirt_sizes.filter(s => s !== size)
      : [...form.shirt_sizes, size]
    );
  };

  const handleSave = async () => {
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
      shirt_sizes: form.shirt_sizes,
      color: form.color,
      is_active: true,
    });
    setSaving(false);
    onSaved();
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12,
    color: 'white',
    padding: '11px 14px',
    width: '100%',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    display: 'block',
    marginBottom: 6,
  };

  const isValid = form.name.trim().length > 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(191,255,0,0.2)',
      borderRadius: 18,
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: '#BFFF00', margin: 0 }}>New Category</p>

      {/* Name */}
      <div>
        <label style={labelStyle}>Category Name *</label>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. 5K, 10K, Half Marathon, VIP" style={inputStyle} />
      </div>

      {/* Distance + Price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Distance (km)</label>
          <input type="number" value={form.distance_km} onChange={e => set('distance_km', e.target.value)}
            placeholder="e.g. 10" min="0" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Price (THB)</label>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
            placeholder="0 = free" min="0" style={inputStyle} />
        </div>
      </div>

      {/* Max Slots + Color */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Max Slots</label>
          <input type="number" value={form.max_slots} onChange={e => set('max_slots', e.target.value)}
            placeholder="0 = unlimited" min="0" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Display Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{form.color}</span>
          </div>
        </div>
      </div>

      {/* Bib Prefix + Start */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Bib Prefix</label>
          <input type="text" value={form.bib_prefix} onChange={e => set('bib_prefix', e.target.value)}
            placeholder="e.g. A, B, VIP" maxLength={5} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bib Start #</label>
          <input type="number" value={form.bib_start} onChange={e => set('bib_start', e.target.value)}
            min="1" style={inputStyle} />
        </div>
      </div>

      {/* Shirt Sizes */}
      <div>
        <label style={labelStyle}>Shirt Sizes</label>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {SHIRT_SIZE_OPTIONS.map(s => {
            const active = form.shirt_sizes.includes(s);
            return (
              <button key={s} type="button" onClick={() => toggleShirtSize(s)}
                style={{
                  padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  ...(active
                    ? { background: 'rgba(191,255,0,0.15)', border: '1px solid rgba(191,255,0,0.4)', color: '#BFFF00' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                  ),
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onCancel}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={!isValid || saving}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: isValid && !saving ? 'pointer' : 'not-allowed',
            ...(isValid && !saving
              ? { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }
            ),
          }}>
          {saving && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}

export default function ManageCategories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('event_id');

  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: event } = useQuery({
    queryKey: ['stride-event', eventId],
    queryFn: () => base44.entities.StrideEvent.filter({ id: eventId }),
    enabled: !!eventId,
    select: data => data[0],
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['event-categories', eventId],
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EventCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
      queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
      setDeletingId(null);
    },
  });

  if (!userLoading && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-xl font-bold">Admin Only</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-lg font-bold">No event specified</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#BFFF00' }}>Go Back</button>
      </div>
    );
  }

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
    queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen text-white pb-28" style={{ backgroundColor: '#0A0A0A' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        padding: 'calc(env(safe-area-inset-top) + 12px) 20px 16px',
        backgroundColor: 'rgba(10,10,10,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', flexShrink: 0 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Admin · Categories</p>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event?.title || 'Manage Categories'}
            </h1>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, flexShrink: 0, cursor: 'pointer',
                background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00',
              }}>
              <Plus style={{ width: 13, height: 13 }} /> Add Category
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* New category form */}
        {showForm && (
          <CategoryForm eventId={eventId} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        )}

        {/* Existing categories */}
        {catsLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        )}

        {!catsLoading && categories.length === 0 && !showForm && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 18,
          }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🏷️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>No categories yet</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Registration won't show until at least one category is added.</p>
            <button onClick={() => setShowForm(true)}
              style={{
                padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00',
              }}>
              <span>+ Add First Category</span>
            </button>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat.id} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 16,
            borderLeft: `3px solid ${cat.color || '#BFFF00'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                  {cat.distance_km != null && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {cat.distance_km} km</span>
                  )}
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    💰 {cat.price === 0 ? 'Free' : `฿${cat.price?.toLocaleString()}`}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    👥 {cat.max_slots > 0 ? `${cat.registered_count || 0}/${cat.max_slots} slots` : 'Unlimited'}
                  </span>
                  {cat.bib_prefix && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🎫 Bib: {cat.bib_prefix}{cat.bib_start}</span>
                  )}
                </div>
                {cat.shirt_sizes?.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                    {cat.shirt_sizes.map(s => (
                      <span key={s} style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
                      }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setDeletingId(cat.id);
                  deleteMutation.mutate(cat.id);
                }}
                disabled={deletingId === cat.id}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)',
                }}
              >
                {deletingId === cat.id
                  ? <Loader2 style={{ width: 13, height: 13, color: 'rgba(255,100,100,0.7)', animation: 'spin 1s linear infinite' }} />
                  : <Trash2 style={{ width: 13, height: 13, color: 'rgba(255,100,100,0.7)' }} />
                }
              </button>
            </div>
          </div>
        ))}

        {/* Info footer */}
        {categories.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', paddingTop: 4 }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} — registration is now visible to participants
          </p>
        )}
      </div>
    </div>
  );
}
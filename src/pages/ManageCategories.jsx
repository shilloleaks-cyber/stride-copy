import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, X, AlertTriangle, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import CategoryItemsManager from '@/components/stride/CategoryItemsManager';
import CategoryPaymentSetup, { checkPaymentReady } from '@/components/stride/CategoryPaymentSetup';

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
};

function validate(form, existingCategories, editingId) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Category name is required';
  else {
    const duplicate = existingCategories.find(
      c => c.name.trim().toLowerCase() === name.toLowerCase() && c.id !== editingId
    );
    if (duplicate) errors.name = 'A category with this name already exists';
  }
  if (form.distance_km !== '' && parseFloat(form.distance_km) <= 0)
    errors.distance_km = 'Must be positive';
  if (form.price !== '' && parseFloat(form.price) < 0)
    errors.price = 'Cannot be negative';
  if (form.max_slots !== '' && parseInt(form.max_slots) < 0)
    errors.max_slots = 'Cannot be negative';
  if (form.bib_start !== '' && parseInt(form.bib_start) < 1)
    errors.bib_start = 'Must be ≥ 1';
  return errors;
}

function CategoryForm({ eventId, existingCategories, initial, editingId, onSaved, onCancel }) {
  const isEdit = !!editingId;
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    // Clear error on change
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const toggleShirtSize = (size) => {
    set('shirt_sizes', form.shirt_sizes.includes(size)
      ? form.shirt_sizes.filter(s => s !== size)
      : [...form.shirt_sizes, size]
    );
  };

  const handleSave = async () => {
    const errs = validate(form, existingCategories, editingId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Mark all fields as touched to show errors
      const allTouched = {};
      Object.keys(errs).forEach(k => { allTouched[k] = true; });
      setTouched(allTouched);
      return;
    }

    setSaving(true);
    const payload = {
      event_id: eventId,
      name: form.name.trim(),
      distance_km: form.distance_km !== '' ? parseFloat(form.distance_km) : null,
      price: form.price !== '' ? parseFloat(form.price) : 0,
      max_slots: form.max_slots !== '' ? parseInt(form.max_slots) : 0,
      bib_prefix: form.bib_prefix.trim() || null,
      bib_start: parseInt(form.bib_start) || 1,
      shirt_sizes: form.shirt_sizes,
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

  const inputStyle = (field) => ({
    background: touched[field] && errors[field] ? 'rgba(255,60,60,0.07)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${touched[field] && errors[field] ? 'rgba(255,80,80,0.4)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 12,
    color: 'white',
    padding: '11px 14px',
    width: '100%',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box',
  });

  const labelStyle = {
    fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
    display: 'block',
    marginBottom: 6,
  };

  const errMsg = (field) => touched[field] && errors[field]
    ? <p style={{ fontSize: 11, color: 'rgba(255,100,100,0.9)', marginTop: 4 }}>{errors[field]}</p>
    : null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${isEdit ? 'rgba(138,43,226,0.35)' : 'rgba(191,255,0,0.2)'}`,
      borderRadius: 18, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: isEdit ? '#c084fc' : '#BFFF00', margin: 0 }}>
        {isEdit ? '✏️ Edit Category' : 'New Category'}
      </p>

      {/* Name */}
      <div>
        <label style={labelStyle}>Category Name *</label>
        <input type="text" value={form.name}
          onChange={e => set('name', e.target.value)}
          onBlur={() => touch('name')}
          placeholder="e.g. 5K, 10K, Half Marathon, VIP"
          style={inputStyle('name')} />
        {errMsg('name')}
      </div>

      {/* Distance + Price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Distance (km)</label>
          <input type="number" value={form.distance_km}
            onChange={e => set('distance_km', e.target.value)}
            onBlur={() => touch('distance_km')}
            placeholder="e.g. 10" min="0.01" step="0.1"
            style={inputStyle('distance_km')} />
          {errMsg('distance_km')}
        </div>
        <div>
          <label style={labelStyle}>Price (THB)</label>
          <input type="number" value={form.price}
            onChange={e => set('price', e.target.value)}
            onBlur={() => touch('price')}
            placeholder="0 = free" min="0"
            style={inputStyle('price')} />
          {errMsg('price')}
        </div>
      </div>

      {/* Max Slots + Color */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Max Slots</label>
          <input type="number" value={form.max_slots}
            onChange={e => set('max_slots', e.target.value)}
            onBlur={() => touch('max_slots')}
            placeholder="0 = unlimited" min="0"
            style={inputStyle('max_slots')} />
          {errMsg('max_slots')}
        </div>
        <div>
          <label style={labelStyle}>Display Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{form.color}</span>
          </div>
        </div>
      </div>

      {/* Bib Prefix + Start */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Bib Prefix</label>
          <input type="text" value={form.bib_prefix}
            onChange={e => set('bib_prefix', e.target.value)}
            placeholder="e.g. A, B, VIP" maxLength={5}
            style={inputStyle('bib_prefix')} />
        </div>
        <div>
          <label style={labelStyle}>Bib Start #</label>
          <input type="number" value={form.bib_start}
            onChange={e => set('bib_start', e.target.value)}
            onBlur={() => touch('bib_start')}
            min="1"
            style={inputStyle('bib_start')} />
          {errMsg('bib_start')}
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
                }}>
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
        <button type="button" onClick={handleSave} disabled={saving}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: saving ? 'not-allowed' : 'pointer',
            background: isEdit ? 'rgba(138,43,226,0.15)' : 'rgba(191,255,0,0.12)',
            border: isEdit ? '1px solid rgba(138,43,226,0.4)' : '1px solid rgba(191,255,0,0.35)',
            color: isEdit ? '#c084fc' : '#BFFF00',
          }}>
          {saving && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ cat, registrationCount, onConfirm, onCancel, loading }) {
  const hasRegs = registrationCount > 0;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#111', borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 20px calc(28px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertTriangle style={{ width: 20, height: 20, color: hasRegs ? 'rgba(255,180,0,0.9)' : 'rgba(255,80,80,0.8)', flexShrink: 0 }} />
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>
            {hasRegs ? 'Cannot Delete Category' : `Delete "${cat.name}"?`}
          </p>
        </div>

        {hasRegs ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.6 }}>
              This category has <strong style={{ color: 'rgba(255,180,0,0.9)' }}>{registrationCount} registration{registrationCount !== 1 ? 's' : ''}</strong>. Hard deletion is blocked to protect participant data.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
              To hide it from new registrations, deactivate it instead — existing registrations remain intact.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
              <button onClick={() => onConfirm('deactivate')} disabled={loading}
                style={{ flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.35)', color: 'rgba(255,180,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                Deactivate Instead
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.6 }}>
              No registrations exist for this category. It will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Cancel
              </button>
              <button onClick={() => onConfirm('delete')} disabled={loading}
                style={{ flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,80,80,0.35)', color: 'rgba(255,100,100,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                Delete Permanently
              </button>
            </div>
          </>
        )}
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
  const [editingCat, setEditingCat] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState(null); // which category shows items
  const [expandedPaymentCatId, setExpandedPaymentCatId] = useState(null); // which category shows payment setup

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
    queryKey: ['event-categories-manage', eventId],
    // Fetch ALL (active + inactive) so admin sees deactivated ones too
    queryFn: () => base44.entities.EventCategory.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  // Fetch registrations for this event to check before deletion
  const { data: registrations = [] } = useQuery({
    queryKey: ['event-registrations-manage', eventId],
    queryFn: () => base44.entities.EventRegistration.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-categories-manage', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-categories', eventId] });
    queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
  };

  const handleSaved = () => {
    invalidate();
    setShowForm(false);
    setEditingCat(null);
  };

  const handleEditClick = (cat) => {
    setShowForm(false);
    setEditingCat({
      ...cat,
      distance_km: cat.distance_km != null ? String(cat.distance_km) : '',
      price: cat.price != null ? String(cat.price) : '',
      max_slots: cat.max_slots != null ? String(cat.max_slots) : '',
      bib_prefix: cat.bib_prefix || '',
      bib_start: String(cat.bib_start || 1),
      shirt_sizes: cat.shirt_sizes || [],
      color: cat.color || '#BFFF00',
    });
  };

  const handleDeleteClick = (cat) => {
    setPendingDelete(cat);
  };

  const handleDeleteConfirm = async (action) => {
    if (!pendingDelete) return;
    setActionLoading(true);
    if (action === 'delete') {
      await base44.entities.EventCategory.delete(pendingDelete.id);
    } else {
      // deactivate instead
      await base44.entities.EventCategory.update(pendingDelete.id, { is_active: false });
    }
    setActionLoading(false);
    setPendingDelete(null);
    invalidate();
  };

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

  const activeCategories = categories.filter(c => c.is_active !== false);
  const inactiveCategories = categories.filter(c => c.is_active === false);

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
          {!showForm && !editingCat && (
            <button onClick={() => setShowForm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 800, flexShrink: 0, cursor: 'pointer',
                background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00',
              }}>
              <Plus style={{ width: 13, height: 13 }} /> Add
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Create form */}
        {showForm && (
          <CategoryForm
            eventId={eventId}
            existingCategories={categories}
            editingId={null}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Edit form */}
        {editingCat && (
          <CategoryForm
            eventId={eventId}
            existingCategories={categories}
            initial={editingCat}
            editingId={editingCat.id}
            onSaved={handleSaved}
            onCancel={() => setEditingCat(null)}
          />
        )}

        {/* Loading */}
        {catsLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        )}

        {/* Empty state */}
        {!catsLoading && categories.length === 0 && !showForm && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 18,
          }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🏷️</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>No categories yet</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Registration won't show until at least one category is added.</p>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.3)', color: '#BFFF00' }}>
              + Add First Category
            </button>
          </div>
        )}

        {/* Active categories */}
        {activeCategories.map(cat => {
          const registered = cat.registered_count || 0;
          const hasLimit = cat.max_slots > 0;
          const isFull = hasLimit && registered >= cat.max_slots;
          const nearlyFull = hasLimit && !isFull && (registered / cat.max_slots) >= 0.8;
          const isEditingThis = editingCat?.id === cat.id;

          let occupancyColor = 'rgba(191,255,0,0.85)';
          if (isFull) occupancyColor = 'rgba(255,80,80,0.9)';
          else if (nearlyFull) occupancyColor = 'rgba(255,180,0,0.9)';

          return (
            <div key={cat.id} style={{
              background: isEditingThis ? 'rgba(138,43,226,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isEditingThis ? 'rgba(138,43,226,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16, padding: 16,
              borderLeft: `3px solid ${cat.color || '#BFFF00'}`,
              opacity: isEditingThis ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{cat.name}</p>
                    {isFull && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: 'rgba(255,80,80,0.12)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.25)' }}>FULL</span>
                    )}
                    {nearlyFull && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: 'rgba(255,180,0,0.1)', color: 'rgba(255,180,0,0.9)', border: '1px solid rgba(255,180,0,0.25)' }}>NEARLY FULL</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                    {cat.distance_km != null && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {cat.distance_km} km</span>
                    )}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      💰 {cat.price === 0 ? 'Free' : `฿${cat.price?.toLocaleString()}`}
                    </span>
                    {/* Occupancy — uses backend-synced registered_count */}
                    <span style={{ fontSize: 12, fontWeight: 700, color: occupancyColor }}>
                      👥 {hasLimit ? `${registered} / ${cat.max_slots} registered` : `${registered} registered · Unlimited`}
                    </span>
                    {cat.bib_prefix && (
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>🎫 Bib: {cat.bib_prefix}{cat.bib_start}</span>
                    )}
                  </div>
                  {/* Slot progress bar */}
                  {hasLimit && (
                    <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (registered / cat.max_slots) * 100)}%`,
                        borderRadius: 99,
                        background: isFull ? 'rgba(255,80,80,0.7)' : nearlyFull ? 'rgba(255,180,0,0.8)' : (cat.color || '#BFFF00'),
                      }} />
                    </div>
                  )}
                  {cat.shirt_sizes?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                      {cat.shirt_sizes.map(s => (
                        <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit + Delete buttons */}
                {!isEditingThis && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleEditClick(cat)}
                      style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.25)' }}>
                      <Pencil style={{ width: 13, height: 13, color: '#c084fc' }} />
                    </button>
                    <button onClick={() => handleDeleteClick(cat)}
                      style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)' }}>
                      <Trash2 style={{ width: 13, height: 13, color: 'rgba(255,100,100,0.7)' }} />
                    </button>
                  </div>
                )}
                {isEditingThis && (
                  <button onClick={() => setEditingCat(null)}
                    style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                )}
              </div>

              {/* Expand/collapse items section */}
              {!isEditingThis && (
                <button
                  onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
                  style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                  {expandedCatId === cat.id
                    ? <><ChevronUp style={{ width: 13, height: 13 }} /> Hide Items</>
                    : <><ChevronDown style={{ width: 13, height: 13 }} /> Manage Included Items</>
                  }
                </button>
              )}

              {/* Items manager */}
              {expandedCatId === cat.id && !isEditingThis && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <CategoryItemsManager categoryId={cat.id} />
                </div>
              )}

              {/* Payment Setup — only for paid categories */}
              {cat.price > 0 && !isEditingThis && (() => {
                const { ready } = checkPaymentReady(event);
                const isExpanded = expandedPaymentCatId === cat.id;
                return (
                  <>
                    <button
                      onClick={() => setExpandedPaymentCatId(isExpanded ? null : cat.id)}
                      style={{
                        marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                        background: isExpanded ? 'rgba(191,255,0,0.05)' : 'rgba(255,255,255,0.03)',
                        border: isExpanded ? '1px solid rgba(191,255,0,0.2)' : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CreditCard style={{ width: 13, height: 13, color: isExpanded ? '#BFFF00' : 'rgba(255,255,255,0.35)' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: isExpanded ? '#BFFF00' : 'rgba(255,255,255,0.4)' }}>Payment Setup</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                          ...(ready
                            ? { background: 'rgba(0,210,110,0.1)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.2)' }
                            : { background: 'rgba(255,120,0,0.1)', color: 'rgba(255,150,50,1)', border: '1px solid rgba(255,120,0,0.25)' }
                          ),
                        }}>
                          {ready ? '✓ Ready' : '⚠ Required'}
                        </span>
                      </div>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <CategoryPaymentSetup eventId={eventId} />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          );
        })}

        {/* Inactive / deactivated categories */}
        {inactiveCategories.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '8px 0 8px' }}>
              Deactivated
            </p>
            {inactiveCategories.map(cat => (
              <div key={cat.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14, padding: '12px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                opacity: 0.5,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{cat.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0' }}>Inactive — hidden from registration</p>
                </div>
                <button
                  onClick={async () => {
                    await base44.entities.EventCategory.update(cat.id, { is_active: true });
                    invalidate();
                  }}
                  style={{ padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.2)', color: '#BFFF00', flexShrink: 0 }}>
                  Reactivate
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {activeCategories.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', paddingTop: 4 }}>
            {activeCategories.length} active {activeCategories.length === 1 ? 'category' : 'categories'} — registration is visible to participants
          </p>
        )}
      </div>

      {/* Delete confirm dialog */}
      {pendingDelete && (
        <DeleteConfirmDialog
          cat={pendingDelete}
          registrationCount={registrations.filter(r => r.category_id === pendingDelete.id).length}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
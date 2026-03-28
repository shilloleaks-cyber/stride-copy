import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, ImagePlus, ChevronDown, ChevronUp, Eye } from 'lucide-react';

const ITEM_TYPES = [
  { value: 'apparel', label: '👕 Apparel' },
  { value: 'gear', label: '🎒 Gear' },
  { value: 'consumable', label: '💧 Consumable' },
  { value: 'voucher', label: '🎟️ Voucher' },
  { value: 'benefit', label: '⭐ Benefit' },
  { value: 'other', label: '📦 Other' },
];

const ITEM_TYPE_EMOJI = {
  apparel: '👕', gear: '🎒', consumable: '💧', voucher: '🎟️', benefit: '⭐', other: '📦',
};

const EMPTY_ITEM = {
  name: '',
  item_type: 'apparel',
  description: '',
  has_variant: false,
  variant_type: 'none',
  variant_options: [],
  detail_image_url: '',
  is_required: true,
  sort_order: 0,
};

// Common size presets for quick fill
const SIZE_PRESETS = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
};

function ItemForm({ categoryId, initial, editingId, sortOrderNext, onSaved, onCancel }) {
  const isEdit = !!editingId;
  const [form, setForm] = useState(initial || { ...EMPTY_ITEM, sort_order: sortOrderNext });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variantInput, setVariantInput] = useState('');
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleVariantTypeChange = (vt) => {
    set('variant_type', vt);
    set('has_variant', vt !== 'none');
    if (vt === 'none') set('variant_options', []);
  };

  const addVariantOption = () => {
    const trimmed = variantInput.trim();
    if (!trimmed) return;
    const isDuplicate = form.variant_options.some(o => o.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return;
    set('variant_options', [...form.variant_options, trimmed]);
    setVariantInput('');
  };

  const removeVariantOption = (opt) => {
    set('variant_options', form.variant_options.filter(o => o !== opt));
  };

  const applyPreset = (preset) => {
    set('variant_options', SIZE_PRESETS[preset]);
  };

  const handleDetailImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    set('detail_image_url', result.file_url);
    setUploadingImage(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.has_variant && form.variant_options.length === 0) errs.variants = 'Add at least one option';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    const payload = {
      event_category_id: categoryId,
      name: form.name.trim(),
      item_type: form.item_type,
      description: form.description.trim(),
      has_variant: form.has_variant,
      variant_type: form.has_variant ? form.variant_type : 'none',
      variant_options: form.has_variant ? form.variant_options : [],
      detail_image_url: form.detail_image_url,
      is_required: form.is_required,
      sort_order: form.sort_order,
      is_active: true,
    };
    if (isEdit) {
      await base44.entities.CategoryItem.update(editingId, payload);
    } else {
      await base44.entities.CategoryItem.create(payload);
    }
    setSaving(false);
    onSaved();
  };

  const inp = (err) => ({
    background: err ? 'rgba(255,60,60,0.07)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${err ? 'rgba(255,80,80,0.4)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 10, color: 'white', padding: '10px 12px',
    width: '100%', outline: 'none', fontSize: 13, boxSizing: 'border-box',
  });

  const lbl = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 5 };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isEdit ? 'rgba(138,43,226,0.3)' : 'rgba(191,255,0,0.18)'}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: isEdit ? '#c084fc' : '#BFFF00', margin: 0 }}>
        {isEdit ? '✏️ Edit Item' : '＋ New Item'}
      </p>

      {/* Name + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Item Name *</label>
          <input value={form.name} onChange={e => { set('name', e.target.value); if (errors.name) setErrors(p => ({ ...p, name: null })); }}
            placeholder="e.g. Race Shirt" style={inp(errors.name)} />
          {errors.name && <p style={{ fontSize: 10, color: 'rgba(255,100,100,0.9)', marginTop: 3 }}>{errors.name}</p>}
        </div>
        <div>
          <label style={lbl}>Type</label>
          <select value={form.item_type} onChange={e => set('item_type', e.target.value)} style={inp(false)}>
            {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={lbl}>Description</label>
        <input value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Short description of the item" style={inp(false)} />
      </div>

      {/* Variant toggle */}
      <div>
        <label style={lbl}>Variant / Size Selection</label>
        <div style={{ display: 'flex', gap: 7 }}>
          {['none', 'size', 'option'].map(vt => (
            <button key={vt} type="button" onClick={() => handleVariantTypeChange(vt)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                ...(form.variant_type === vt
                  ? { background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.35)', color: '#BFFF00' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                ),
              }}>
              {vt === 'none' ? 'No variant' : vt === 'size' ? 'Size' : 'Option'}
            </button>
          ))}
        </div>
      </div>

      {/* Variant options */}
      {form.has_variant && (
        <div>
          <label style={lbl}>Options</label>

          {/* Presets */}
          {form.variant_type === 'size' && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button type="button" onClick={() => applyPreset('clothing')}
                style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Use clothing sizes
              </button>
              <button type="button" onClick={() => applyPreset('shoes')}
                style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                Use shoe sizes
              </button>
            </div>
          )}

          {/* Current options */}
          {form.variant_options.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.variant_options.map(opt => (
                <span key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.25)', fontSize: 12, fontWeight: 700, color: '#BFFF00' }}>
                  {opt}
                  <button type="button" onClick={() => removeVariantOption(opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(191,255,0,0.6)', padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Add option input */}
          <div style={{ display: 'flex', gap: 7 }}>
            <input value={variantInput} onChange={e => setVariantInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVariantOption())}
              placeholder={form.variant_type === 'size' ? 'e.g. M, L, 42' : 'e.g. Red, Blue'}
              style={{ ...inp(errors.variants), flex: 1 }} />
            <button type="button" onClick={addVariantOption}
              style={{ padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(191,255,0,0.1)', border: '1px solid rgba(191,255,0,0.25)', color: '#BFFF00', flexShrink: 0 }}>
              Add
            </button>
          </div>
          {errors.variants && <p style={{ fontSize: 10, color: 'rgba(255,100,100,0.9)', marginTop: 3 }}>{errors.variants}</p>}

          {/* Required toggle */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => set('is_required', !form.is_required)}
              style={{ width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', background: form.is_required ? '#BFFF00' : 'rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 9, background: form.is_required ? '#0A0A0A' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s', left: form.is_required ? 18 : 2 }} />
            </button>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {form.is_required ? 'Required — user must choose before registering' : 'Optional — user can skip'}
            </span>
          </div>
        </div>
      )}

      {/* Detail Image */}
      <div>
        <label style={lbl}>Detail Image</label>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Optional — size guide, item preview, voucher image, or extra details</p>
        {form.detail_image_url ? (
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120 }}>
            <img src={form.detail_image_url} alt="detail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {uploadingImage && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: 20, height: 20, color: '#BFFF00', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {!uploadingImage && (
              <button type="button" onClick={() => set('detail_image_url', '')}
                style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 13, height: 13, color: 'white' }} />
              </button>
            )}
          </div>
        ) : (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            {uploadingImage
              ? <Loader2 style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)', animation: 'spin 1s linear infinite' }} />
              : <ImagePlus style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
            }
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {uploadingImage ? 'Uploading…' : 'Upload detail image'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleDetailImageUpload} />
          </label>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }}>
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{
            flex: 2, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: isEdit ? 'rgba(138,43,226,0.12)' : 'rgba(191,255,0,0.1)',
            border: isEdit ? '1px solid rgba(138,43,226,0.35)' : '1px solid rgba(191,255,0,0.3)',
            color: isEdit ? '#c084fc' : '#BFFF00',
          }}>
          {saving && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}

export default function CategoryItemsManager({ categoryId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingImage, setViewingImage] = useState(null); // URL for lightbox

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['category-items', categoryId],
    queryFn: () => base44.entities.CategoryItem.filter({ event_category_id: categoryId }),
    enabled: !!categoryId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['category-items', categoryId] });

  const handleSaved = () => {
    invalidate();
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setShowForm(false);
    setEditingItem({
      ...item,
      variant_options: item.variant_options || [],
      detail_image_url: item.detail_image_url || '',
    });
  };

  const handleDelete = async (item) => {
    await base44.entities.CategoryItem.update(item.id, { is_active: false });
    invalidate();
  };

  const handleReactivate = async (item) => {
    await base44.entities.CategoryItem.update(item.id, { is_active: true });
    invalidate();
  };

  const activeItems = [...items].filter(i => i.is_active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const inactiveItems = items.filter(i => i.is_active === false);
  const sortOrderNext = items.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Included Items
        </p>
        {!showForm && !editingItem && (
          <button type="button" onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.2)', color: '#BFFF00' }}>
            <Plus style={{ width: 11, height: 11 }} /> Add Item
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <ItemForm
          categoryId={categoryId}
          sortOrderNext={sortOrderNext}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingItem && (
        <ItemForm
          categoryId={categoryId}
          initial={editingItem}
          editingId={editingItem.id}
          sortOrderNext={sortOrderNext}
          onSaved={handleSaved}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.3)' }}>
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          No items yet — add shirts, medals, vouchers, etc.
        </div>
      )}

      {/* Active items list */}
      {activeItems.map(item => {
        const isEditingThis = editingItem?.id === item.id;
        return (
          <div key={item.id} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${isEditingThis ? 'rgba(138,43,226,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            opacity: isEditingThis ? 0.5 : 1, transition: 'opacity 0.2s',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{ITEM_TYPE_EMOJI[item.item_type] || '📦'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{item.name}</p>
              {item.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{item.description}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  {item.item_type}
                </span>
                {item.has_variant && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(191,255,0,0.08)', color: '#BFFF00' }}>
                    {item.variant_type}: {item.variant_options?.join(', ')}
                  </span>
                )}
                {item.detail_image_url && (
                  <button type="button" onClick={() => setViewingImage(item.detail_image_url)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(138,43,226,0.1)', color: '#c084fc', border: '1px solid rgba(138,43,226,0.2)', cursor: 'pointer' }}>
                    <Eye style={{ width: 10, height: 10 }} /> Detail image
                  </button>
                )}
              </div>
            </div>
            {!isEditingThis && (
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button type="button" onClick={() => handleEdit(item)}
                  style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.2)' }}>
                  <Pencil style={{ width: 12, height: 12, color: '#c084fc' }} />
                </button>
                <button type="button" onClick={() => handleDelete(item)}
                  style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.18)' }}>
                  <Trash2 style={{ width: 12, height: 12, color: 'rgba(255,100,100,0.7)' }} />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Inactive items */}
      {inactiveItems.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Hidden Items</p>
          {inactiveItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 6, opacity: 0.5 }}>
              <span style={{ fontSize: 14 }}>{ITEM_TYPE_EMOJI[item.item_type] || '📦'}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.name}</span>
              <button type="button" onClick={() => handleReactivate(item)}
                style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.18)', color: '#BFFF00' }}>
                Show
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail image lightbox */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'relative', maxWidth: 500, width: '100%' }}>
            <img src={viewingImage} alt="detail" style={{ width: '100%', borderRadius: 16, objectFit: 'contain', maxHeight: '80dvh' }} />
            <button onClick={() => setViewingImage(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: 16, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16, color: '#0A0A0A' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
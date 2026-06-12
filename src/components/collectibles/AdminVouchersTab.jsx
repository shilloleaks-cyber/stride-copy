import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, Trash2, Upload, X, RefreshCw } from 'lucide-react';

const C = {
  bg: '#0A0A0A',
  card: '#111111',
  lime: '#C8FF00',
  limeDim: 'rgba(200,255,0,0.08)',
  limeBorder: 'rgba(200,255,0,0.25)',
  purple: '#A855F7',
  purpleDim: 'rgba(168,85,247,0.1)',
  purpleBorder: 'rgba(168,85,247,0.3)',
  muted: 'rgba(255,255,255,0.4)',
  mutedHi: 'rgba(255,255,255,0.6)',
  text: '#ffffff',
  line: 'rgba(255,255,255,0.08)',
};

const REWARD_TYPES = ['discount', 'free_item', 'cash_value', 'experience', 'special_access'];
const VOUCHER_STATUS_OPTS = ['draft', 'published', 'archived'];

const REWARD_CFG = {
  discount:       { label: 'Discount',       color: '#FFD700',            border: 'rgba(255,215,0,0.3)',    bg: 'rgba(255,215,0,0.08)' },
  free_item:      { label: 'Free Item',       color: '#00e676',            border: 'rgba(0,230,118,0.3)',    bg: 'rgba(0,230,118,0.08)' },
  cash_value:     { label: 'Cash Value',      color: C.lime,               border: C.limeBorder,             bg: C.limeDim },
  experience:     { label: 'Experience',      color: C.purple,             border: C.purpleBorder,           bg: C.purpleDim },
  special_access: { label: 'Special Access',  color: 'rgba(255,120,80,1)', border: 'rgba(255,120,80,0.3)',   bg: 'rgba(255,120,80,0.08)' },
};

const STATUS_CFG = {
  draft:     { label: 'Draft',    color: '#FFD700',              border: 'rgba(255,215,0,0.3)',    bg: 'rgba(255,215,0,0.08)' },
  published: { label: 'Live',     color: 'rgba(80,200,120,1)',   border: 'rgba(80,200,120,0.3)',   bg: 'rgba(80,200,120,0.08)' },
  archived:  { label: 'Archived', color: 'rgba(150,150,150,1)', border: 'rgba(150,150,150,0.25)', bg: 'rgba(150,150,150,0.06)' },
};

function Badge({ children, color, border, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
      color, border: `1px solid ${border}`, background: bg,
      textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function PillBtn({ children, onClick, color = C.lime, border = C.limeBorder, bg = C.limeDim, icon: IconComp, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      padding: '8px 4px', borderRadius: 20, background: bg, border: `1px solid ${border}`,
      color, fontSize: 11, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      WebkitTapHighlightColor: 'transparent', minHeight: 36, opacity: disabled ? 0.5 : 1,
    }}>
      {IconComp && <IconComp style={{ width: 11, height: 11 }} />}
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', options, multiline }) {
  const style = {
    width: '100%', padding: '11px 14px', borderRadius: 12, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 14, outline: 'none', marginTop: 6, fontFamily: 'inherit',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...style, appearance: 'none' }}>
          {options.map(o => <option key={o} value={o} style={{ background: '#111' }}>{o.replace(/_/g, ' ')}</option>)}
        </select>
      ) : multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={style} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={style} />
      )}
    </div>
  );
}

function ImageUploadField({ label, value, onChange, square }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  const previewStyle = square
    ? { width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.limeBorder}`, display: 'block' }
    : { width: 80, height: 120, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.limeBorder}`, display: 'block' };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{label}</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt={label} style={previewStyle} />
          <button onClick={() => { onChange(''); inputRef.current.value = ''; }}
            style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ff4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 12, height: 12, color: '#fff' }} />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current.click()} disabled={uploading} style={{
          width: '100%', aspectRatio: square ? '1/1' : '2/3', borderRadius: 12,
          border: `2px dashed rgba(255,255,255,0.12)`,
          background: 'rgba(255,255,255,0.03)', color: C.muted, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 600,
        }}>
          {uploading ? <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 18, height: 18 }} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      )}
    </div>
  );
}

// ── Voucher Form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', description: '', sponsor_name: '', sponsor_logo_url: '',
  voucher_image_url: '', reward_type: 'discount', reward_value: '',
  quantity: '0', expiry_date: '', status: 'draft',
  terms_conditions: '', redeem_instruction: '',
};

function VoucherForm({ initial = EMPTY_FORM, title, submitLabel, onSubmit, isPending, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#0F0F0F', border: `1px solid ${C.purpleBorder}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: C.text }}>{title}</p>
      <Field label="Title" value={form.title} onChange={set('title')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <ImageUploadField label="Voucher Image" value={form.voucher_image_url} onChange={set('voucher_image_url')} />
        <ImageUploadField label="Sponsor Logo" value={form.sponsor_logo_url} onChange={set('sponsor_logo_url')} square />
      </div>
      <Field label="Reward Type" value={form.reward_type} onChange={set('reward_type')} options={REWARD_TYPES} />
      <Field label="Reward Value (e.g. 20%, Free Coffee, 100 THB)" value={form.reward_value} onChange={set('reward_value')} />
      <Field label="Quantity (0 = Unlimited)" value={form.quantity} onChange={set('quantity')} type="number" />
      <Field label="Expiry Date" value={form.expiry_date} onChange={set('expiry_date')} type="date" />
      <Field label="Terms & Conditions" value={form.terms_conditions} onChange={set('terms_conditions')} multiline />
      <Field label="Redeem Instruction" value={form.redeem_instruction} onChange={set('redeem_instruction')} multiline />
      <Field label="Status" value={form.status} onChange={set('status')} options={VOUCHER_STATUS_OPTS} />
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button onClick={() => onSubmit(form)} disabled={!form.title || isPending} style={{
          flex: 1, padding: '13px', borderRadius: 14,
          background: isPending ? 'rgba(200,255,0,0.4)' : C.lime,
          color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer',
        }}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button onClick={onCancel} style={{ padding: '13px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Voucher Preview Modal ───────────────────────────────────────────────────────
function VoucherPreviewModal({ voucher, onClose }) {
  const rewardCfg = REWARD_CFG[voucher.reward_type] || REWARD_CFG.discount;
  const statusCfg = STATUS_CFG[voucher.status] || STATUS_CFG.draft;
  const qty = voucher.quantity > 0 ? voucher.quantity : null;
  const redeemed = voucher.redeemed_count || 0;
  const remaining = qty !== null ? Math.max(0, qty - redeemed) : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: '#111',
        borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
        boxShadow: `0 -20px 60px rgba(0,0,0,0.5), 0 0 40px ${rewardCfg.color}18`,
      }}>
        {/* Handle */}
        <div style={{ padding: '14px 20px 0', position: 'sticky', top: 0, background: '#111', zIndex: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 12 }}>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 20px', paddingBottom: 'calc(160px + env(safe-area-inset-bottom))' }}>
          {/* Voucher image */}
          {voucher.voucher_image_url ? (
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 18, overflow: 'hidden', marginBottom: 20, border: `1px solid ${rewardCfg.border}` }}>
              <img src={voucher.voucher_image_url} alt={voucher.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 18, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${rewardCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: rewardCfg.color }}>
              🎟
            </div>
          )}

          {/* Sponsor row */}
          {(voucher.sponsor_logo_url || voucher.sponsor_name) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {voucher.sponsor_logo_url && (
                <img src={voucher.sponsor_logo_url} alt="sponsor" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              )}
              {voucher.sponsor_name && <p style={{ fontSize: 13, fontWeight: 700, color: '#00e676', margin: 0 }}>{voucher.sponsor_name}</p>}
            </div>
          )}

          {/* Title + badges */}
          <p style={{ fontSize: 22, fontWeight: 900, color: C.text, margin: '0 0 10px', lineHeight: 1.2 }}>{voucher.title}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <Badge children={rewardCfg.label} color={rewardCfg.color} border={rewardCfg.border} bg={rewardCfg.bg} />
            <Badge children={statusCfg.label} color={statusCfg.color} border={statusCfg.border} bg={statusCfg.bg} />
          </div>

          {/* Reward value */}
          {voucher.reward_value && (
            <div style={{ padding: '12px 16px', background: `${rewardCfg.color}0D`, border: `1px solid ${rewardCfg.border}`, borderRadius: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: rewardCfg.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>Reward Value</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: rewardCfg.color, margin: 0 }}>{voucher.reward_value}</p>
            </div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Quantity', val: qty ?? 'Unlimited', color: C.mutedHi },
              { label: 'Redeemed', val: redeemed, color: C.lime },
              { label: 'Remaining', val: remaining ?? 'Unlimited', color: remaining === 0 ? 'rgba(255,80,80,0.9)' : 'rgba(80,200,120,0.9)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <p style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 15, fontWeight: 900, color, margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>

          {voucher.expiry_date && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,165,0,0.7)', fontWeight: 700, margin: '0 0 2px' }}>Expires</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,165,0,0.9)', margin: 0 }}>{voucher.expiry_date}</p>
            </div>
          )}

          {voucher.description && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>About</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>{voucher.description}</p>
            </div>
          )}

          {voucher.redeem_instruction && (
            <div style={{ padding: '12px 14px', background: C.limeDim, border: `1px solid ${C.limeBorder}`, borderRadius: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.lime, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>How to Redeem</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{voucher.redeem_instruction}</p>
            </div>
          )}

          {voucher.terms_conditions && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Terms & Conditions</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: 0 }}>{voucher.terms_conditions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Voucher Card ──────────────────────────────────────────────────────────
function AdminVoucherCard({ voucher, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Vouchers.delete(voucher.id),
    onSuccess: onRefresh,
  });

  const editMutation = useMutation({
    mutationFn: (form) => base44.entities.Vouchers.update(voucher.id, {
      ...form,
      quantity: form.quantity !== '' ? Number(form.quantity) : 0,
    }),
    onSuccess: () => { setEditing(false); onRefresh(); },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Vouchers.update(voucher.id, { status: newStatus }),
    onSuccess: onRefresh,
  });

  const qty = voucher.quantity > 0 ? voucher.quantity : null;
  const redeemed = voucher.redeemed_count || 0;
  const remaining = qty !== null ? Math.max(0, qty - redeemed) : null;
  const rewardCfg = REWARD_CFG[voucher.reward_type] || REWARD_CFG.discount;
  const statusCfg = STATUS_CFG[voucher.status] || STATUS_CFG.draft;
  const status = voucher.status || 'draft';
  const thumb = voucher.voucher_image_url || voucher.sponsor_logo_url;

  if (editing) {
    return (
      <VoucherForm
        initial={{
          title: voucher.title || '',
          description: voucher.description || '',
          sponsor_name: voucher.sponsor_name || '',
          sponsor_logo_url: voucher.sponsor_logo_url || '',
          voucher_image_url: voucher.voucher_image_url || '',
          reward_type: voucher.reward_type || 'discount',
          reward_value: voucher.reward_value || '',
          quantity: voucher.quantity != null ? String(voucher.quantity) : '0',
          expiry_date: voucher.expiry_date || '',
          status: voucher.status || 'draft',
          terms_conditions: voucher.terms_conditions || '',
          redeem_instruction: voucher.redeem_instruction || '',
        }}
        title={`Edit: ${voucher.title}`}
        submitLabel="Save Changes"
        onSubmit={(form) => editMutation.mutate(form)}
        isPending={editMutation.isPending}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 20,
        padding: 16, marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Thumbnail */}
          <div style={{
            width: 72, height: 72, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
            border: `1.5px solid ${rewardCfg.border}`,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {thumb
              ? <img src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 28, color: rewardCfg.color }}>🎟</span>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: C.text, margin: '0 0 6px', lineHeight: 1.2 }}>{voucher.title}</p>
            {voucher.sponsor_name && (
              <p style={{ fontSize: 11, color: '#00e676', margin: '0 0 6px', fontWeight: 700 }}>{voucher.sponsor_name}</p>
            )}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Badge children={rewardCfg.label} color={rewardCfg.color} border={rewardCfg.border} bg={rewardCfg.bg} />
              <Badge children={statusCfg.label} color={statusCfg.color} border={statusCfg.border} bg={statusCfg.bg} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 12 }}>
          {[
            { label: 'Qty', val: qty ?? '∞', color: 'rgba(200,200,200,0.8)' },
            { label: 'Redeemed', val: redeemed, color: C.lime },
            { label: 'Left', val: remaining ?? '∞', color: remaining === 0 ? 'rgba(255,80,80,0.9)' : 'rgba(80,200,120,0.9)' },
            { label: 'Expires', val: voucher.expiry_date ? voucher.expiry_date.slice(5) : '—', color: 'rgba(255,165,0,0.8)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ padding: '7px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>{label}</p>
              <p style={{ fontSize: String(val).length > 4 ? 11 : 15, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <PillBtn onClick={() => setPreviewing(true)} icon={Eye} color={C.lime} border={C.limeBorder} bg={C.limeDim}>Preview</PillBtn>
          <PillBtn onClick={() => setEditing(true)} icon={Pencil} color="rgba(255,255,255,0.5)" border="rgba(255,255,255,0.1)" bg="rgba(255,255,255,0.04)">Edit</PillBtn>

          {status === 'draft' && (
            <PillBtn onClick={() => statusMutation.mutate('published')} color="rgba(80,200,120,0.9)" border="rgba(80,200,120,0.3)" bg="rgba(80,200,120,0.08)">
              {statusMutation.isPending ? '…' : 'Publish'}
            </PillBtn>
          )}
          {status === 'published' && (
            <PillBtn onClick={() => statusMutation.mutate('archived')} color="rgba(150,150,150,0.9)" border="rgba(150,150,150,0.25)" bg="rgba(150,150,150,0.06)">Archive</PillBtn>
          )}
          {status === 'archived' && (
            <PillBtn onClick={() => statusMutation.mutate('published')} color="rgba(80,200,120,0.9)" border="rgba(80,200,120,0.3)" bg="rgba(80,200,120,0.08)">
              {statusMutation.isPending ? '…' : 'Restore'}
            </PillBtn>
          )}

          {(status === 'draft' || status === 'archived') && (
            !confirmDelete ? (
              <PillBtn onClick={() => setConfirmDelete(true)} icon={Trash2} color="rgba(255,100,100,0.9)" border="rgba(255,80,80,0.2)" bg="rgba(255,80,80,0.06)">Delete</PillBtn>
            ) : (
              <PillBtn onClick={() => deleteMutation.mutate()} color="#ff6060" border="rgba(255,80,80,0.4)" bg="rgba(255,80,80,0.12)">
                {deleteMutation.isPending ? '…' : 'Confirm?'}
              </PillBtn>
            )
          )}
        </div>
      </div>

      {previewing && <VoucherPreviewModal voucher={voucher} onClose={() => setPreviewing(false)} />}
    </>
  );
}

// ── Create Voucher Button ───────────────────────────────────────────────────────
function CreateVoucherForm({ onCreated }) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (form) => base44.entities.Vouchers.create({
      ...form,
      quantity: form.quantity !== '' ? Number(form.quantity) : 0,
      redeemed_count: 0,
    }),
    onSuccess: () => { setOpen(false); onCreated(); },
  });

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 20,
      background: C.limeDim, border: `1px solid ${C.limeBorder}`, color: C.lime,
      fontSize: 13, fontWeight: 800, cursor: 'pointer',
    }}>
      <Plus style={{ width: 14, height: 14 }} /> New Voucher
    </button>
  );

  return (
    <VoucherForm
      title="Create Voucher"
      submitLabel="Create"
      onSubmit={(form) => mutation.mutate(form)}
      isPending={mutation.isPending}
      onCancel={() => setOpen(false)}
    />
  );
}

// ── Vouchers Tab ────────────────────────────────────────────────────────────────
export default function AdminVouchersTab({ vouchers, onRefresh }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.mutedHi, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Vouchers ({vouchers.length})
        </p>
        <CreateVoucherForm onCreated={onRefresh} />
      </div>

      {vouchers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎟</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No vouchers yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Create your first voucher</p>
        </div>
      ) : (
        vouchers.map(v => (
          <AdminVoucherCard key={v.id} voucher={v} onRefresh={onRefresh} />
        ))
      )}
    </>
  );
}
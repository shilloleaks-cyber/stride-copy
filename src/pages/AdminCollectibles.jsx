import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, QrCode, RefreshCw, Upload, X, Eye, Pencil, Trash2, Copy, Check } from 'lucide-react';
import AdminCardPreviewModal from '@/components/collectibles/AdminCardPreviewModal';
import QRCode from 'qrcode';

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

const RARITY_OPTS = ['common', 'rare', 'epic', 'legendary', 'founder', 'sponsor'];
const SOURCE_OPTS = ['event', 'purchase', 'mission', 'sponsor', 'admin'];
const STATUS_OPTS = ['draft', 'coming_soon', 'published', 'archived'];
const TABS = ['Cards', 'Vouchers', 'Claimed'];

const STATUS_CFG = {
  draft:       { label: 'Draft',       color: '#FFD700',            border: 'rgba(255,215,0,0.3)',    bg: 'rgba(255,215,0,0.08)' },
  coming_soon: { label: 'Coming Soon', color: C.purple,             border: C.purpleBorder,           bg: C.purpleDim },
  published:   { label: 'Live',        color: 'rgba(80,200,120,1)', border: 'rgba(80,200,120,0.3)',   bg: 'rgba(80,200,120,0.08)' },
  archived:    { label: 'Archived',    color: 'rgba(150,150,150,1)', border: 'rgba(150,150,150,0.25)', bg: 'rgba(150,150,150,0.06)' },
};

const RARITY_COLOR = {
  common: 'rgba(180,180,180,1)', rare: 'rgba(80,160,255,1)',
  epic: 'rgba(180,80,255,1)', legendary: '#FFD700',
  founder: '#C8FF00', sponsor: '#00e676',
};

// ── Shared UI Atoms ────────────────────────────────────────────────────────────
function Badge({ children, color, border, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
      color: color, border: `1px solid ${border}`, background: bg,
      textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function PillBtn({ children, onClick, color = C.lime, border = C.limeBorder, bg = C.limeDim, icon: IconComp }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      padding: '8px 4px', borderRadius: 20, background: bg, border: `1px solid ${border}`,
      color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent', minHeight: 36,
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
          {options.map(o => <option key={o} value={o} style={{ background: '#111' }}>{o}</option>)}
        </select>
      ) : multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={style} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} style={style} />
      )}
    </div>
  );
}

function ImageUploadField({ label, value, onChange }) {
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

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{label}</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt={label} style={{ width: 80, height: 120, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.limeBorder}`, display: 'block' }} />
          <button onClick={() => { onChange(''); inputRef.current.value = ''; }}
            style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ff4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 12, height: 12, color: '#fff' }} />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current.click()} disabled={uploading} style={{
          width: '100%', aspectRatio: '2/3', borderRadius: 12, border: `2px dashed rgba(255,255,255,0.12)`,
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

// ── Serial Fields ──────────────────────────────────────────────────────────────
function SerialFields({ form, set }) {
  const digits = Number(form.serial_digits) || 4;
  const prefix = form.serial_prefix || 'BX';
  const example = `${prefix}-${'47'.padStart(digits, '0')}`;
  const position = form.max_supply ? `#${'47'.padStart(digits, '0')} / ${String(form.max_supply).padStart(digits, '0')}` : '';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 14px', background: 'rgba(200,255,0,0.04)', border: `1px solid ${form.enable_serial_random ? C.limeBorder : 'rgba(255,255,255,0.08)'}`, borderRadius: 12 }}>
        <input type="checkbox" id="serial_toggle" checked={!!form.enable_serial_random} onChange={e => set('enable_serial_random')(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.lime, cursor: 'pointer', flexShrink: 0 }} />
        <label htmlFor="serial_toggle" style={{ fontSize: 13, fontWeight: 700, color: form.enable_serial_random ? C.lime : C.muted, cursor: 'pointer', userSelect: 'none' }}>Enable Serial Numbers</label>
      </div>
      {form.enable_serial_random && (
        <div style={{ background: 'rgba(200,255,0,0.03)', border: `1px solid ${C.limeBorder}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <Field label="Serial Prefix (e.g. BX-FND)" value={form.serial_prefix} onChange={set('serial_prefix')} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Max Supply" value={form.max_supply} onChange={set('max_supply')} type="number" /></div>
            <div style={{ flex: 1 }}><Field label="Serial Digits" value={form.serial_digits} onChange={set('serial_digits')} type="number" /></div>
          </div>
          {form.serial_prefix && (
            <div style={{ marginTop: 4, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(200,255,0,0.12)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(200,255,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 5px' }}>Preview</p>
              <p style={{ fontSize: 13, color: C.lime, fontFamily: 'monospace', fontWeight: 800, margin: '0 0 2px' }}>{example}</p>
              {position && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', margin: 0 }}>{position}</p>}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Card Form (shared for create + edit) ───────────────────────────────────────
const EMPTY_CARD_FORM = {
  name: '', description: '', front_image_url: '', back_image_url: '',
  rarity: 'common', source_type: 'admin', sponsor_name: '', event_name: '',
  status: 'draft',
  enable_serial_random: false, serial_prefix: '', max_supply: '', serial_digits: '4',
};

function CardForm({ initial = EMPTY_CARD_FORM, title, submitLabel, onSubmit, isPending, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ background: '#0F0F0F', border: `1px solid ${C.purpleBorder}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: C.text }}>{title}</p>
      <Field label="Name" value={form.name} onChange={set('name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
        <ImageUploadField label="Front Artwork" value={form.front_image_url} onChange={set('front_image_url')} />
        <ImageUploadField label="Back Artwork" value={form.back_image_url} onChange={set('back_image_url')} />
      </div>
      <Field label="Rarity" value={form.rarity} onChange={set('rarity')} options={RARITY_OPTS} />
      <Field label="Source" value={form.source_type} onChange={set('source_type')} options={SOURCE_OPTS} />
      {form.source_type === 'sponsor' && <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />}
      {form.source_type === 'event' && <Field label="Event Name" value={form.event_name} onChange={set('event_name')} />}
      <Field label="Status" value={form.status || 'draft'} onChange={set('status')} options={STATUS_OPTS} />
      <SerialFields form={form} set={set} />
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button onClick={() => onSubmit(form)} disabled={!form.name || isPending} style={{ flex: 1, padding: '13px', borderRadius: 14, background: isPending ? 'rgba(200,255,0,0.4)' : C.lime, color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <button onClick={onCancel} style={{ padding: '13px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Mini Stats Grid (2x2) ──────────────────────────────────────────────────────
function MiniStatsGrid({ card, activeQR = 0 }) {
  const supply = card.max_supply > 0 ? card.max_supply : null;
  const claimed = card.current_supply || 0;
  const remaining = supply !== null ? Math.max(0, supply - claimed) : null;

  const stats = [
    { label: 'Supply',    val: supply ?? '∞',     color: 'rgba(200,200,200,0.8)' },
    { label: 'Claimed',   val: claimed,            color: C.lime },
    { label: 'Remaining', val: remaining ?? '∞',   color: remaining === 0 ? 'rgba(255,80,80,0.9)' : 'rgba(80,200,120,0.9)' },
    { label: 'Active QR', val: activeQR,           color: C.purple },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
      {stats.map(({ label, val, color }) => (
        <div key={label} style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>{label}</p>
          <p style={{ fontSize: String(val).length > 5 ? 12 : 18, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{val}</p>
        </div>
      ))}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ card }) {
  const supply = card.max_supply > 0 ? card.max_supply : null;
  const claimed = card.current_supply || 0;
  const soldOut = supply !== null && claimed >= supply;
  if (soldOut) return <Badge children="Sold Out" color="rgba(255,80,80,0.9)" border="rgba(255,80,80,0.25)" bg="rgba(255,80,80,0.08)" />;
  const cfg = STATUS_CFG[card.status] || STATUS_CFG.draft;
  return <Badge children={cfg.label} color={cfg.color} border={cfg.border} bg={cfg.bg} />;
}

// ── Admin Card (mobile card layout) ───────────────────────────────────────────
function AdminCard({ card, onGenerateQR, onPreview, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Cards.delete(card.id),
    onSuccess: onDeleted,
  });

  const editMutation = useMutation({
    mutationFn: (form) => base44.entities.Cards.update(card.id, {
      ...form,
      max_supply: form.max_supply ? Number(form.max_supply) : 0,
      serial_digits: Number(form.serial_digits) || 4,
    }),
    onSuccess: () => { setEditing(false); onDeleted(); },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Cards.update(card.id, { status: newStatus }),
    onSuccess: onDeleted,
  });

  const thumbnail = card.front_image_url || card.image_url;
  const rarityColor = RARITY_COLOR[card.rarity] || C.lime;
  const status = card.status || 'draft';
  const SOURCE_LABEL = { event: 'Event', purchase: 'Purchase', mission: 'Mission', sponsor: 'Sponsor', admin: 'Admin' };

  if (editing) {
    return (
      <CardForm
        initial={{
        name: card.name || '', description: card.description || '',
        front_image_url: card.front_image_url || card.image_url || '',
        back_image_url: card.back_image_url || '',
        rarity: card.rarity || 'common', source_type: card.source_type || 'admin',
        sponsor_name: card.sponsor_name || '', event_name: card.event_name || '',
        status: card.status || 'draft',
        enable_serial_random: card.enable_serial_random || false,
        serial_prefix: card.serial_prefix || '',
        max_supply: card.max_supply ? String(card.max_supply) : '',
        serial_digits: String(card.serial_digits || 4),
        }}
        title={`Edit: ${card.name}`}
        submitLabel="Save Changes"
        onSubmit={(form) => editMutation.mutate(form)}
        isPending={editMutation.isPending}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 20,
      padding: 16, marginBottom: 12,
      boxShadow: `0 2px 16px rgba(0,0,0,0.4)`,
    }}>
      {/* Top row: thumbnail + info */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <div style={{
          width: 64, height: 90, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
          border: `1.5px solid ${rarityColor}33`,
          boxShadow: `0 0 16px ${rarityColor}22`,
          background: 'rgba(255,255,255,0.04)',
        }}>
          {thumbnail ? (
            <img src={thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✦</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: C.text, margin: '0 0 8px', lineHeight: 1.2 }}>{card.name}</p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge
              children={card.rarity}
              color={rarityColor}
              border={`${rarityColor}44`}
              bg={`${rarityColor}12`}
            />
            <Badge
              children={SOURCE_LABEL[card.source_type] || card.source_type}
              color="rgba(255,255,255,0.45)"
              border="rgba(255,255,255,0.12)"
              bg="rgba(255,255,255,0.04)"
            />
            <StatusBadge card={card} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <MiniStatsGrid card={card} />

      {/* Action pills — status-aware */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <PillBtn onClick={() => onPreview(card)} icon={Eye} color={C.lime} border={C.limeBorder} bg={C.limeDim}>Preview</PillBtn>

        {status === 'published' && (
          <PillBtn onClick={() => onGenerateQR(card)} icon={QrCode} color={C.purple} border={C.purpleBorder} bg={C.purpleDim}>QR</PillBtn>
        )}

        <PillBtn onClick={() => setEditing(true)} icon={Pencil} color="rgba(255,255,255,0.5)" border="rgba(255,255,255,0.1)" bg="rgba(255,255,255,0.04)">Edit</PillBtn>

        {(status === 'draft') && (
          <PillBtn onClick={() => statusMutation.mutate('published')} color="rgba(80,200,120,0.9)" border="rgba(80,200,120,0.3)" bg="rgba(80,200,120,0.08)">
            {statusMutation.isPending ? '…' : 'Publish'}
          </PillBtn>
        )}
        {(status === 'coming_soon') && (
          <>
            <PillBtn onClick={() => statusMutation.mutate('published')} color="rgba(80,200,120,0.9)" border="rgba(80,200,120,0.3)" bg="rgba(80,200,120,0.08)">
              {statusMutation.isPending ? '…' : 'Publish'}
            </PillBtn>
            <PillBtn onClick={() => statusMutation.mutate('archived')} color="rgba(150,150,150,0.9)" border="rgba(150,150,150,0.25)" bg="rgba(150,150,150,0.06)">Archive</PillBtn>
          </>
        )}
        {(status === 'published') && (
          <PillBtn onClick={() => statusMutation.mutate('archived')} color="rgba(150,150,150,0.9)" border="rgba(150,150,150,0.25)" bg="rgba(150,150,150,0.06)">Archive</PillBtn>
        )}
        {(status === 'archived') && (
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
  );
}

// ── Create Card Form ───────────────────────────────────────────────────────────
function CreateCardForm({ onCreated }) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (form) => base44.entities.Cards.create({
      ...form,
      is_active: true,
      max_supply: form.max_supply ? Number(form.max_supply) : 0,
      serial_digits: Number(form.serial_digits) || 4,
      current_supply: 0,
    }),
    onSuccess: () => { setOpen(false); onCreated(); },
  });

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 20,
      background: C.limeDim, border: `1px solid ${C.limeBorder}`, color: C.lime,
      fontSize: 13, fontWeight: 800, cursor: 'pointer',
    }}>
      <Plus style={{ width: 14, height: 14 }} /> New Card
    </button>
  );

  return (
    <CardForm
      title="Create Card"
      submitLabel="Create"
      onSubmit={(form) => mutation.mutate(form)}
      isPending={mutation.isPending}
      onCancel={() => setOpen(false)}
    />
  );
}

// ── Create Voucher Form ────────────────────────────────────────────────────────
function CreateVoucherForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', sponsor_name: '', description: '', quantity: '0', expiry_date: '' });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.Vouchers.create({ ...form, quantity: Number(form.quantity), redeemed_count: 0, is_active: true }),
    onSuccess: () => { setOpen(false); setForm({ title: '', sponsor_name: '', description: '', quantity: '0', expiry_date: '' }); onCreated(); },
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
    <div style={{ background: '#0F0F0F', border: `1px solid ${C.purpleBorder}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: C.text }}>Create Voucher</p>
      <Field label="Title" value={form.title} onChange={set('title')} />
      <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <Field label="Quantity (0 = unlimited)" value={form.quantity} onChange={set('quantity')} type="number" />
      <Field label="Expiry Date" value={form.expiry_date} onChange={set('expiry_date')} type="date" />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending} style={{ flex: 1, padding: '13px', borderRadius: 14, background: C.lime, color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '13px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ card, token, qrDataUrl, expiresAt, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiryStr = expiresAt
    ? new Date(expiresAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, background: '#111', borderRadius: '24px 24px 0 0',
        border: `1px solid rgba(255,255,255,0.1)`, borderBottom: 'none',
        padding: '24px 24px 48px', textAlign: 'center',
        boxShadow: `0 0 60px rgba(200,255,0,0.08)`,
      }}>
        {/* Drag pill */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(200,255,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>QR Claim Code</p>
        <p style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: '0 0 20px', lineHeight: 1.2 }}>{card.name}</p>

        {/* QR */}
        <div style={{ width: 200, height: 200, margin: '0 auto 16px', borderRadius: 18, overflow: 'hidden', background: '#fff', padding: 8 }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw style={{ width: 32, height: 32, color: '#aaa', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>

        {/* Expiry */}
        {expiryStr && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.2)', marginBottom: 16 }}>
            <span style={{ fontSize: 12 }}>⏱</span>
            <span style={{ fontSize: 11, color: 'rgba(255,165,0,0.85)', fontWeight: 700 }}>Expires {expiryStr}</span>
          </div>
        )}

        {/* Token copy row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, textAlign: 'left' }}>
          <p style={{ flex: 1, fontSize: 10, color: C.muted, wordBreak: 'break-all', fontFamily: 'monospace', margin: 0, lineHeight: 1.5 }}>{token}</p>
          <button onClick={handleCopy} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: copied ? C.limeDim : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? C.limeBorder : 'rgba(255,255,255,0.1)'}`, color: copied ? C.lime : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,165,0,0.6)', marginBottom: 20 }}>⚠️ Single-use · Expires in 24 hours</p>

        <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 14, background: C.lime, color: '#000', fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCollectibles() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Cards');
  const [qrModal, setQrModal] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: cards = [], refetch: refetchCards } = useQuery({
    queryKey: ['admin-cards'],
    queryFn: () => base44.entities.Cards.list('-created_date', 100),
  });

  const { data: vouchers = [], refetch: refetchVouchers } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => base44.entities.Vouchers.list('-created_date', 100),
  });

  const { data: claimed = [] } = useQuery({
    queryKey: ['admin-claimed'],
    queryFn: () => base44.entities.UserCards.list('-claimed_at', 200),
    enabled: tab === 'Claimed',
  });

  if (user && user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14 }}>
        Access denied.
      </div>
    );
  }

  const handleGenerateQR = async (card) => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.ClaimTokens.create({
      token, card_id: card.id, created_by: user?.email || '', is_used: false, expires_at: expiresAt,
    });
    const qrDataUrl = await QRCode.toDataURL(token, { width: 280, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    setQrModal({ card, token, qrDataUrl, expiresAt });
  };

  const liveCount = cards.filter(c => c.is_active).length;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.bg, color: C.text, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: C.limeDim, border: `1px solid ${C.limeBorder}`, color: C.lime, letterSpacing: '0.12em', textTransform: 'uppercase' }}>ADMIN</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Collectibles</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px' }}>Manage cards, QR claims & rewards</p>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Cards', val: cards.length, color: C.text },
            { label: 'Live', val: liveCount, color: 'rgba(80,200,120,0.9)' },
            { label: 'Total Claimed', val: claimed.length || '—', color: C.lime },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ flex: 1, padding: '10px 8px', borderRadius: 14, background: '#111', border: `1px solid ${C.line}`, textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color, margin: '0 0 2px' }}>{val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, padding: '9px 22px', borderRadius: 22,
            border: tab === t ? `1.5px solid ${C.lime}` : '1.5px solid rgba(255,255,255,0.1)',
            background: tab === t ? C.limeDim : 'rgba(255,255,255,0.03)',
            color: tab === t ? C.lime : C.muted,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* ── Cards tab ── */}
        {tab === 'Cards' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.mutedHi, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Cards ({cards.length})</p>
              <CreateCardForm onCreated={refetchCards} />
            </div>
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>No cards yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Create your first collectible card</p>
              </div>
            ) : (
              cards.map(card => (
                <AdminCard
                  key={card.id}
                  card={card}
                  onGenerateQR={handleGenerateQR}
                  onPreview={setPreviewCard}
                  onDeleted={refetchCards}
                />
              ))
            )}
          </>
        )}

        {/* ── Vouchers tab ── */}
        {tab === 'Vouchers' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.mutedHi, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Vouchers ({vouchers.length})</p>
              <CreateVoucherForm onCreated={refetchVouchers} />
            </div>
            {vouchers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>No vouchers yet.</div>
            ) : (
              vouchers.map(v => (
                <div key={v.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: '16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{v.title}</p>
                      {v.sponsor_name && <p style={{ fontSize: 12, color: '#00e676', margin: '0 0 4px', fontWeight: 600 }}>{v.sponsor_name}</p>}
                      {v.description && <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>{v.description}</p>}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 8, flexShrink: 0, marginLeft: 10,
                      background: v.is_active ? 'rgba(0,230,118,0.08)' : 'rgba(255,80,80,0.08)',
                      border: `1px solid ${v.is_active ? 'rgba(0,230,118,0.25)' : 'rgba(255,80,80,0.2)'}`,
                      color: v.is_active ? '#00e676' : '#ff6060',
                    }}>{v.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: 'Qty', val: v.quantity === 0 ? '∞' : v.quantity },
                      { label: 'Redeemed', val: v.redeemed_count || 0 },
                      ...(v.expiry_date ? [{ label: 'Expires', val: v.expiry_date }] : []),
                    ].map(({ label, val }) => (
                      <div key={label} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Claimed tab ── */}
        {tab === 'Claimed' && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.mutedHi, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Claimed ({claimed.length})</p>
            {claimed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>No claims yet.</div>
            ) : (
              claimed.map(uc => {
                const card = cards.find(c => c.id === uc.card_id);
                const thumb = card?.front_image_url || card?.image_url;
                return (
                  <div key={uc.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                      {thumb ? <img src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✦</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card?.name || 'Unknown Card'}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uc.user_email}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {uc.serial_code && <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.lime, fontWeight: 700 }}>{uc.serial_code}</span>}
                        {uc.supply_position && <span style={{ fontSize: 10, color: C.muted }}>{uc.supply_position}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{uc.claimed_at ? new Date(uc.claimed_at).toLocaleDateString() : '—'}</p>
                      {uc.source && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{uc.source}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {previewCard && <AdminCardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />}
      {qrModal && <QRModal card={qrModal.card} token={qrModal.token} qrDataUrl={qrModal.qrDataUrl} expiresAt={qrModal.expiresAt} onClose={() => setQrModal(null)} />}
    </div>
  );
}
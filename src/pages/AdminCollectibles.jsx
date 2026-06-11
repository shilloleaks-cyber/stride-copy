import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, QrCode, RefreshCw, Upload, X, Eye, Pencil, Trash2 } from 'lucide-react';
import AdminCardPreviewModal from '@/components/collectibles/AdminCardPreviewModal';
import QRCode from 'qrcode';

const C = {
  bg: '#0D0D0D',
  card: 'rgba(22,22,22,0.95)',
  lime: '#BFFF00',
  limeDim: 'rgba(191,255,0,0.08)',
  limeBorder: 'rgba(191,255,0,0.25)',
  purple: '#8A2BE2',
  purpleDim: 'rgba(138,43,226,0.12)',
  purpleBorder: 'rgba(138,43,226,0.3)',
  muted: 'rgba(255,255,255,0.35)',
  text: '#fff',
  line: 'rgba(255,255,255,0.07)',
};

const RARITY_OPTS = ['common', 'rare', 'epic', 'legendary', 'founder', 'sponsor'];
const SOURCE_OPTS = ['event', 'purchase', 'mission', 'sponsor', 'admin'];

const TABS = ['Cards', 'Vouchers', 'Claimed'];

const RARITY_COLOR = {
  common: 'rgba(180,180,180,1)', rare: 'rgba(80,160,255,1)',
  epic: 'rgba(180,80,255,1)', legendary: '#FFD700',
  founder: '#BFFF00', sponsor: '#00e676',
};

// ── Small helpers ──────────────────────────────────────────────────────────────
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</p>
      {action}
    </div>
  );
}

function NeonBtn({ children, onClick, small, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: small ? '7px 12px' : '10px 16px', borderRadius: small ? 10 : 12,
        background: danger ? 'rgba(255,80,80,0.08)' : C.limeDim,
        border: `1px solid ${danger ? 'rgba(255,80,80,0.2)' : C.limeBorder}`,
        color: danger ? 'rgba(255,100,100,1)' : C.lime,
        fontSize: small ? 11 : 13, fontWeight: 800,
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', options, multiline }) {
  const style = {
    width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13, outline: 'none', marginTop: 4,
    fontFamily: 'inherit',
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
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

// ── Image Upload Field ─────────────────────────────────────────────────────────
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
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{label}</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={value} alt={label} style={{ width: 80, height: 120, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.limeBorder}`, display: 'block' }} />
          <button
            onClick={() => { onChange(''); inputRef.current.value = ''; }}
            style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ff4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 12, height: 12, color: '#fff' }} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          style={{
            width: '100%', aspectRatio: '2/3', borderRadius: 10, border: `2px dashed rgba(255,255,255,0.15)`,
            background: 'rgba(255,255,255,0.03)', color: C.muted, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 11, fontWeight: 600,
          }}
        >
          {uploading ? (
            <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload style={{ width: 18, height: 18 }} />
          )}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      )}
    </div>
  );
}

// ── Create Card Form ───────────────────────────────────────────────────────────
const EMPTY_CARD_FORM = { name: '', description: '', front_image_url: '', back_image_url: '', rarity: 'common', source_type: 'admin', sponsor_name: '', event_name: '', enable_serial_random: false, serial_prefix: '', max_supply: '', serial_digits: '4' };

function SerialFields({ form, set }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 12px', background: 'rgba(191,255,0,0.04)', border: '1px solid rgba(191,255,0,0.12)', borderRadius: 10 }}>
        <input type="checkbox" id="serial_toggle" checked={!!form.enable_serial_random} onChange={e => set('enable_serial_random')(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.lime, cursor: 'pointer' }} />
        <label htmlFor="serial_toggle" style={{ fontSize: 12, fontWeight: 700, color: form.enable_serial_random ? C.lime : C.muted, cursor: 'pointer', userSelect: 'none' }}>Enable Serial Numbers</label>
      </div>
      {form.enable_serial_random && (
        <div style={{ background: 'rgba(191,255,0,0.03)', border: '1px solid rgba(191,255,0,0.1)', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
          <Field label="Serial Prefix (e.g. BX-FND)" value={form.serial_prefix} onChange={set('serial_prefix')} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Max Supply" value={form.max_supply} onChange={set('max_supply')} type="number" /></div>
            <div style={{ flex: 1 }}><Field label="Serial Digits" value={form.serial_digits} onChange={set('serial_digits')} type="number" /></div>
          </div>
          {form.serial_prefix && form.max_supply && (
            <p style={{ fontSize: 10, color: 'rgba(191,255,0,0.5)', margin: '4px 0 0', fontFamily: 'monospace' }}>
              Preview: {form.serial_prefix}-{'1'.padStart(Number(form.serial_digits) || 4, '0')} → {form.serial_prefix}-{'1'.padStart(Number(form.serial_digits) || 4, '0')} / {String(form.max_supply).padStart(Number(form.serial_digits) || 4, '0')}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function CreateCardForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CARD_FORM);
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.Cards.create({
      ...form,
      is_active: true,
      max_supply: form.max_supply ? Number(form.max_supply) : 0,
      serial_digits: Number(form.serial_digits) || 4,
      current_supply: 0,
    }),
    onSuccess: () => { setOpen(false); setForm(EMPTY_CARD_FORM); onCreated(); },
  });

  if (!open) return (
    <NeonBtn onClick={() => setOpen(true)}><Plus style={{ width: 14, height: 14 }} />New Card</NeonBtn>
  );

  return (
    <div style={{ background: C.card, border: `1px solid ${C.purpleBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 15, marginBottom: 14, color: C.text }}>Create Card</p>
      <Field label="Name" value={form.name} onChange={set('name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <ImageUploadField label="Front Artwork" value={form.front_image_url} onChange={set('front_image_url')} />
        <ImageUploadField label="Back Artwork" value={form.back_image_url} onChange={set('back_image_url')} />
      </div>
      <Field label="Rarity" value={form.rarity} onChange={set('rarity')} options={RARITY_OPTS} />
      <Field label="Source" value={form.source_type} onChange={set('source_type')} options={SOURCE_OPTS} />
      {form.source_type === 'sponsor' && <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />}
      {form.source_type === 'event' && <Field label="Event Name" value={form.event_name} onChange={set('event_name')} />}
      <SerialFields form={form} set={set} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} style={{ flex: 1, padding: '11px', borderRadius: 12, background: mutation.isPending ? 'rgba(191,255,0,0.4)' : C.lime, color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
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
    <NeonBtn onClick={() => setOpen(true)}><Plus style={{ width: 14, height: 14 }} />New Voucher</NeonBtn>
  );

  return (
    <div style={{ background: C.card, border: `1px solid ${C.purpleBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 15, marginBottom: 14, color: C.text }}>Create Voucher</p>
      <Field label="Title" value={form.title} onChange={set('title')} />
      <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <Field label="Quantity (0 = unlimited)" value={form.quantity} onChange={set('quantity')} type="number" />
      <Field label="Expiry Date" value={form.expiry_date} onChange={set('expiry_date')} type="date" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending} style={{ flex: 1, padding: '11px', borderRadius: 12, background: mutation.isPending ? 'rgba(191,255,0,0.4)' : C.lime, color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => setOpen(false)} style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Edit Card Form ─────────────────────────────────────────────────────────────
function EditCardForm({ card, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: card.name || '',
    description: card.description || '',
    front_image_url: card.front_image_url || card.image_url || '',
    back_image_url: card.back_image_url || '',
    rarity: card.rarity || 'common',
    source_type: card.source_type || 'admin',
    sponsor_name: card.sponsor_name || '',
    event_name: card.event_name || '',
    enable_serial_random: card.enable_serial_random || false,
    serial_prefix: card.serial_prefix || '',
    max_supply: card.max_supply ? String(card.max_supply) : '',
    serial_digits: String(card.serial_digits || 4),
  });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.Cards.update(card.id, {
      ...form,
      max_supply: form.max_supply ? Number(form.max_supply) : 0,
      serial_digits: Number(form.serial_digits) || 4,
    }),
    onSuccess: onSaved,
  });

  return (
    <div style={{ background: 'rgba(138,43,226,0.08)', border: `1px solid rgba(138,43,226,0.3)`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <p style={{ fontWeight: 900, fontSize: 14, marginBottom: 12, color: C.text }}>Edit: {card.name}</p>
      <Field label="Name" value={form.name} onChange={set('name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <ImageUploadField label="Front Artwork" value={form.front_image_url} onChange={set('front_image_url')} />
        <ImageUploadField label="Back Artwork" value={form.back_image_url} onChange={set('back_image_url')} />
      </div>
      <Field label="Rarity" value={form.rarity} onChange={set('rarity')} options={RARITY_OPTS} />
      <Field label="Source" value={form.source_type} onChange={set('source_type')} options={SOURCE_OPTS} />
      {form.source_type === 'sponsor' && <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />}
      {form.source_type === 'event' && <Field label="Event Name" value={form.event_name} onChange={set('event_name')} />}
      <SerialFields form={form} set={set} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} style={{ flex: 1, padding: '11px', borderRadius: 12, background: mutation.isPending ? 'rgba(191,255,0,0.4)' : C.lime, color: '#000', fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer' }}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: C.muted, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Card Row ───────────────────────────────────────────────────────────────────
function CardRow({ card, onGenerateQR, onPreview, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Cards.delete(card.id),
    onSuccess: onDeleted,
  });

  const thumbnail = card.front_image_url || card.image_url;

  if (editing) {
    return <EditCardForm card={card} onSaved={() => { setEditing(false); onDeleted(); /* triggers refetch */ }} onCancel={() => setEditing(false)} />;
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {thumbnail ? (
          <img src={thumbnail} style={{ width: 44, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✦</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</p>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
              color: RARITY_COLOR[card.rarity] || C.lime,
              border: `1px solid ${RARITY_COLOR[card.rarity] || C.lime}44`,
              background: `${RARITY_COLOR[card.rarity] || C.lime}10`,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>{card.rarity}</span>
            {(() => {
              const supply = card.max_supply > 0 ? card.max_supply : null;
              const claimed = card.current_supply || 0;
              const remaining = supply !== null ? Math.max(0, supply - claimed) : null;
              return (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, color: C.muted, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', fontFamily: 'monospace' }}>
                  {supply !== null ? `${supply} sup · ${claimed} clmd · ${remaining} rem` : `${claimed} claimed · ∞`}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={() => onPreview(card)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 10, background: C.limeDim, border: `1px solid ${C.limeBorder}`, color: C.lime, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <Eye style={{ width: 12, height: 12 }} /> Preview
        </button>
        <button onClick={() => onGenerateQR(card)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 10, background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.25)', color: 'rgba(180,80,255,1)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <QrCode style={{ width: 12, height: 12 }} /> QR
        </button>
        <button onClick={() => setEditing(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <Pencil style={{ width: 12, height: 12 }} /> Edit
        </button>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 10, background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.18)', color: 'rgba(255,100,100,1)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <Trash2 style={{ width: 12, height: 12 }} /> Delete
          </button>
        ) : (
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 10, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.4)', color: '#ff6060', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
            {deleteMutation.isPending ? '…' : 'Confirm?'}
          </button>
        )}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111', borderRadius: 24, border: `1px solid ${C.limeBorder}`, padding: 28, maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: `0 0 40px rgba(191,255,0,0.1)` }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 2 }}>Claim QR Code</p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{card.name}</p>

        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 16, margin: '0 auto 16px', display: 'block', background: '#fff', padding: 8 }} />
        ) : (
          <div style={{ width: 220, height: 220, margin: '0 auto 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw style={{ width: 32, height: 32, color: C.muted, animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Expiry badge */}
        {expiryStr && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)', marginBottom: 14 }}>
            <span style={{ fontSize: 12 }}>⏱</span>
            <span style={{ fontSize: 11, color: 'rgba(255,180,0,0.85)', fontWeight: 700 }}>Expires {expiryStr}</span>
          </div>
        )}

        {/* Token row with copy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, textAlign: 'left' }}>
          <p style={{ flex: 1, fontSize: 10, color: C.muted, wordBreak: 'break-all', fontFamily: 'monospace', margin: 0, lineHeight: 1.5 }}>{token}</p>
          <button onClick={handleCopy} style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 8, background: copied ? 'rgba(191,255,0,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? C.limeBorder : 'rgba(255,255,255,0.1)'}`, color: copied ? C.lime : C.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,180,0,0.65)', marginBottom: 20 }}>
          ⚠️ Single-use · Expires in 24 hours
        </p>

        <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 12, background: C.limeDim, border: `1px solid ${C.limeBorder}`, color: C.lime, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminCollectibles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Cards');
  const [qrModal, setQrModal] = useState(null); // { card, token, qrDataUrl }
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
      token,
      card_id: card.id,
      created_by: user?.email || '',
      is_used: false,
      expires_at: expiresAt,
    });
    const qrDataUrl = await QRCode.toDataURL(token, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    setQrModal({ card, token, qrDataUrl, expiresAt });
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: C.bg, color: C.text, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top,0px),52px) 20px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 18, padding: 0 }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(191,255,0,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Admin</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: '0 0 4px' }}>Collectibles</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Manage cards, vouchers & claim tokens</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, padding: '8px 18px', borderRadius: 20,
            border: tab === t ? `1.5px solid ${C.lime}` : '1.5px solid rgba(255,255,255,0.1)',
            background: tab === t ? C.limeDim : 'rgba(255,255,255,0.03)',
            color: tab === t ? C.lime : C.muted,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* ── Cards tab ── */}
        {tab === 'Cards' && (
          <>
            <SectionHeader
              title={`Cards (${cards.length})`}
              action={<CreateCardForm onCreated={refetchCards} />}
            />
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 13 }}>No cards yet.</div>
            ) : (
              cards.map(card => (
                <CardRow
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
            <SectionHeader
              title={`Vouchers (${vouchers.length})`}
              action={<CreateVoucherForm onCreated={refetchVouchers} />}
            />
            {vouchers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 13 }}>No vouchers yet.</div>
            ) : (
              vouchers.map(v => (
                <div key={v.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 3px' }}>{v.title}</p>
                      {v.sponsor_name && <p style={{ fontSize: 11, color: '#00e676', margin: '0 0 6px' }}>{v.sponsor_name}</p>}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.muted }}>Qty: {v.quantity === 0 ? '∞' : v.quantity}</span>
                        <span style={{ fontSize: 11, color: C.muted }}>Redeemed: {v.redeemed_count || 0}</span>
                        {v.expiry_date && <span style={{ fontSize: 11, color: C.muted }}>Exp: {v.expiry_date}</span>}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                      background: v.is_active ? 'rgba(0,230,118,0.08)' : 'rgba(255,80,80,0.08)',
                      border: `1px solid ${v.is_active ? 'rgba(0,230,118,0.25)' : 'rgba(255,80,80,0.2)'}`,
                      color: v.is_active ? '#00e676' : '#ff6060',
                    }}>{v.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Claimed tab ── */}
        {tab === 'Claimed' && (
          <>
            <SectionHeader title={`Claimed (${claimed.length})`} />
            {claimed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 13 }}>No claims yet.</div>
            ) : (
              claimed.map(uc => {
                const card = cards.find(c => c.id === uc.card_id);
                return (
                  <div key={uc.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {card?.image_url ? (
                      <img src={card.image_url} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{card?.name || uc.card_id}</p>
                      <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{uc.user_email} · {uc.source}</p>
                    </div>
                    <p style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>
                      {uc.claimed_at ? new Date(uc.claimed_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Card Preview Modal */}
      {previewCard && (
        <AdminCardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />
      )}

      {/* QR Modal */}
      {qrModal && (
        <QRModal
          card={qrModal.card}
          token={qrModal.token}
          qrDataUrl={qrModal.qrDataUrl}
          expiresAt={qrModal.expiresAt}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
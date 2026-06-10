import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, QrCode, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
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

// ── Create Card Form ───────────────────────────────────────────────────────────
function CreateCardForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', rarity: 'common', source_type: 'admin', sponsor_name: '', event_name: '' });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.Cards.create({ ...form, is_active: true }),
    onSuccess: () => { setOpen(false); setForm({ name: '', description: '', image_url: '', rarity: 'common', source_type: 'admin', sponsor_name: '', event_name: '' }); onCreated(); },
  });

  if (!open) return (
    <NeonBtn onClick={() => setOpen(true)}><Plus style={{ width: 14, height: 14 }} />New Card</NeonBtn>
  );

  return (
    <div style={{ background: C.card, border: `1px solid ${C.purpleBorder}`, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <p style={{ fontWeight: 900, fontSize: 15, marginBottom: 14, color: C.text }}>Create Card</p>
      <Field label="Name" value={form.name} onChange={set('name')} />
      <Field label="Description" value={form.description} onChange={set('description')} multiline />
      <Field label="Image URL" value={form.image_url} onChange={set('image_url')} />
      <Field label="Rarity" value={form.rarity} onChange={set('rarity')} options={RARITY_OPTS} />
      <Field label="Source" value={form.source_type} onChange={set('source_type')} options={SOURCE_OPTS} />
      {form.source_type === 'sponsor' && <Field label="Sponsor Name" value={form.sponsor_name} onChange={set('sponsor_name')} />}
      {form.source_type === 'event' && <Field label="Event Name" value={form.event_name} onChange={set('event_name')} />}
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

// ── QR Token Row ───────────────────────────────────────────────────────────────
function CardRow({ card, onGenerateQR }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {card.image_url ? (
          <img src={card.image_url} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✦</div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: '0 0 3px' }}>{card.name}</p>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
            color: RARITY_COLOR[card.rarity] || C.lime,
            border: `1px solid ${RARITY_COLOR[card.rarity] || C.lime}44`,
            background: `${RARITY_COLOR[card.rarity] || C.lime}10`,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{card.rarity}</span>
        </div>
        <NeonBtn small onClick={() => onGenerateQR(card)}>
          <QrCode style={{ width: 12, height: 12 }} /> QR
        </NeonBtn>
      </div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ card, token, qrDataUrl, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111', borderRadius: 24, border: `1px solid ${C.limeBorder}`, padding: 28, maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 4 }}>Claim QR</p>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>{card.name}</p>

        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 16, margin: '0 auto 16px', display: 'block', background: '#fff', padding: 8 }} />
        ) : (
          <div style={{ width: 220, height: 220, margin: '0 auto 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw style={{ width: 32, height: 32, color: C.muted, animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        <p style={{ fontSize: 10, color: C.muted, wordBreak: 'break-all', marginBottom: 20, fontFamily: 'monospace', lineHeight: 1.5 }}>
          Token: {token}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,180,0,0.7)', marginBottom: 20 }}>
          ⚠️ Single-use only. Share this QR with the recipient.
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
    await base44.entities.ClaimTokens.create({
      token,
      card_id: card.id,
      created_by: user?.email || '',
      is_used: false,
    });
    const qrDataUrl = await QRCode.toDataURL(token, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    setQrModal({ card, token, qrDataUrl });
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
                <CardRow key={card.id} card={card} onGenerateQR={handleGenerateQR} />
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

      {/* QR Modal */}
      {qrModal && (
        <QRModal
          card={qrModal.card}
          token={qrModal.token}
          qrDataUrl={qrModal.qrDataUrl}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
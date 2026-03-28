import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, AlertCircle } from 'lucide-react';
import CategoryItemsPicker from '@/components/stride/CategoryItemsPicker';

const BLOOD_TYPES = ['A', 'B', 'AB', 'O', 'unknown'];

function generateQR() {
  return 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
}

export default function RegistrationForm({ event, category, user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(' ')[0] || '',
    last_name: user?.full_name?.split(' ').slice(1).join(' ') || '',
    phone: user?.phone || '',
    date_of_birth: '',
    gender: 'male',
    nationality: '',
    blood_type: 'unknown',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [itemSelections, setItemSelections] = useState({});
  const [requiredItemsMissing, setRequiredItemsMissing] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [blockReason, setBlockReason] = useState(null);

  const registerMutation = useMutation({
    mutationFn: async () => {
      // Rule 1: Prevent duplicate registration (same user, same event — any active status)
      const existing = await base44.entities.EventRegistration.filter({ event_id: event.id, user_email: user.email });
      const activeExisting = existing.filter(r => r.status !== 'cancelled' && r.status !== 'rejected');
      if (activeExisting.length > 0) {
        throw new Error('DUPLICATE');
      }

      // Rule 2: Re-verify capacity server-side (category may have filled since page loaded)
      const freshCats = await base44.entities.EventCategory.filter({ id: category.id });
      const freshCat = freshCats[0];
      if (freshCat && freshCat.max_slots > 0 && freshCat.registered_count >= freshCat.max_slots) {
        throw new Error('FULL');
      }

      const qr = generateQR();
      const reg = await base44.entities.EventRegistration.create({
        event_id: event.id,
        category_id: category.id,
        user_email: user.email,
        user_id: user.id || user.email,
        ...form,
        item_selections: itemSelections,
        status: 'pending',
        qr_code: qr,
        checked_in: false,
        payment_status: category.price > 0 ? 'pending' : 'not_required',
      });
      await base44.entities.EventCategory.update(category.id, {
        registered_count: (freshCat?.registered_count || category.registered_count || 0) + 1,
      });
      await base44.entities.StrideEvent.update(event.id, {
        total_registered: (event.total_registered || 0) + 1,
      });
      return reg;
    },
    onSuccess: () => {
      setBlockReason(null);
      onSuccess();
    },
    onError: (err) => {
      if (err.message === 'DUPLICATE') setBlockReason('You are already registered for this event.');
      else if (err.message === 'FULL') setBlockReason('Sorry, this category just filled up.');
      else setBlockReason('Registration failed. Please try again.');
    },
  });

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    color: 'white',
    padding: '11px 14px',
    width: '100%',
    outline: 'none',
    fontSize: 15,
  };
  const labelStyle = {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 5,
    display: 'block',
  };

  const canSubmit = form.first_name && form.last_name && form.phone && !requiredItemsMissing;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="flex-1" onClick={onClose} />
      <div
        className="rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '92dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="font-bold text-white text-base">{event.title}</p>
            <p className="text-xs mt-0.5 font-semibold" style={{ color: '#BFFF00' }}>
              {category.name}{category.price > 0 ? ` · ฿${category.price}` : ' · Free'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Error banner */}
        {blockReason && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,100,100,1)' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,120,120,1)' }}>{blockReason}</p>
          </div>
        )}

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Doe" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone *</label>
            <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0812345678" type="tel" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Nationality</label>
              <input style={inputStyle} value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="Thai" />
            </div>
            <div>
              <label style={labelStyle}>Blood Type</label>
              <select style={inputStyle} value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t === 'unknown' ? 'Unknown' : t}</option>)}
              </select>
            </div>
          </div>

          {/* Emergency contact */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Emergency Contact</p>
            <div className="space-y-3">
              <input style={inputStyle} value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Contact name" />
              <input style={inputStyle} value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="Contact phone" type="tel" />
            </div>
          </div>

          {/* Category items */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <CategoryItemsPicker
              categoryId={category.id}
              selections={itemSelections}
              onChange={setItemSelections}
              onValidation={setRequiredItemsMissing}
            />
          </div>

          <div style={{ height: 8 }} />
        </div>

        {/* Submit */}
        <div className="px-6 pb-8 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => registerMutation.mutate()}
            disabled={!canSubmit || registerMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={canSubmit ? { background: '#BFFF00', color: '#0A0A0A' } : { background: 'rgba(191,255,0,0.2)', color: 'rgba(255,255,255,0.3)' }}
          >
            {registerMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</> : 'Complete Registration'}
          </button>
        </div>
      </div>
    </div>
  );
}
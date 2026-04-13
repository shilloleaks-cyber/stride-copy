import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import CategoryItemsPicker from '@/components/stride/CategoryItemsPicker';

function generateQR() {
  return 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
}

export default function RegistrationForm({ event, category, user, onClose, onSuccess }) {
  const [itemSelections, setItemSelections] = useState({});
  const [requiredItemsMissing, setRequiredItemsMissing] = useState(false);
  const [blockReason, setBlockReason] = useState(null);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.EventRegistration.filter({
        event_id: event.id,
        user_email: user.email,
      });

      const activeExisting = existing.filter(
        (r) => r.status !== 'cancelled' && r.status !== 'rejected'
      );

      if (activeExisting.length > 0) throw new Error('DUPLICATE');

      const freshCats = await base44.entities.EventCategory.filter({ id: category.id });
      const freshCat = freshCats[0];

      if (freshCat && freshCat.max_slots > 0 && freshCat.registered_count >= freshCat.max_slots) {
        throw new Error('FULL');
      }

      const qr = generateQR();

      // For free official categories: generate bib immediately
      let autoBib = null;
      const isFreeOfficial = category.price <= 0;
      if (isFreeOfficial) {
        const existingRegs = await base44.entities.EventRegistration.filter({ category_id: category.id });
        const usedBibs = new Set(existingRegs.filter(r => r.bib_number).map(r => r.bib_number));
        const prefix = freshCat?.bib_prefix || 'R';
        const start = freshCat?.bib_start || 1;
        let candidate = start;
        do {
          autoBib = `${prefix}${String(candidate).padStart(3, '0')}`;
          candidate++;
        } while (usedBibs.has(autoBib));
      }

      const displayName =
        user.first_name ||
        user.display_name ||
        user.full_name ||
        user.email?.split('@')[0] ||
        'User';

      const nameParts = String(displayName).trim().split(/\s+/).filter(Boolean);

      const firstName =
        user.first_name ||
        nameParts[0] ||
        user.email?.split('@')[0] ||
        'User';

      const lastName =
        user.last_name ||
        (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '—');

      const payload = {
        event_id: event.id,
        category_id: category.id,
        user_email: user.email,
        user_id: user.id || user.email,
        first_name: firstName,
        last_name: lastName,
        // Free official: confirm immediately with bib. Paid: stay pending for payment flow.
        status: isFreeOfficial ? 'confirmed' : 'pending',
        qr_code: qr,
        checked_in: false,
        blood_type: 'unknown',
        payment_status: isFreeOfficial ? 'not_required' : 'pending',
        ...(autoBib ? { bib_number: autoBib } : {}),
      };

      if (user.phone) payload.phone = user.phone;
      if (user.birth_date) payload.date_of_birth = user.birth_date;
      if (user.gender && ['male', 'female', 'other'].includes(user.gender)) {
        payload.gender = user.gender;
      }
      if (user.nationality) payload.nationality = user.nationality;

      if (itemSelections && typeof itemSelections === 'object' && Object.keys(itemSelections).length > 0) {
        payload.item_selections = itemSelections;
      }

      console.log('REGISTER PAYLOAD', payload);

      const reg = await base44.entities.EventRegistration.create(payload);

      return reg;
    },

    onSuccess: (reg) => {
      setBlockReason(null);
      onSuccess(reg);
    },

    onError: (err) => {
      console.error('REGISTRATION ERROR', err);
      const msg = err?.message || JSON.stringify(err);

      if (msg === 'DUPLICATE') {
        setBlockReason('You are already registered for this event.');
      } else if (msg === 'FULL') {
        setBlockReason('Sorry, this category just filled up.');
      } else {
        setBlockReason(msg);
      }
    },
  });

  const canSubmit = !requiredItemsMissing;

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="flex-1" onClick={onClose} />
      <div
        className="rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80dvh' }}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Registering as */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <div>
              <p className="text-sm font-semibold text-white">{user.full_name || user.email}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
            </div>
          </div>

          {/* Category items picker (only shown if category has items) */}
          <CategoryItemsPicker
            categoryId={category.id}
            selections={itemSelections}
            onChange={setItemSelections}
            onValidation={setRequiredItemsMissing}
          />

          <div style={{ height: 4 }} />
        </div>

        {/* Submit */}
        <div className="px-6 pb-8 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => registerMutation.mutate()}
            disabled={!canSubmit || registerMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
            style={canSubmit && !registerMutation.isPending
              ? { background: '#BFFF00', color: '#0A0A0A' }
              : { background: 'rgba(191,255,0,0.2)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {registerMutation.isPending
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</>
              : category.price > 0 ? 'Register & Proceed to Payment' : 'Confirm Registration'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
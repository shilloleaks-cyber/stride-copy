import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';

const METHOD_LABELS = {
  bank_transfer: 'Bank Transfer',
  promptpay: 'PromptPay',
  cash: 'Cash',
  other: 'Other',
};

export default function PaymentReviewPanel({ payment, reg, catMap, registrations, user, onDone }) {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const generateBib = () => {
    const cat = catMap[reg.category_id];
    const prefix = cat?.bib_prefix || 'R';
    const start = cat?.bib_start || 1;
    const usedBibs = new Set(
      registrations
        .filter(r => r.category_id === reg.category_id && r.bib_number)
        .map(r => r.bib_number)
    );
    let candidate = start;
    let bib;
    do {
      bib = `${prefix}${String(candidate).padStart(3, '0')}`;
      candidate++;
    } while (usedBibs.has(bib));
    return bib;
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const bibNumber = generateBib();
      await Promise.all([
        base44.entities.EventPayment.update(payment.id, {
          status: 'approved',
          reviewed_by: user.email,
          reviewed_at: now,
        }),
        base44.entities.EventRegistration.update(reg.id, {
          status: 'confirmed',
          payment_status: 'paid',
          bib_number: bibNumber,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
      onDone();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await base44.entities.EventPayment.update(payment.id, {
        status: 'rejected',
        reviewed_by: user.email,
        reviewed_at: now,
        admin_note: rejectNote.trim() || null,
      });
      // Keep registration as pending — user can re-upload
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
      onDone();
    },
  });

  const isPending = payment.status === 'pending';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Slip image */}
      {payment.slip_image && (
        <div className="relative" style={{ height: 160 }}>
          <img src={payment.slip_image} alt="Payment slip" className="w-full h-full object-cover" />
          <a
            href={payment.slip_image}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
          >
            <ExternalLink className="w-3 h-3" /> Full size
          </a>
          {/* Status overlay */}
          {payment.status !== 'pending' && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: payment.status === 'approved' ? 'rgba(0,210,110,0.3)' : 'rgba(255,80,80,0.3)' }}>
              {payment.status === 'approved'
                ? <CheckCircle2 className="w-12 h-12" style={{ color: 'rgb(0,210,110)' }} />
                : <XCircle className="w-12 h-12" style={{ color: 'rgba(255,100,100,1)' }} />
              }
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-white">{reg.first_name} {reg.last_name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{reg.user_email}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-lg" style={{ color: '#BFFF00' }}>฿{payment.amount?.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{METHOD_LABELS[payment.method] || payment.method}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Clock className="w-3 h-3" />
          <span>Submitted {format(new Date(payment.created_date), 'MMM d, yyyy · h:mm a')}</span>
        </div>

        {payment.status !== 'pending' && (
          <div className="px-3 py-2 rounded-xl text-xs" style={{
            background: payment.status === 'approved' ? 'rgba(0,210,110,0.08)' : 'rgba(255,80,80,0.08)',
            border: `1px solid ${payment.status === 'approved' ? 'rgba(0,210,110,0.2)' : 'rgba(255,80,80,0.2)'}`,
            color: payment.status === 'approved' ? 'rgb(0,210,110)' : 'rgba(255,100,100,1)',
          }}>
            {payment.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
            {payment.admin_note && <span style={{ color: 'rgba(255,255,255,0.45)' }}> · {payment.admin_note}</span>}
          </div>
        )}

        {isPending && !showRejectInput && (
          <div className="flex gap-2">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(0,210,110,0.15)', color: 'rgb(0,210,110)', border: '1px solid rgba(0,210,110,0.25)' }}
            >
              {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => setShowRejectInput(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(255,80,80,0.1)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.2)' }}
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {isPending && showRejectInput && (
          <div className="space-y-2">
            <input
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,80,80,0.3)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(255,80,80,0.15)', color: 'rgba(255,100,100,1)', border: '1px solid rgba(255,80,80,0.25)' }}
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectInput(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
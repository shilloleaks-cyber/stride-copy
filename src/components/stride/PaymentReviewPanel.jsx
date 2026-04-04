import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle, Loader2, ExternalLink, Clock, Building2, QrCode } from 'lucide-react';
import { format } from 'date-fns';

const METHOD_LABELS = {
  bank_transfer: 'Bank Transfer',
  qr_scan: 'QR Scan',
};

const STATUS_CFG = {
  pending:         { label: 'Awaiting Payment Approval', color: 'rgba(255,200,80,1)',   bg: 'rgba(255,200,80,0.08)',  border: 'rgba(255,200,80,0.2)' },
  approved:        { label: 'Payment Approved',          color: 'rgb(0,210,110)',       bg: 'rgba(0,210,110,0.08)',  border: 'rgba(0,210,110,0.2)' },
  needs_attention: { label: 'Payment Needs Attention',   color: 'rgba(255,150,50,1)',   bg: 'rgba(255,120,0,0.07)', border: 'rgba(255,120,0,0.25)' },
};

export default function PaymentReviewPanel({ payment, reg, catMap, registrations, user, onDone }) {
  const queryClient = useQueryClient();
  const [noteInput, setNoteInput] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'approve' | 'needs_attention'

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
    queryClient.invalidateQueries({ queryKey: ['all-regs-admin'] });
    queryClient.invalidateQueries({ queryKey: ['all-cats-admin'] });
    if (onDone) onDone();
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
          admin_note: null,
        }),
        base44.entities.EventRegistration.update(reg.id, {
          status: 'confirmed',
          payment_status: 'paid',
          bib_number: reg.bib_number || bibNumber,
        }),
      ]);
    },
    onSuccess: invalidate,
  });

  const needsAttentionMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      await base44.entities.EventPayment.update(payment.id, {
        status: 'needs_attention',
        reviewed_by: user.email,
        reviewed_at: now,
        admin_note: noteInput.trim() || null,
      });
      // Keep registration at pending so user is prompted to re-upload
    },
    onSuccess: () => {
      setShowNoteInput(false);
      setNoteInput('');
      setPendingAction(null);
      invalidate();
    },
  });

  const cfg = STATUS_CFG[payment.status] || STATUS_CFG.pending;
  const isPending = payment.status === 'pending';
  const isApproved = payment.status === 'approved';
  const isNeedsAttention = payment.status === 'needs_attention';

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Slip image */}
      {payment.slip_image && (
        <div style={{ position: 'relative', height: 180 }}>
          <img src={payment.slip_image} alt="Payment slip" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <a
            href={payment.slip_image}
            target="_blank"
            rel="noreferrer"
            style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
          >
            <ExternalLink style={{ width: 11, height: 11 }} /> Full size
          </a>
          {/* Status tint overlay */}
          {isApproved && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,210,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: 44, height: 44, color: 'rgb(0,210,110)' }} />
            </div>
          )}
          {isNeedsAttention && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,120,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: 44, height: 44, color: 'rgba(255,150,50,1)' }} />
            </div>
          )}
        </div>
      )}

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Name + amount */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{reg.first_name} {reg.last_name}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>{reg.user_email}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#BFFF00', margin: 0 }}>฿{payment.amount?.toLocaleString()}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 3 }}>
              {payment.payment_method === 'qr_scan'
                ? <QrCode style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.3)' }} />
                : <Building2 style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.3)' }} />
              }
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                {METHOD_LABELS[payment.payment_method] || payment.payment_method || 'Bank Transfer'}
              </span>
            </div>
          </div>
        </div>

        {/* Status badge + submitted time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
            {cfg.label}
          </span>
          {payment.submitted_at && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              <Clock style={{ width: 10, height: 10 }} />
              {format(new Date(payment.submitted_at), 'MMM d · h:mm a')}
            </span>
          )}
        </div>

        {/* Admin note (needs_attention) */}
        {isNeedsAttention && payment.admin_note && (
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,120,0,0.07)', border: '1px solid rgba(255,120,0,0.2)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,150,50,0.9)', margin: '0 0 3px' }}>Admin note to participant:</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{payment.admin_note}</p>
          </div>
        )}

        {/* ── Actions ── */}
        {!isApproved && !showNoteInput && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || needsAttentionMutation.isPending}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(0,210,110,0.12)', border: '1px solid rgba(0,210,110,0.3)', color: 'rgb(0,210,110)',
              }}
            >
              {approveMutation.isPending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
              Approve
            </button>
            <button
              onClick={() => setShowNoteInput(true)}
              disabled={approveMutation.isPending || needsAttentionMutation.isPending}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'rgba(255,120,0,0.1)', border: '1px solid rgba(255,120,0,0.25)', color: 'rgba(255,150,50,1)',
              }}
            >
              <AlertTriangle style={{ width: 14, height: 14 }} />
              Needs Attention
            </button>
          </div>
        )}

        {/* Re-approve after needs_attention */}
        {isNeedsAttention && !showNoteInput && (
          <button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(0,210,110,0.12)', border: '1px solid rgba(0,210,110,0.3)', color: 'rgb(0,210,110)',
            }}
          >
            {approveMutation.isPending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
            Approve Payment
          </button>
        )}

        {/* Needs Attention — note input */}
        {showNoteInput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              placeholder="Tell the participant what to fix (e.g. 'Amount unclear, please re-upload a clearer slip')…"
              rows={3}
              autoFocus
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,120,0,0.3)', color: '#fff', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => needsAttentionMutation.mutate()}
                disabled={needsAttentionMutation.isPending}
                style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,120,0,0.12)', border: '1px solid rgba(255,120,0,0.3)', color: 'rgba(255,150,50,1)',
                }}
              >
                {needsAttentionMutation.isPending && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
                Request Re-upload
              </button>
              <button
                onClick={() => { setShowNoteInput(false); setNoteInput(''); }}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
import React from 'react';
import PaymentReviewPanel from '@/components/stride/PaymentReviewPanel';

const ACCENT = '#00e676';

export default function EventPaymentsPanel({ event, registrations, payments, categories, onDone }) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const user = { role: 'admin' };

  const eventRegs = registrations.filter(r => r.event_id === event.id);
  const regIds = new Set(eventRegs.map(r => r.id));
  const eventPayments = payments.filter(p => regIds.has(p.registration_id));

  const sorted = [...eventPayments].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  const pending = sorted.filter(p => p.status === 'pending').length;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 11, color: 'rgba(0,230,118,0.5)', fontWeight: 600, margin: 0 }}>
        {pending > 0 ? `${pending} pending review · ` : ''}{eventPayments.length} total payments
      </p>

      {eventPayments.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 32, margin: '0 0 10px' }}>💳</p>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No payments yet</p>
        </div>
      )}

      {sorted.map(payment => {
        const reg = eventRegs.find(r => r.id === payment.registration_id);
        if (!reg) return null;
        return (
          <PaymentReviewPanel
            key={payment.id}
            payment={payment}
            reg={reg}
            catMap={catMap}
            registrations={registrations}
            user={user}
            onDone={onDone}
          />
        );
      })}
    </div>
  );
}
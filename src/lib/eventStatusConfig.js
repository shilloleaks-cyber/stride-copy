/**
 * Canonical status labels, badge colors, and payment wording
 * used across the entire event system.
 *
 * Import from this file to keep all screens consistent.
 */

// ── Registration statuses ────────────────────────────────────────────────────
export const REG_STATUS = {
  pending:   { label: 'Pending',   color: 'rgba(255,200,80,1)',   bg: 'rgba(255,200,80,0.1)',  border: 'rgba(255,200,80,0.25)' },
  confirmed: { label: 'Confirmed', color: 'rgb(0,210,110)',       bg: 'rgba(0,210,110,0.1)',   border: 'rgba(0,210,110,0.25)' },
  rejected:  { label: 'Rejected',  color: 'rgba(255,80,80,0.9)',  bg: 'rgba(255,80,80,0.09)',  border: 'rgba(255,80,80,0.2)' },
  cancelled: { label: 'Cancelled', color: 'rgba(255,80,80,0.9)',  bg: 'rgba(255,80,80,0.09)',  border: 'rgba(255,80,80,0.2)' },
};

// ── Payment statuses ─────────────────────────────────────────────────────────
export const PAY_STATUS = {
  not_required:    { label: 'No Payment Required',    color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  pending:         { label: 'Awaiting Payment',       color: 'rgba(255,200,80,1)',     bg: 'rgba(255,200,80,0.08)', border: 'rgba(255,200,80,0.2)'  },
  pending_review:  { label: 'Pending Review',         color: 'rgba(255,150,40,1)',     bg: 'rgba(255,140,0,0.08)',  border: 'rgba(255,140,0,0.22)'  },
  paid:            { label: 'Payment Approved',       color: 'rgb(0,210,110)',         bg: 'rgba(0,210,110,0.1)',   border: 'rgba(0,210,110,0.25)'  },
  needs_attention: { label: 'Payment Needs Attention',color: 'rgba(255,150,40,1)',     bg: 'rgba(255,120,0,0.08)', border: 'rgba(255,120,0,0.22)'  },
  refunded:        { label: 'Refunded',               color: 'rgba(138,43,226,0.9)',   bg: 'rgba(138,43,226,0.08)',border: 'rgba(138,43,226,0.2)'  },
};

// ── Event (StrideEvent) statuses ─────────────────────────────────────────────
export const EVENT_STATUS = {
  draft:     { label: 'Draft',      color: 'rgba(255,180,0,0.9)',   bg: 'rgba(255,180,0,0.1)'  },
  open:      { label: 'Published',  color: 'rgb(0,230,118)',        bg: 'rgba(0,230,118,0.1)'  },
  closed:    { label: 'Closed',     color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)'},
  completed: { label: 'Completed',  color: 'rgba(180,120,255,1)',   bg: 'rgba(138,43,226,0.1)' },
  cancelled: { label: 'Cancelled',  color: 'rgba(255,80,80,0.8)',   bg: 'rgba(255,80,80,0.08)' },
};

// ── Check-in ─────────────────────────────────────────────────────────────────
export const CHECKIN_CFG = {
  checked_in: { label: '✓ Checked In', color: '#BFFF00', bg: 'rgba(191,255,0,0.12)', border: 'rgba(191,255,0,0.3)' },
  not_checked: { label: 'Not Checked In', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
};

/**
 * Resolves the correct payment label config for RegistrationDetailSheet,
 * which reads from EventPayment.status (needs_attention) and reg.payment_status.
 */
export function resolvePaymentCfg(payment_status, paymentNeedsAttention) {
  if (paymentNeedsAttention) return PAY_STATUS.needs_attention;
  return PAY_STATUS[payment_status] || PAY_STATUS.pending;
}
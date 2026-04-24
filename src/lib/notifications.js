/**
 * BoomX Notification Utility
 * 
 * Central helper to create in-app notifications.
 * Architecture is ready for future push support via the `metadata` field.
 * 
 * Usage (from backend functions or admin actions):
 *   import { createNotification } from '@/lib/notifications';
 *   await createNotification({ type: 'registration_success', ... });
 */

import { base44 } from '@/api/base44Client';

/**
 * Create a single in-app notification.
 * @param {Object} opts
 * @param {string} opts.user_email
 * @param {string} opts.type  - one of the Notification.type enum values
 * @param {string} opts.title
 * @param {string} [opts.body]
 * @param {string} [opts.event_id]
 * @param {string} [opts.event_title]
 * @param {string} [opts.registration_id]
 * @param {string} [opts.action_url]
 * @param {Object} [opts.metadata]   - reserved for future push support
 */
export async function createNotification(opts) {
  return base44.entities.Notification.create({
    user_email: opts.user_email,
    type: opts.type,
    title: opts.title,
    body: opts.body || '',
    event_id: opts.event_id || null,
    event_title: opts.event_title || null,
    registration_id: opts.registration_id || null,
    is_read: false,
    action_url: opts.action_url || null,
    metadata: opts.metadata || {},
  });
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export function notifyRegistrationSuccess({ user_email, event_title, event_id, registration_id, action_url }) {
  return createNotification({
    user_email,
    type: 'registration_success',
    title: 'Registration Confirmed! 🎉',
    body: `You're registered for ${event_title}. Check your ticket for details.`,
    event_id,
    event_title,
    registration_id,
    action_url: action_url || '/StrideMyEvents',
  });
}

export function notifyPaymentApproved({ user_email, event_title, event_id, registration_id }) {
  return createNotification({
    user_email,
    type: 'payment_approved',
    title: 'Payment Approved ✅',
    body: `Your payment for ${event_title} has been approved. You're all set!`,
    event_id,
    event_title,
    registration_id,
    action_url: '/StrideMyEvents',
  });
}

export function notifyPaymentNeedsAttention({ user_email, event_title, event_id, registration_id, note }) {
  return createNotification({
    user_email,
    type: 'payment_needs_attention',
    title: 'Payment Needs Attention ⚠️',
    body: note || `Your payment slip for ${event_title} needs to be reviewed. Please resubmit.`,
    event_id,
    event_title,
    registration_id,
    action_url: '/StrideMyEvents',
  });
}

export function notifyStaffInvitation({ user_email, event_title, event_id, role }) {
  return createNotification({
    user_email,
    type: 'staff_invitation',
    title: 'Staff Invitation 🔑',
    body: `You've been added as ${role || 'staff'} for ${event_title}.`,
    event_id,
    event_title,
    action_url: `/StrideEventDetail?id=${event_id}`,
  });
}

export function notifyEventReminder({ user_email, event_title, event_id, days_until }) {
  const when = days_until === 0 ? 'today' : days_until === 1 ? 'tomorrow' : `in ${days_until} days`;
  return createNotification({
    user_email,
    type: 'event_reminder',
    title: `Event Reminder 📅`,
    body: `${event_title} is ${when}. Get ready!`,
    event_id,
    event_title,
    action_url: `/StrideEventDetail?id=${event_id}`,
  });
}
/**
 * staffEventAction — frontend helper to call the staffEventAction backend function.
 *
 * All staff mutations (checkin, payment approval, registration status) go through
 * this backend function which verifies the EventStaffAssignment before acting.
 *
 * Usage:
 *   import { staffAction } from '@/lib/staffEventAction';
 *   await staffAction('checkin', { event_id, registration_id });
 *   await staffAction('approve_payment', { event_id, payment_id, admin_note });
 *   await staffAction('needs_attention', { event_id, payment_id, admin_note });
 *   await staffAction('approve_registration', { event_id, registration_id });
 *   await staffAction('reject_registration', { event_id, registration_id });
 *   await staffAction('log_activity', { event_id, action_type, summary, target_type, target_id, meta });
 */

import { base44 } from '@/api/base44Client';

export async function staffAction(action, params = {}) {
  const response = await base44.functions.invoke('staffEventAction', {
    action,
    ...params,
  });
  return response.data;
}
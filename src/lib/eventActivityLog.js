/**
 * eventActivityLog — lightweight helper to write EventActivityLog entries.
 * Fire-and-forget: call without awaiting to avoid blocking user actions.
 *
 * Usage:
 *   import { logActivity } from '@/lib/eventActivityLog';
 *   logActivity({ eventId, actorEmail, actionType, targetType, targetId, summary, meta });
 */

import { base44 } from '@/api/base44Client';

export function logActivity({ eventId, actorEmail, actionType, targetType, targetId, summary, meta }) {
  if (!eventId || !actorEmail || !actionType) return;

  base44.entities.EventActivityLog.create({
    event_id:    eventId,
    actor_email: actorEmail,
    action_type: actionType,
    target_type: targetType || null,
    target_id:   targetId   || null,
    summary:     summary    || actionType,
    meta:        meta       || null,
  }).catch(() => {
    // Silently swallow — logging should never break the main flow
  });
}
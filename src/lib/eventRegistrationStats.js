/**
 * eventRegistrationStats — shared helper
 *
 * Single source of truth for how registration counts are calculated.
 * Used by EventWorkspace, EventOverviewPanel, and live-count hooks.
 */

/**
 * Returns stats calculated from an array of EventRegistration records.
 * These records must already be scoped to a single event.
 */
export function calculateRegistrationStats(registrations = []) {
  return {
    total:     registrations.length,
    pending:   registrations.filter(r => r.status === 'pending').length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    checkedIn: registrations.filter(r => r.checked_in === true).length,
  };
}

/**
 * Returns the canonical event_id from a registration record.
 * Supports legacy field names for backward compatibility.
 */
export function getRegistrationEventId(registration) {
  return registration.event_id || registration.stride_event_id || registration.eventId || null;
}

/**
 * Returns true if the registration belongs to the given eventId.
 * Checks canonical event_id first, then legacy fields.
 */
export function matchesEvent(registration, eventId) {
  if (!eventId) return false;
  const id = getRegistrationEventId(registration);
  return id === eventId;
}
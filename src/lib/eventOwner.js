/**
 * Normalize an email for comparison.
 */
export const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

/**
 * Determine if the given user is the owner/creator of a StrideEvent.
 * Priority order:
 *   1. event.creator_email
 *   2. event.created_by
 *   3. event.created_by_email
 *   4. event.organizer_email
 *   5. event.owner_email
 */
export function isEventOwner(event, user) {
  if (!event || !user?.email) return false;
  const userEmail = normalizeEmail(user.email);
  return (
    normalizeEmail(event.creator_email) === userEmail ||
    normalizeEmail(event.created_by) === userEmail ||
    normalizeEmail(event.created_by_email) === userEmail ||
    normalizeEmail(event.organizer_email) === userEmail ||
    normalizeEmail(event.owner_email) === userEmail
  );
}
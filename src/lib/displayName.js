/**
 * Global display name resolver for BoomX.
 *
 * Source of truth: PublicUserProfile.display_name (fetched via profileMap)
 * Fallback chain: profileMap → display_name → author_display_name → author_name → full_name → email prefix → "Runner"
 */

/** Normalize email to lowercase trimmed string for consistent map lookups */
export function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

/**
 * Resolve a user's display name from their profile object.
 * Priority: display_name → full_name → name → email prefix → "Runner"
 */
export function getDisplayName(user) {
  if (!user) return 'Runner';
  return (
    user.display_name ||
    user.full_name ||
    user.name ||
    (user.email ? user.email.split('@')[0] : null) ||
    'Runner'
  );
}

/**
 * Get the best identity key from a record for profileMap lookup.
 * Tries author_email, user_email, created_by (platform field), email in that order.
 */
export function getRecordIdentityKey(record) {
  if (!record) return '';
  return normalizeEmail(
    record.author_email ||
    record.user_email ||
    record.created_by ||
    record.email ||
    ''
  );
}

/**
 * Resolve display name for a post/comment author using a live profileMap.
 * profileMap keys are normalized (lowercase) emails.
 *
 * Priority:
 * 1. profileMap[getRecordIdentityKey(record)].display_name  (live global profile)
 * 2. record.author_display_name             (legacy snapshot)
 * 3. record.author_name                     (legacy snapshot)
 * 4. email prefix
 * 5. "Runner"
 */
export function resolveDisplayName(record, profileMap = {}) {
  if (!record) return 'Runner';
  const key = getRecordIdentityKey(record);
  const profile = key ? profileMap[key] : null;
  const rawEmail = record.author_email || record.user_email || record.created_by || record.email;

  return (
    profile?.display_name ||
    record.display_name ||
    record.author_display_name ||
    record.author_name ||
    record.full_name ||
    (rawEmail ? rawEmail.split('@')[0] : null) ||
    'Runner'
  );
}

/**
 * Resolve a user's avatar from profileMap or record fallback.
 * profileMap keys are normalized (lowercase) emails.
 */
export function resolveAvatar(record, profileMap = {}) {
  if (!record) return null;
  const key = getRecordIdentityKey(record);
  const profile = key ? profileMap[key] : null;
  return profile?.avatar_url || record.author_avatar_url || record.author_image || record.avatar_url || null;
}

/**
 * Build a profileMap from an array of PublicUserProfile records.
 * Keys are normalized (lowercase) emails for consistent lookups.
 */
export function buildProfileMap(profiles = []) {
  const map = {};
  for (const p of profiles) {
    if (p.user_email) map[normalizeEmail(p.user_email)] = p;
  }
  return map;
}

/**
 * Legacy helper kept for backward compat — use resolveDisplayName with profileMap instead.
 */
export function getPostAuthorName(post, currentUser) {
  if (!post) return 'Runner';
  if (currentUser?.email && normalizeEmail(post.author_email) === normalizeEmail(currentUser.email)) {
    return getDisplayName(currentUser);
  }
  return post.author_name || (post.author_email ? post.author_email.split('@')[0] : 'Runner');
}
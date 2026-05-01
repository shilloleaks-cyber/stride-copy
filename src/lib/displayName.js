/**
 * Global display name resolver for BoomX.
 *
 * Source of truth: PublicUserProfile.display_name (fetched via profileMap)
 * Fallback chain: profileMap → display_name → author_display_name → author_name → full_name → email prefix → "Runner"
 */

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
 * Resolve display name for a post/comment author using a live profileMap.
 * profileMap: { [email]: PublicUserProfile }
 *
 * Priority:
 * 1. profileMap[author_email].display_name  (live global profile)
 * 2. record.author_display_name             (legacy snapshot)
 * 3. record.author_name                     (legacy snapshot)
 * 4. email prefix
 * 5. "Runner"
 */
export function resolveDisplayName(record, profileMap = {}) {
  if (!record) return 'Runner';
  const email = record.author_email || record.user_email || record.email;
  const profile = email ? profileMap[email] : null;

  return (
    profile?.display_name ||
    record.display_name ||
    record.author_display_name ||
    record.author_name ||
    record.full_name ||
    (email ? email.split('@')[0] : null) ||
    'Runner'
  );
}

/**
 * Resolve a user's avatar from profileMap or record fallback.
 */
export function resolveAvatar(record, profileMap = {}) {
  if (!record) return null;
  const email = record.author_email || record.user_email || record.email;
  const profile = email ? profileMap[email] : null;
  return profile?.avatar_url || record.author_image || record.avatar_url || null;
}

/**
 * Build a profileMap from an array of PublicUserProfile records.
 * Returns: { [email]: profile }
 */
export function buildProfileMap(profiles = []) {
  const map = {};
  for (const p of profiles) {
    if (p.user_email) map[p.user_email] = p;
  }
  return map;
}

/**
 * Legacy helper kept for backward compat — use resolveDisplayName with profileMap instead.
 */
export function getPostAuthorName(post, currentUser) {
  if (!post) return 'Runner';
  if (currentUser?.email && post.author_email === currentUser.email) {
    return getDisplayName(currentUser);
  }
  return post.author_name || (post.author_email ? post.author_email.split('@')[0] : 'Runner');
}
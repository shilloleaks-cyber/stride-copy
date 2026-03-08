/**
 * Group Helper Utilities
 * Shared helper functions for consistent group data access across the app.
 */

/**
 * Returns the best available avatar image URL for a group.
 */
export function getGroupAvatar(group) {
  return group?.avatar_image || group?.image_url || group?.cover_image || '';
}

/**
 * Returns normalized privacy value: "private" or "public".
 */
export function getGroupPrivacy(group) {
  if (group?.privacy) return group.privacy;
  return group?.is_private ? 'private' : 'public';
}

/**
 * Returns the group's category label, or "Other" as fallback.
 */
export function getGroupCategoryLabel(group) {
  return group?.category || 'Other';
}

/**
 * Returns the group's member count as a number, or 0 if missing.
 */
export function getGroupMemberCount(group) {
  return group?.member_count ?? 0;
}
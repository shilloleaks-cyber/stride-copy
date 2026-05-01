/**
 * Global display name resolver for BoomX.
 * Priority: display_name → full_name → name → email prefix → "Runner"
 */
export function getDisplayName(user) {
  return (
    user?.display_name ||
    user?.full_name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'Runner'
  );
}

/**
 * Resolve the author name to display for a post.
 * If the post belongs to the current user, always use their latest display name.
 * Otherwise fall back to the stored author_name snapshot.
 */
export function getPostAuthorName(post, currentUser) {
  if (!post) return 'Runner';
  // If it's our own post, always show our current display name
  if (currentUser?.email && post.author_email === currentUser.email) {
    return getDisplayName(currentUser);
  }
  // For other users, use the stored snapshot (best we can do without a full user lookup)
  return post.author_name || (post.author_email ? post.author_email.split('@')[0] : 'Runner');
}
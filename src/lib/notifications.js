/**
 * BoomX Notification Utility
 *
 * extractMentions(text) — returns a deduped array of @mentioned display
 * tokens found in a string.  The caller is responsible for resolving the
 * display name to an email address before calling notifyMentioned().
 */

/**
 * Parse @mentions from text.
 * Returns unique lowercase mention strings (without the @ sign) found in text.
 * Pattern: @word (letters, digits, underscores, dots, hyphens, Thai chars).
 */
export function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@([\w.\-\u0E00-\u0E7F]+)/g) || [];
  const unique = [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  return unique;
}

/**
 *
 * Central helper to create in-app notifications.
 * Supports both event notifications and feed notifications (general + group).
 *
 * NOTE: Feed notifications (post_liked, post_commented, etc.) should only be
 * created for actions directly relevant to the recipient (their own post, their
 * own comment, @mentions). Never broadcast to unrelated users.
 */

import { base44 } from '@/api/base44Client';

/**
 * Create a single in-app notification.
 */
export async function createNotification(opts) {
  return base44.entities.Notification.create({
    user_email: opts.user_email,
    type: opts.type,
    category: opts.category || null,
    source_type: opts.source_type || null,
    title: opts.title,
    body: opts.body || '',
    event_id: opts.event_id || null,
    event_title: opts.event_title || null,
    registration_id: opts.registration_id || null,
    post_id: opts.post_id || null,
    actor_name: opts.actor_name || null,
    group_id: opts.group_id || null,
    group_name: opts.group_name || null,
    is_read: false,
    action_url: opts.action_url || null,
    metadata: opts.metadata || {},
  });
}

// ── Event notification helpers ─────────────────────────────────────────────────

export function notifyRegistrationSuccess({ user_email, event_title, event_id, registration_id, action_url }) {
  return createNotification({
    user_email, type: 'registration_success', category: 'events',
    title: 'Registration Confirmed! 🎉',
    body: `You're registered for ${event_title}. Check your ticket for details.`,
    event_id, event_title, registration_id,
    action_url: action_url || '/StrideMyEvents',
  });
}

export function notifyPaymentApproved({ user_email, event_title, event_id, registration_id }) {
  return createNotification({
    user_email, type: 'payment_approved', category: 'events',
    title: 'Payment Approved ✅',
    body: `Your payment for ${event_title} has been approved. You're all set!`,
    event_id, event_title, registration_id,
    action_url: '/StrideMyEvents',
  });
}

export function notifyPaymentNeedsAttention({ user_email, event_title, event_id, registration_id, note }) {
  return createNotification({
    user_email, type: 'payment_needs_attention', category: 'events',
    title: 'Payment Needs Attention ⚠️',
    body: note || `Your payment slip for ${event_title} needs to be reviewed. Please resubmit.`,
    event_id, event_title, registration_id,
    action_url: '/StrideMyEvents',
  });
}

export function notifyStaffInvitation({ user_email, event_title, event_id, role }) {
  return createNotification({
    user_email, type: 'staff_invitation', category: 'events',
    title: 'Staff Invitation 🔑',
    body: `You've been added as ${role || 'staff'} for ${event_title}.`,
    event_id, event_title,
    action_url: `/StrideEventDetail?id=${event_id}`,
  });
}

export function notifyEventReminder({ user_email, event_title, event_id, days_until }) {
  const when = days_until === 0 ? 'today' : days_until === 1 ? 'tomorrow' : `in ${days_until} days`;
  return createNotification({
    user_email, type: 'event_reminder', category: 'events',
    title: 'Event Reminder 📅',
    body: `${event_title} is ${when}. Get ready!`,
    event_id, event_title,
    action_url: `/StrideEventDetail?id=${event_id}`,
  });
}

// ── Feed notification helpers ──────────────────────────────────────────────────
// Only call these for actions directly relevant to the recipient.

/**
 * Notify post owner when someone likes their post.
 * Do NOT call if the liker is the post author themselves.
 */
export function notifyPostLiked({ user_email, actor_name, post_id }) {
  return createNotification({
    user_email, type: 'post_liked', category: 'feed', source_type: 'general_feed',
    title: `${actor_name} liked your post ❤️`,
    body: 'Tap to view your post.',
    actor_name, post_id,
    action_url: post_id ? `/Feed?post=${post_id}` : '/Feed',
  });
}

/**
 * Notify post owner when someone comments on their post.
 * Do NOT call if the commenter is the post author themselves.
 */
export function notifyPostCommented({ user_email, actor_name, post_id, comment_preview }) {
  return createNotification({
    user_email, type: 'post_commented', category: 'feed', source_type: 'general_feed',
    title: `${actor_name} commented on your post 💬`,
    body: comment_preview || 'Tap to view the comment.',
    actor_name, post_id,
    action_url: post_id ? `/Feed?post=${post_id}` : '/Feed',
  });
}

/**
 * Notify a commenter when someone replies to their comment.
 */
export function notifyCommentReplied({ user_email, actor_name, post_id, reply_preview }) {
  return createNotification({
    user_email, type: 'comment_replied', category: 'feed', source_type: 'general_feed',
    title: `${actor_name} replied to your comment ↩️`,
    body: reply_preview || 'Tap to view the reply.',
    actor_name, post_id,
    action_url: post_id ? `/Feed?post=${post_id}` : '/Feed',
  });
}

/**
 * Notify a user when they are @mentioned in a post or comment.
 * For group mentions, pass group_id so action_url opens the correct group.
 */
export function notifyMentioned({ user_email, actor_name, post_id, context, group_id }) {
  return createNotification({
    user_email, type: 'mentioned', category: 'feed',
    source_type: group_id ? 'group_feed' : 'general_feed',
    title: `${actor_name} mentioned you`,
    body: context || 'Tap to see where you were mentioned.',
    actor_name, post_id,
    group_id: group_id || null,
    action_url: group_id ? `/GroupDetail?id=${group_id}` : (post_id ? `/Feed?post=${post_id}` : '/Feed'),
  });
}

/**
 * Notify group members when a new post is created in their group.
 * Only send to members who have opted in or follow the group.
 * group_member_emails: array of emails to notify (excluding the author).
 */
export function notifyGroupPostCreated({ group_member_emails, actor_name, group_id, group_name, post_id }) {
  return Promise.all(
    group_member_emails.map(user_email =>
      createNotification({
        user_email, type: 'group_post_created', category: 'feed', source_type: 'group_feed',
        title: `${actor_name} posted in ${group_name} 📣`,
        body: 'New post in your group. Tap to view.',
        actor_name, group_id, group_name, post_id,
        action_url: `/GroupDetail?id=${group_id}`,
      })
    )
  );
}

/**
 * Notify group members of an announcement from admins/moderators.
 * Only send to active members (excluding the author).
 */
export function notifyGroupAnnouncement({ group_member_emails, actor_name, group_id, group_name, message }) {
  return Promise.all(
    group_member_emails.map(user_email =>
      createNotification({
        user_email, type: 'group_announcement', category: 'feed', source_type: 'group_feed',
        title: `📢 Announcement in ${group_name}`,
        body: message || 'Your group has a new announcement.',
        actor_name, group_id, group_name,
        action_url: `/GroupDetail?id=${group_id}`,
      })
    )
  );
}
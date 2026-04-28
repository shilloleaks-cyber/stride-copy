/**
 * eventMetrics.js — helpers to increment StrideEvent tracking fields.
 *
 * Dedup strategy for unique_views_7d:
 *   localStorage key  "ev_view_{eventId}"  stores the Unix-day of last view.
 *   If it's the same calendar day we skip the increment — giving "once per
 *   user per day" dedup client-side with no extra server round-trip.
 *
 *   Approximation note: unique_views_7d is a running accumulator of daily-unique
 *   increments, NOT a true 7-day rolling window (which would require a server job
 *   to expire old views). For trending ranking this is a good-enough proxy.
 *
 * All updates are fire-and-forget (silently swallowed on network error) so they
 * never block the user's navigation.
 */

import { base44 } from '@/api/base44Client';

function todayDay() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

async function safeIncrement(eventId, field) {
  try {
    const rows = await base44.entities.StrideEvent.filter({ id: eventId });
    const ev = rows[0];
    if (!ev) return;
    await base44.entities.StrideEvent.update(eventId, {
      [field]: (Number(ev[field]) || 0) + 1,
    });
  } catch (_) {
    // fire-and-forget: never block the UI
  }
}

/**
 * Track detail_clicks (every page open) + unique_views_7d (once per day per event).
 * @param {string} eventId
 */
export function trackEventView(eventId) {
  if (!eventId) return;

  // detail_clicks — always increment
  safeIncrement(eventId, 'detail_clicks');

  // unique_views_7d — once per calendar day
  const storageKey = `ev_view_${eventId}`;
  const today = todayDay();
  const lastDay = parseInt(localStorage.getItem(storageKey) || '0', 10);
  if (lastDay !== today) {
    localStorage.setItem(storageKey, String(today));
    safeIncrement(eventId, 'unique_views_7d');
  }
}

/**
 * Track join_clicks — deduplicated per event per browser session.
 * @param {string} eventId
 */
export function trackJoinClick(eventId) {
  if (!eventId) return;
  const key = `ev_join_${eventId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  safeIncrement(eventId, 'join_clicks');
}

/**
 * Track shares_count.
 * EventShareButton already deduplicates per share session so no extra dedup needed.
 * @param {string} eventId
 */
export function trackShare(eventId) {
  if (!eventId) return;
  safeIncrement(eventId, 'shares_count');
}

/**
 * Track saves_count. Pass delta=-1 to un-save.
 * @param {string} eventId
 * @param {number} delta  +1 (save) or -1 (unsave)
 */
export async function trackSave(eventId, delta = 1) {
  if (!eventId) return;
  try {
    const rows = await base44.entities.StrideEvent.filter({ id: eventId });
    const ev = rows[0];
    if (!ev) return;
    await base44.entities.StrideEvent.update(eventId, {
      saves_count: Math.max(0, (Number(ev.saves_count) || 0) + delta),
    });
  } catch (_) {}
}
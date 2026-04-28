/**
 * BoomX Trending Events Score
 * ============================================================
 * Formula (max theoretical ≈ 108):
 *
 *   TrendingScore =
 *     (registrationScore × 0.45)
 *   + (viewScore        × 0.20)
 *   + (engagementScore  × 0.10)
 *   + (urgencyScore     × 0.15)
 *   + (freshnessScore   × 0.10)
 *   + conversionBoost
 *
 * All component scores are normalised 0–100 within the current pool,
 * except urgencyScore and freshnessScore which are absolute stepped values.
 * conversionBoost is +8 / +4 / +0.
 *
 * Required entity fields (StrideEvent):
 *   total_registered  — cached registration count
 *   unique_views_7d   — unique detail-page views last 7 days
 *   detail_clicks     — lifetime detail-page clicks
 *   saves_count       — number of saves/bookmarks
 *   shares_count      — number of shares
 *   join_clicks       — Register/Join button clicks
 *   event_date        — ISO date string
 *   created_date      — auto-populated by platform
 *
 * Fallback when view/engagement data is missing (null / undefined / 0):
 *   The field is treated as 0, which means it contributes 0 to that
 *   component after normalisation. The event is still ranked — it just
 *   relies on registrations, urgency, and freshness only.
 */

// ─── Stepped helpers ──────────────────────────────────────────────────────────

function urgencyScore(daysToEvent) {
  if (daysToEvent < 0)   return 0;   // event has passed
  if (daysToEvent <= 2)  return 100;
  if (daysToEvent <= 6)  return 90;
  if (daysToEvent <= 13) return 75;
  if (daysToEvent <= 30) return 50;
  return 20;                          // > 30 days
}

function freshnessScore(ageDays) {
  if (ageDays <= 3)  return 100;
  if (ageDays <= 7)  return 70;
  if (ageDays <= 14) return 40;
  return 10;
}

// ─── Per-event raw signals ────────────────────────────────────────────────────

function rawSignals(event, now) {
  const registered   = Number(event.total_registered)  || 0;
  const views7d      = Number(event.unique_views_7d)    || 0;
  const clicks       = Number(event.detail_clicks)      || 0;
  const saves        = Number(event.saves_count)        || 0;
  const shares       = Number(event.shares_count)       || 0;
  const joinClicks   = Number(event.join_clicks)        || 0;
  const engagement   = clicks + saves * 2 + shares * 3 + joinClicks; // weighted engagement points
  const daysToEvent  = (new Date(event.event_date) - now) / (1000 * 60 * 60 * 24);
  const ageDays      = (now - new Date(event.created_date || now)) / (1000 * 60 * 60 * 24);

  return { registered, views7d, engagement, daysToEvent, ageDays };
}

// ─── Normalise a value against the pool max (0 if max === 0) ─────────────────

function normalise(value, max) {
  return max > 0 ? Math.min(value / max, 1) * 100 : 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute trending scores for an entire pool and return the enriched list.
 * Normalisation is pool-relative (the event with the most registrations = 100, etc).
 *
 * @param {Array}  events  - raw StrideEvent records from the DB
 * @param {Date}   now     - current date (injectable for testing)
 * @returns {Array}        - same events with `_trendingScore` attached, sorted desc
 */
export function computePoolTrendingScores(events, now = new Date()) {
  if (!events.length) return [];

  // 1. Compute raw signals for every event
  const withSignals = events.map(e => ({ event: e, signals: rawSignals(e, now) }));

  // 2. Find pool maximums for normalisation
  const maxRegistered  = Math.max(...withSignals.map(x => x.signals.registered),  1);
  const maxViews       = Math.max(...withSignals.map(x => x.signals.views7d),     1);
  const maxEngagement  = Math.max(...withSignals.map(x => x.signals.engagement),  1);

  // 3. Score each event
  return withSignals
    .map(({ event, signals }) => {
      const regScore    = normalise(signals.registered,  maxRegistered);
      const viewScore   = normalise(signals.views7d,     maxViews);
      const engScore    = normalise(signals.engagement,  maxEngagement);
      const urgScore    = urgencyScore(signals.daysToEvent);
      const freshScore  = freshnessScore(signals.ageDays);

      // Conversion boost: registrations / unique_views_7d
      const convRate = signals.views7d > 0 ? signals.registered / signals.views7d : 0;
      const convBoost = convRate >= 0.20 ? 8 : convRate >= 0.10 ? 4 : 0;

      const score =
        (regScore   * 0.45) +
        (viewScore  * 0.20) +
        (engScore   * 0.10) +
        (urgScore   * 0.15) +
        (freshScore * 0.10) +
        convBoost;

      return { ...event, _trendingScore: score };
    })
    .sort((a, b) => b._trendingScore - a._trendingScore);
}

/**
 * Filter to eligible events (public/open, not ended) then score + sort.
 * Accepts both 'official' and 'community' event types.
 */
export function getTrendingEvents(events, now = new Date()) {
  const today = new Date(now.toDateString());
  const eligible = events.filter(e =>
    e.status === 'open' &&
    e.event_date &&
    new Date(e.event_date) >= today
  );
  return computePoolTrendingScores(eligible, now);
}

/**
 * Convenience wrapper — community events only (used on Home & StrideEvents pages).
 */
export function getTrendingCommunityEvents(events, now = new Date()) {
  return getTrendingEvents(
    events.filter(e => e.event_type === 'community'),
    now
  );
}
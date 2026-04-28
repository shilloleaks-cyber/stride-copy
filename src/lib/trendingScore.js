/**
 * Compute a trending score for a StrideEvent.
 * Uses only real fields: total_registered, max_participants, event_date, created_date.
 *
 * Max possible score: 100
 *   - Registrations : 0–40
 *   - Fill-rate     : 0–20  (0 if max_participants is absent/0)
 *   - Urgency       : 0–25
 *   - Freshness     : 0–15
 */
export function computeTrendingScore(event, now = new Date()) {
  const registered = event.total_registered || 0;
  const maxCap     = Number(event.max_participants) || 0;
  const daysToEvent = (new Date(event.event_date) - now) / (1000 * 60 * 60 * 24);
  const ageDays     = (now - new Date(event.created_date || 0)) / (1000 * 60 * 60 * 24);

  // 1. Registrations (0–40)
  const registrationScore = Math.min(registered * 2, 40);

  // 2. Fill-rate engagement (0–20)
  //    Safe: only divide when maxCap is a valid positive number
  const fillRate = (maxCap > 0 && Number.isFinite(maxCap))
    ? Math.min(registered / maxCap, 1)
    : 0;
  const engagementScore = fillRate * 20;

  // 3. Urgency — peak at 1–3 days out (0–25)
  let urgencyScore = 0;
  if      (daysToEvent <= 1)  urgencyScore = 25;
  else if (daysToEvent <= 3)  urgencyScore = 22;
  else if (daysToEvent <= 7)  urgencyScore = 15;
  else if (daysToEvent <= 14) urgencyScore = 8;
  else if (daysToEvent <= 30) urgencyScore = 3;

  // 4. Freshness — decays to 0 over 7 days (0–15)
  const freshnessScore = Math.max(0, 15 - (ageDays / 7) * 15);

  return registrationScore + engagementScore + urgencyScore + freshnessScore;
}

/**
 * Filter + sort a list of StrideEvents by trending score.
 * Only includes open community events that have not yet passed.
 */
export function getTrendingCommunityEvents(events, now = new Date()) {
  const today = new Date(now.toDateString());
  return events
    .filter(e =>
      e.event_type === 'community' &&
      e.status === 'open' &&
      e.event_date &&
      new Date(e.event_date) >= today
    )
    .map(e => ({ ...e, _trendingScore: computeTrendingScore(e, now) }))
    .sort((a, b) => b._trendingScore - a._trendingScore);
}
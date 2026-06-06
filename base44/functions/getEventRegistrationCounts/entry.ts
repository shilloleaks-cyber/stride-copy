/**
 * getEventRegistrationCounts
 *
 * Returns live registration counts for one or more events.
 * Returns COUNTS ONLY — no emails, names, or private registration data.
 * Safe for public-facing pages.
 *
 * Input:  { event_ids: string[] }
 * Output: { [event_id]: { total, pending, confirmed, checkedIn } }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event_ids } = body;

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return Response.json({ error: 'event_ids array required' }, { status: 400 });
    }

    // Cap to avoid abuse
    const ids = event_ids.slice(0, 50);

    // Fetch all registrations for these events in parallel (service role to bypass RLS)
    // We fetch per event to keep things clean and avoid huge result sets
    const results = await Promise.all(
      ids.map(async (event_id) => {
        const regs = await base44.asServiceRole.entities.EventRegistration.filter(
          { event_id },
          '-created_date',
          1000
        );
        return { event_id, regs };
      })
    );

    const counts = {};
    for (const { event_id, regs } of results) {
      counts[event_id] = {
        total:     regs.length,
        pending:   regs.filter(r => r.status === 'pending').length,
        confirmed: regs.filter(r => r.status === 'confirmed').length,
        checkedIn: regs.filter(r => r.checked_in === true).length,
      };
    }

    return Response.json({ counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
/**
 * backfillRegistrationEventIds — Admin-only
 *
 * Fixes old EventRegistration records that are missing a canonical event_id.
 * Supports legacy fields: stride_event_id, eventId
 * Also matches by event_title if uniquely identifiable.
 *
 * Returns a report of what was fixed, skipped, or left unmatched.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Fetch all registrations and events using service role
    const [allRegistrations, allEvents] = await Promise.all([
      base44.asServiceRole.entities.EventRegistration.list('-created_date', 2000),
      base44.asServiceRole.entities.StrideEvent.list('-created_date', 500),
    ]);

    // Build a set of valid event IDs for quick lookup
    const validEventIds = new Set(allEvents.map(e => e.id));

    // Build title → event map (only use if title is unique)
    const titleMap = {};
    for (const ev of allEvents) {
      const key = (ev.title || '').toLowerCase().trim();
      if (key) {
        if (titleMap[key]) {
          titleMap[key] = 'AMBIGUOUS'; // multiple events share this title
        } else {
          titleMap[key] = ev;
        }
      }
    }

    const report = {
      totalRegistrations: allRegistrations.length,
      alreadyValid: 0,
      fixedFromStrideEventId: 0,
      fixedFromEventId: 0,
      fixedFromTitle: 0,
      skippedAmbiguous: 0,
      skippedUnmatched: 0,
      errors: [],
    };

    for (const reg of allRegistrations) {
      // Case 1: event_id exists and is valid — nothing to do
      if (reg.event_id && validEventIds.has(reg.event_id)) {
        report.alreadyValid++;
        continue;
      }

      let resolvedEventId = null;
      let fixSource = null;

      // Case 2: try stride_event_id
      if (!resolvedEventId && reg.stride_event_id && validEventIds.has(reg.stride_event_id)) {
        resolvedEventId = reg.stride_event_id;
        fixSource = 'stride_event_id';
      }

      // Case 3: try eventId (camelCase legacy)
      if (!resolvedEventId && reg.eventId && validEventIds.has(reg.eventId)) {
        resolvedEventId = reg.eventId;
        fixSource = 'eventId';
      }

      // Case 4: try matching by event_title (only if unique)
      if (!resolvedEventId && reg.event_title) {
        const key = (reg.event_title || '').toLowerCase().trim();
        const match = titleMap[key];
        if (match === 'AMBIGUOUS') {
          report.skippedAmbiguous++;
          continue;
        } else if (match && match.id) {
          resolvedEventId = match.id;
          fixSource = 'title';
        }
      }

      if (!resolvedEventId) {
        report.skippedUnmatched++;
        continue;
      }

      // Apply the fix
      try {
        await base44.asServiceRole.entities.EventRegistration.update(reg.id, {
          event_id: resolvedEventId,
        });
        if (fixSource === 'stride_event_id') report.fixedFromStrideEventId++;
        else if (fixSource === 'eventId') report.fixedFromEventId++;
        else if (fixSource === 'title') report.fixedFromTitle++;
      } catch (err) {
        report.errors.push({ reg_id: reg.id, error: err.message });
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
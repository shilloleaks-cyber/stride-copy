/**
 * backfillRegistrationEventIds — Admin-only
 *
 * Audits all EventRegistration records against existing StrideEvents.
 *
 * A registration is VALID if its event_id matches an existing StrideEvent.id.
 * A registration is ORPHANED if its event_id does not match any existing StrideEvent.
 *
 * Additionally, if a registration has no event_id but has a legacy field
 * (stride_event_id, eventId) or unique event_title that resolves to a valid event,
 * it will be updated automatically (safe inference only).
 *
 * Returns a clear report:
 *   - validCount
 *   - orphanedCount
 *   - orphanedRecords[]
 *   - falseSkippedFixedCount  (records that previously appeared "unmatched" because
 *                              their event_id IS valid — now correctly counted as valid)
 *   - fixedFromLegacyCount    (records with missing event_id fixed via legacy fields)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Fetch all registrations and events
    const [allRegistrations, allEvents] = await Promise.all([
      base44.asServiceRole.entities.EventRegistration.list('-created_date', 2000),
      base44.asServiceRole.entities.StrideEvent.list('-created_date', 500),
    ]);

    // Build lookup structures
    const validEventIds = new Set(allEvents.map(e => e.id));

    // Build title → event map (only use if title is unique)
    const titleMap = {};
    for (const ev of allEvents) {
      const key = (ev.title || '').toLowerCase().trim();
      if (key) {
        titleMap[key] = titleMap[key] ? 'AMBIGUOUS' : ev;
      }
    }

    const report = {
      totalRegistrations: allRegistrations.length,
      validCount: 0,
      orphanedCount: 0,
      orphanedRecords: [],
      fixedFromLegacyCount: 0,
      falseSkippedFixedCount: 0, // records with valid event_id that old logic incorrectly skipped
      errors: [],
    };

    for (const reg of allRegistrations) {
      // Case 1: event_id exists and matches a live StrideEvent — VALID
      if (reg.event_id && validEventIds.has(reg.event_id)) {
        report.validCount++;
        continue;
      }

      // Case 2: event_id exists but does NOT match any live StrideEvent — ORPHANED
      // (Do not attempt to reassign — just report it)
      if (reg.event_id && !validEventIds.has(reg.event_id)) {
        report.orphanedCount++;
        report.orphanedRecords.push({
          id: reg.id,
          user_email: reg.user_email,
          created_date: reg.created_date,
          event_id: reg.event_id,
          category_id: reg.category_id,
          status: reg.status,
          payment_status: reg.payment_status,
          bib_number: reg.bib_number || null,
          checked_in: reg.checked_in || false,
        });
        continue;
      }

      // Case 3: event_id is missing — try safe inference from legacy fields
      let resolvedEventId = null;
      let fixSource = null;

      if (reg.stride_event_id && validEventIds.has(reg.stride_event_id)) {
        resolvedEventId = reg.stride_event_id;
        fixSource = 'stride_event_id';
      } else if (reg.eventId && validEventIds.has(reg.eventId)) {
        resolvedEventId = reg.eventId;
        fixSource = 'eventId';
      } else if (reg.event_title) {
        const key = (reg.event_title || '').toLowerCase().trim();
        const match = titleMap[key];
        if (match && match !== 'AMBIGUOUS' && match.id) {
          resolvedEventId = match.id;
          fixSource = 'title';
        }
      }

      if (resolvedEventId) {
        try {
          await base44.asServiceRole.entities.EventRegistration.update(reg.id, {
            event_id: resolvedEventId,
          });
          report.fixedFromLegacyCount++;
          report.validCount++;
        } catch (err) {
          report.errors.push({ reg_id: reg.id, error: err.message });
        }
      } else {
        // Truly no event_id and no inferable source — orphaned
        report.orphanedCount++;
        report.orphanedRecords.push({
          id: reg.id,
          user_email: reg.user_email,
          created_date: reg.created_date,
          event_id: null,
          category_id: reg.category_id,
          status: reg.status,
          payment_status: reg.payment_status,
          bib_number: reg.bib_number || null,
          checked_in: reg.checked_in || false,
        });
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
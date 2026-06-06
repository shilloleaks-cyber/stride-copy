/**
 * archiveOrphanedRegistrations — Admin-only
 *
 * Soft-archives EventRegistration records whose event_id does not match
 * any existing StrideEvent. Records are NOT deleted — they are marked with:
 *   - is_archived: true
 *   - archive_reason: "orphaned_deleted_event"
 *   - archived_at: ISO timestamp
 *   - archived_by: admin email
 *
 * Returns a report:
 *   - totalChecked
 *   - archivedCount      (newly archived this run)
 *   - alreadyArchivedCount
 *   - skippedValidCount  (event_id matches a live event — untouched)
 *   - errors[]
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Fetch all registrations and live events
    const [allRegistrations, allEvents] = await Promise.all([
      base44.asServiceRole.entities.EventRegistration.list('-created_date', 2000),
      base44.asServiceRole.entities.StrideEvent.list('-created_date', 500),
    ]);

    const validEventIds = new Set(allEvents.map(e => e.id));
    const now = new Date().toISOString();

    const report = {
      totalChecked: allRegistrations.length,
      archivedCount: 0,
      alreadyArchivedCount: 0,
      skippedValidCount: 0,
      errors: [],
    };

    for (const reg of allRegistrations) {
      // Skip records that are already archived
      if (reg.is_archived === true) {
        report.alreadyArchivedCount++;
        continue;
      }

      // Skip valid registrations — event_id matches a live StrideEvent
      if (reg.event_id && validEventIds.has(reg.event_id)) {
        report.skippedValidCount++;
        continue;
      }

      // Orphaned — event_id is missing or points to a deleted event
      try {
        await base44.asServiceRole.entities.EventRegistration.update(reg.id, {
          is_archived: true,
          archive_reason: 'orphaned_deleted_event',
          archived_at: now,
          archived_by: user.email,
        });
        report.archivedCount++;
      } catch (err) {
        report.errors.push({ reg_id: reg.id, error: err.message });
      }
    }

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
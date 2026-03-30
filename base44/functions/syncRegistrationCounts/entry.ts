import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * syncRegistrationCounts
 *
 * Triggered by entity automation on EventRegistration create/update/delete.
 * Recalculates EventCategory.registered_count and StrideEvent.total_registered
 * from real data — never relies on +1/-1 increments.
 *
 * Active registrations = status NOT IN ['cancelled', 'rejected']
 */
Deno.serve(async (req) => {
  try {
    const body = await req.json();

    // Pull affected IDs from automation payload
    // On update, also check old_data in case category_id or event_id changed
    const currentData = body.data || {};
    const oldData     = body.old_data || {};

    // Collect all category_ids and event_ids we need to refresh
    // (covers status changes, category reassignments, event reassignments, deletes)
    const categoryIds = new Set();
    const eventIds    = new Set();

    if (currentData.category_id) categoryIds.add(currentData.category_id);
    if (currentData.event_id)    eventIds.add(currentData.event_id);
    if (oldData.category_id)     categoryIds.add(oldData.category_id);
    if (oldData.event_id)        eventIds.add(oldData.event_id);

    // Also handle payload_too_large — fetch via entity_id if data was omitted
    if (body.payload_too_large && body.event?.entity_id) {
      const base44User = createClientFromRequest(req);
      const reg = await base44User.asServiceRole.entities.EventRegistration.filter({ id: body.event.entity_id });
      if (reg[0]) {
        if (reg[0].category_id) categoryIds.add(reg[0].category_id);
        if (reg[0].event_id)    eventIds.add(reg[0].event_id);
      }
    }

    if (categoryIds.size === 0 && eventIds.size === 0) {
      return Response.json({ ok: true, message: 'Nothing to sync — no IDs found in payload' });
    }

    // Use service role to bypass RLS (EventCategory + StrideEvent are admin-write)
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const INACTIVE = new Set(['cancelled', 'rejected']);

    // ── 1. Sync each affected category ──────────────────────────────────────
    for (const catId of categoryIds) {
      if (!catId || catId === 'rsvp') continue;

      const regs = await sr.entities.EventRegistration.filter({ category_id: catId });
      const count = regs.filter(r => !INACTIVE.has(r.status)).length;

      await sr.entities.EventCategory.update(catId, { registered_count: count });
    }

    // ── 2. Sync each affected event ──────────────────────────────────────────
    for (const evId of eventIds) {
      if (!evId) continue;

      const regs = await sr.entities.EventRegistration.filter({ event_id: evId });
      const count = regs.filter(r => !INACTIVE.has(r.status)).length;

      await sr.entities.StrideEvent.update(evId, { total_registered: count });
    }

    return Response.json({
      ok: true,
      synced_categories: [...categoryIds],
      synced_events: [...eventIds],
    });

  } catch (error) {
    console.error('syncRegistrationCounts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
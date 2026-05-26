/**
 * staffEventAction — backend function for staff-scoped event data mutations.
 *
 * Actions supported:
 *   - checkin: mark registration as checked_in (requires checkin or full_admin_view role)
 *   - approve_payment: approve a payment record (requires payments or full_admin_view role)
 *   - needs_attention: flag payment for re-upload (requires payments or full_admin_view role)
 *   - bulk_checkin: bulk check-in multiple registrations
 *   - approve_registration: confirm a registration (requires registrations or full_admin_view)
 *   - reject_registration: reject a registration (requires registrations or full_admin_view)
 *   - log_activity: write an EventActivityLog entry (any accepted staff role)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const normalizeEmail = (e) => String(e || '').toLowerCase().trim();

async function getAcceptedAssignment(base44, eventId, userEmail) {
  const records = await base44.asServiceRole.entities.EventStaffAssignment.filter({
    event_id: eventId,
    staff_email: normalizeEmail(userEmail),
    status: 'accepted',
  });
  return records[0] || null;
}

function hasRole(assignment, ...roles) {
  if (!assignment) return false;
  const assignedRoles = assignment.roles || [];
  if (assignedRoles.includes('full_admin_view')) return true;
  return roles.some(r => assignedRoles.includes(r));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, event_id, registration_id, payment_id, admin_note, summary, action_type, target_type, target_id, meta, registration_ids } = body;

    if (!event_id) {
      return Response.json({ error: 'event_id required' }, { status: 400 });
    }

    const isGlobalAdmin = user.role === 'admin';

    // Check if user is event owner
    let isOwner = false;
    if (!isGlobalAdmin) {
      const events = await base44.asServiceRole.entities.StrideEvent.filter({ id: event_id });
      const event = events[0];
      if (event) {
        isOwner = normalizeEmail(event.creator_email) === normalizeEmail(user.email) ||
                  normalizeEmail(event.organizer_email) === normalizeEmail(user.email);
      }
    }

    const isFull = isGlobalAdmin || isOwner;

    // Get staff assignment if not full admin/owner
    let assignment = null;
    if (!isFull) {
      assignment = await getAcceptedAssignment(base44, event_id, user.email);
      if (!assignment) {
        return Response.json({ error: 'No accepted staff assignment found for this event' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();

    // ── ACTION: checkin ──
    if (action === 'checkin') {
      if (!isFull && !hasRole(assignment, 'checkin')) {
        return Response.json({ error: 'Forbidden: checkin role required' }, { status: 403 });
      }
      if (!registration_id) return Response.json({ error: 'registration_id required' }, { status: 400 });

      await base44.asServiceRole.entities.EventRegistration.update(registration_id, {
        checked_in: true,
        checked_in_at: now,
        checked_in_by: normalizeEmail(user.email),
      });

      return Response.json({ success: true });
    }

    // ── ACTION: bulk_checkin ──
    if (action === 'bulk_checkin') {
      if (!isFull && !hasRole(assignment, 'checkin')) {
        return Response.json({ error: 'Forbidden: checkin role required' }, { status: 403 });
      }
      if (!registration_ids?.length) return Response.json({ error: 'registration_ids required' }, { status: 400 });

      await Promise.all(registration_ids.map(id =>
        base44.asServiceRole.entities.EventRegistration.update(id, {
          checked_in: true,
          checked_in_at: now,
          checked_in_by: normalizeEmail(user.email),
        })
      ));

      return Response.json({ success: true, count: registration_ids.length });
    }

    // ── ACTION: approve_payment ──
    if (action === 'approve_payment') {
      if (!isFull && !hasRole(assignment, 'payments')) {
        return Response.json({ error: 'Forbidden: payments role required' }, { status: 403 });
      }
      if (!payment_id) return Response.json({ error: 'payment_id required' }, { status: 400 });

      // Verify payment belongs to this event
      const payments = await base44.asServiceRole.entities.EventPayment.filter({ id: payment_id, event_id });
      const payment = payments[0];
      if (!payment) return Response.json({ error: 'Payment not found for this event' }, { status: 404 });

      // Idempotent: skip if already approved
      if (payment.status === 'approved') {
        return Response.json({ success: true, skipped: true });
      }

      await base44.asServiceRole.entities.EventPayment.update(payment_id, {
        status: 'approved',
        reviewed_by: normalizeEmail(user.email),
        reviewed_at: now,
        admin_note: admin_note || null,
      });

      const reg_id = payment.registration_id;
      if (reg_id) {
        // Load registration and category to generate BIB using the same logic as admin approval
        const [regs, categoryRegs] = await Promise.all([
          base44.asServiceRole.entities.EventRegistration.filter({ id: reg_id }),
          base44.asServiceRole.entities.EventRegistration.filter({ event_id }),
        ]);
        const reg = regs[0];

        let bibNumber = reg?.bib_number || null;

        // Only generate BIB if not already assigned
        if (!bibNumber && reg?.category_id) {
          const cats = await base44.asServiceRole.entities.EventCategory.filter({ id: reg.category_id });
          const cat = cats[0];
          const prefix = cat?.bib_prefix || 'R';
          const start = cat?.bib_start || 1;
          const usedBibs = new Set(
            categoryRegs
              .filter(r => r.category_id === reg.category_id && r.bib_number)
              .map(r => r.bib_number)
          );
          let candidate = start;
          do {
            bibNumber = `${prefix}${String(candidate).padStart(3, '0')}`;
            candidate++;
          } while (usedBibs.has(bibNumber));
        }

        await base44.asServiceRole.entities.EventRegistration.update(reg_id, {
          payment_status: 'paid',
          status: 'confirmed',
          ...(bibNumber && !reg?.bib_number ? { bib_number: bibNumber } : {}),
        });
      }

      return Response.json({ success: true, bib_number: reg_id ? null : undefined });
    }

    // ── ACTION: needs_attention ──
    if (action === 'needs_attention') {
      if (!isFull && !hasRole(assignment, 'payments')) {
        return Response.json({ error: 'Forbidden: payments role required' }, { status: 403 });
      }
      if (!payment_id) return Response.json({ error: 'payment_id required' }, { status: 400 });

      const payments = await base44.asServiceRole.entities.EventPayment.filter({ id: payment_id, event_id });
      if (!payments[0]) return Response.json({ error: 'Payment not found for this event' }, { status: 404 });

      const paymentsNa = await base44.asServiceRole.entities.EventPayment.filter({ id: payment_id, event_id });
      const paymentNa = paymentsNa[0];

      await base44.asServiceRole.entities.EventPayment.update(payment_id, {
        status: 'needs_attention',
        reviewed_by: normalizeEmail(user.email),
        reviewed_at: now,
        admin_note: admin_note || null,
      });

      // Also update registration payment_status so participant sees they need to re-upload
      if (paymentNa?.registration_id) {
        await base44.asServiceRole.entities.EventRegistration.update(paymentNa.registration_id, {
          payment_status: 'needs_attention',
        });
      }

      return Response.json({ success: true });
    }

    // ── ACTION: approve_registration ──
    if (action === 'approve_registration') {
      if (!isFull && !hasRole(assignment, 'registrations')) {
        return Response.json({ error: 'Forbidden: registrations role required' }, { status: 403 });
      }
      if (!registration_id) return Response.json({ error: 'registration_id required' }, { status: 400 });

      await base44.asServiceRole.entities.EventRegistration.update(registration_id, {
        status: 'confirmed',
      });

      return Response.json({ success: true });
    }

    // ── ACTION: reject_registration ──
    if (action === 'reject_registration') {
      if (!isFull && !hasRole(assignment, 'registrations')) {
        return Response.json({ error: 'Forbidden: registrations role required' }, { status: 403 });
      }
      if (!registration_id) return Response.json({ error: 'registration_id required' }, { status: 400 });

      await base44.asServiceRole.entities.EventRegistration.update(registration_id, {
        status: 'rejected',
      });

      return Response.json({ success: true });
    }

    // ── ACTION: log_activity ──
    if (action === 'log_activity') {
      // Any authenticated user who has accepted assignment can write logs
      if (!isFull && !assignment) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      await base44.asServiceRole.entities.EventActivityLog.create({
        event_id,
        actor_email: normalizeEmail(user.email),
        action_type: action_type || 'manual_checkin_force',
        target_type: target_type || null,
        target_id: target_id || null,
        summary: summary || action_type,
        meta: meta || null,
      });

      return Response.json({ success: true });
    }

    // ── ACTION: get_event_data ──
    // Returns all event-scoped registrations/payments/categories for staff who have accepted assignment.
    // Uses asServiceRole to bypass RLS — permission is verified via EventStaffAssignment above.
    if (action === 'get_event_data') {
      // Fetch all event data in parallel using service role
      const [registrations, payments, categories] = await Promise.all([
        base44.asServiceRole.entities.EventRegistration.filter({ event_id }, '-created_date', 500),
        isFull || hasRole(assignment, 'payments')
          ? base44.asServiceRole.entities.EventPayment.filter({ event_id }, '-created_date', 500)
          : Promise.resolve([]),
        base44.asServiceRole.entities.EventCategory.filter({ event_id }, '-created_date', 200),
      ]);

      return Response.json({ success: true, registrations, payments, categories });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
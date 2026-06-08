/**
 * testStaffAssignmentAccess
 *
 * Admin-only diagnostic function to verify staff assignment access for a given
 * event_id + staff_email pair. Returns full access matrix and raw assignment data.
 *
 * Usage: POST { event_id, staff_email }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const normalizeEmail = (e) => String(e || '').toLowerCase().trim();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { event_id, staff_email } = body;

    if (!event_id || !staff_email) {
      return Response.json({ error: 'event_id and staff_email required' }, { status: 400 });
    }

    const normEmail = normalizeEmail(staff_email);
    const errors = [];

    // 1. Fetch all assignments for this event+email (any status)
    const allAssignments = await base44.asServiceRole.entities.EventStaffAssignment.filter({
      event_id,
      staff_email: normEmail,
    });

    const activeAssignment = allAssignments.find(
      r => r.status === 'accepted' || r.status === 'active'
    ) || null;

    const roles = activeAssignment ? (activeAssignment.roles || []) : [];
    const hasFull = roles.includes('full_admin_view');

    // 2. Count data this user would see via staffEventAction
    let registrationCount = 0;
    let paymentCount = 0;
    let canGetEventData = false;
    let canCheckin = false;
    let canPayments = false;
    let canRegistrations = false;

    if (activeAssignment) {
      canGetEventData = true;
      canCheckin = hasFull || roles.includes('checkin');
      canPayments = hasFull || roles.includes('payments');
      canRegistrations = hasFull || roles.includes('registrations') || roles.includes('bib');

      try {
        const regs = await base44.asServiceRole.entities.EventRegistration.filter(
          { event_id }, '-created_date', 500
        );
        registrationCount = regs.filter(r => r.is_archived !== true).length;
      } catch (e) {
        errors.push('registration_fetch: ' + e.message);
      }

      if (canPayments) {
        try {
          const pays = await base44.asServiceRole.entities.EventPayment.filter(
            { event_id }, '-created_date', 500
          );
          paymentCount = pays.length;
        } catch (e) {
          errors.push('payment_fetch: ' + e.message);
        }
      }
    } else {
      errors.push('No active assignment found (status must be accepted or active)');
    }

    return Response.json({
      user_email: staff_email,
      normalized_email: normEmail,
      all_assignments_found: allAssignments.length,
      all_assignment_statuses: allAssignments.map(a => ({ id: a.id, status: a.status, roles: a.roles, staff_email: a.staff_email })),
      assignment_found: !!activeAssignment,
      assignment_id: activeAssignment?.id || null,
      assignment_status: activeAssignment?.status || null,
      roles,
      can_get_event_data: canGetEventData,
      can_checkin: canCheckin,
      can_payments: canPayments,
      can_registrations: canRegistrations,
      registration_count: registrationCount,
      payment_count: paymentCount,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
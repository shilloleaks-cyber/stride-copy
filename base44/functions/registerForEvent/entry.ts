import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { event_id, category_id, item_selections } = body;

  if (!event_id || !category_id) {
    return Response.json({ error: 'Missing event_id or category_id' }, { status: 400 });
  }

  // ── 1. Duplicate check ──────────────────────────────────────────────────────
  const existingRegs = await base44.asServiceRole.entities.EventRegistration.filter({
    event_id,
    user_email: user.email,
  });
  const activeExisting = existingRegs.filter(
    r => r.status !== 'cancelled' && r.status !== 'rejected'
  );
  if (activeExisting.length > 0) {
    return Response.json({ error: 'DUPLICATE' }, { status: 409 });
  }

  // ── 2. Fetch category ───────────────────────────────────────────────────────
  let cat = null;
  try {
    const cats = await base44.asServiceRole.entities.EventCategory.filter({ event_id, is_active: true });
    cat = cats.find(c => c.id === category_id) || null;
  } catch (_) {}
  if (!cat) {
    return Response.json({ error: 'Category not found' }, { status: 404 });
  }

  // ── 3. Slot check ───────────────────────────────────────────────────────────
  if (cat.max_slots > 0 && (cat.registered_count || 0) >= cat.max_slots) {
    return Response.json({ error: 'FULL' }, { status: 409 });
  }

  const isFree = (cat.price || 0) <= 0;

  // ── 4. Bib assignment (free registrations only, server-side with retry) ─────
  let assignedBib = null;
  if (isFree) {
    const prefix = cat.bib_prefix || 'R';
    const start  = cat.bib_start  || 1;
    const MAX_ATTEMPTS = 20;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Fresh query each attempt to get latest used bibs
      const allCatRegs = await base44.asServiceRole.entities.EventRegistration.filter({
        category_id,
      });
      const usedBibs = new Set(
        allCatRegs.filter(r => r.bib_number).map(r => r.bib_number)
      );

      // Find first unused bib starting from start + attempt offset
      let candidate = start;
      let bib = null;
      while (true) {
        const tryBib = `${prefix}${String(candidate).padStart(3, '0')}`;
        if (!usedBibs.has(tryBib)) {
          bib = tryBib;
          break;
        }
        candidate++;
        if (candidate > start + 9999) break; // safety ceiling
      }

      if (!bib) {
        return Response.json({ error: 'No bibs available' }, { status: 409 });
      }

      // ── 5. Create registration with the chosen bib ──────────────────────────
      const qr = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();

      const displayName = user.first_name || user.full_name || user.email.split('@')[0] || 'User';
      const nameParts = String(displayName).trim().split(/\s+/).filter(Boolean);
      const firstName = user.first_name || nameParts[0] || user.email.split('@')[0] || 'User';
      const lastName  = user.last_name  || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '—');

      const payload = {
        event_id,
        category_id,
        user_email: user.email,
        user_id: user.id || user.email,
        first_name: firstName,
        last_name: lastName,
        status: 'confirmed',
        qr_code: qr,
        checked_in: false,
        blood_type: 'unknown',
        payment_status: 'not_required',
        bib_number: bib,
      };

      if (user.phone)       payload.phone        = user.phone;
      if (user.birth_date)  payload.date_of_birth = user.birth_date;
      if (user.gender && ['male', 'female', 'other'].includes(user.gender)) {
        payload.gender = user.gender;
      }
      if (user.nationality) payload.nationality = user.nationality;
      if (item_selections && typeof item_selections === 'object' && Object.keys(item_selections).length > 0) {
        payload.item_selections = item_selections;
      }

      const reg = await base44.asServiceRole.entities.EventRegistration.create(payload);

      // ── 6. Hard safety: verify the bib is unique after write ───────────────
      const verifyRegs = await base44.asServiceRole.entities.EventRegistration.filter({
        category_id,
        bib_number: bib,
      });
      const duplicates = verifyRegs.filter(r => r.id !== reg.id && r.bib_number === bib);

      if (duplicates.length === 0) {
        // Clean win — bib is uniquely ours
        return Response.json({ registration: reg });
      }

      // Collision detected after write — delete our record and retry
      console.warn(`Bib collision on ${bib}, attempt ${attempt + 1}. Retrying...`);
      await base44.asServiceRole.entities.EventRegistration.delete(reg.id);
      // Loop continues with fresh bib query
    }

    return Response.json({ error: 'Failed to assign a unique bib after retries' }, { status: 500 });
  }

  // ── Paid registration — no bib yet, stays pending ──────────────────────────
  const qr = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
  const displayName = user.first_name || user.full_name || user.email.split('@')[0] || 'User';
  const nameParts = String(displayName).trim().split(/\s+/).filter(Boolean);
  const firstName = user.first_name || nameParts[0] || user.email.split('@')[0] || 'User';
  const lastName  = user.last_name  || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '—');

  const paidPayload = {
    event_id,
    category_id,
    user_email: user.email,
    user_id: user.id || user.email,
    first_name: firstName,
    last_name: lastName,
    status: 'pending',
    qr_code: qr,
    checked_in: false,
    blood_type: 'unknown',
    payment_status: 'pending',
  };

  if (user.phone)       paidPayload.phone         = user.phone;
  if (user.birth_date)  paidPayload.date_of_birth  = user.birth_date;
  if (user.gender && ['male', 'female', 'other'].includes(user.gender)) {
    paidPayload.gender = user.gender;
  }
  if (user.nationality) paidPayload.nationality = user.nationality;
  if (item_selections && typeof item_selections === 'object' && Object.keys(item_selections).length > 0) {
    paidPayload.item_selections = item_selections;
  }

  const paidReg = await base44.asServiceRole.entities.EventRegistration.create(paidPayload);
  return Response.json({ registration: paidReg });
});
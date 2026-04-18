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

  // ── 1. Duplicate registration check ────────────────────────────────────────
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

  // ── 4. Shared payload builder ───────────────────────────────────────────────
  const qr = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
  const displayName = user.full_name || user.email.split('@')[0] || 'User';
  const nameParts = String(displayName).trim().split(/\s+/).filter(Boolean);
  const firstName = user.first_name || nameParts[0] || user.email.split('@')[0] || 'User';
  const lastName  = user.last_name  || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '—');

  const basePayload = {
    event_id,
    category_id,
    user_email: user.email,
    user_id: user.id || user.email,
    first_name: firstName,
    last_name: lastName,
    qr_code: qr,
    checked_in: false,
    blood_type: 'unknown',
  };

  if (user.phone)       basePayload.phone          = user.phone;
  if (user.birth_date)  basePayload.date_of_birth   = user.birth_date;
  if (user.gender && ['male', 'female', 'other'].includes(user.gender)) {
    basePayload.gender = user.gender;
  }
  if (user.nationality) basePayload.nationality = user.nationality;
  if (item_selections && typeof item_selections === 'object' && Object.keys(item_selections).length > 0) {
    basePayload.item_selections = item_selections;
  }

  const isFree = (cat.price || 0) <= 0;

  // ── 5. PAID: no bib assigned now, stays pending ─────────────────────────────
  if (!isFree) {
    const paidReg = await base44.asServiceRole.entities.EventRegistration.create({
      ...basePayload,
      status: 'pending',
      payment_status: 'pending',
    });
    return Response.json({ registration: paidReg });
  }

  // ── 6. FREE: assign bib with optimistic-create retry ───────────────────────
  // Strategy:
  //   a) Scan existing bibs once to find the current max used number.
  //   b) Pick the next candidate from there.
  //   c) Attempt to create the record directly — the DB unique constraint on
  //      (category_id, bib_number) will reject concurrent duplicates atomically.
  //   d) If the create throws a uniqueness/conflict error, advance the candidate
  //      and retry. No post-create delete is ever performed.
  //
  // Chosen uniqueness rule: category_id + bib_number
  // (bibs are scoped per category, e.g. R001 in "5K" ≠ R001 in "10K")

  const prefix = cat.bib_prefix || 'R';
  const start  = cat.bib_start  || 1;
  const MAX_ATTEMPTS = 30;

  // Pre-scan to find the highest currently-used sequential number so we start
  // from a good candidate instead of always starting from `start`.
  const allCatRegs = await base44.asServiceRole.entities.EventRegistration.filter({ category_id });
  const usedNumbers = new Set();
  for (const r of allCatRegs) {
    if (r.bib_number && r.bib_number.startsWith(prefix)) {
      const num = parseInt(r.bib_number.slice(prefix.length), 10);
      if (!isNaN(num)) usedNumbers.add(num);
    }
  }

  // Find the first unused number starting from `start`
  let candidateNum = start;
  while (usedNumbers.has(candidateNum)) candidateNum++;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const bib = `${prefix}${String(candidateNum).padStart(3, '0')}`;

    try {
      const reg = await base44.asServiceRole.entities.EventRegistration.create({
        ...basePayload,
        status: 'confirmed',
        payment_status: 'not_required',
        bib_number: bib,
      });

      // Success — the DB constraint confirmed this bib is unique in this category
      return Response.json({ registration: reg });

    } catch (err) {
      // Check if this is a uniqueness / duplicate-key error from the DB.
      // The Base44 SDK wraps DB errors; inspect the message for known signals.
      const msg = String(err?.message || err?.data?.message || '').toLowerCase();
      const isUniquenessError =
        msg.includes('unique') ||
        msg.includes('duplicate') ||
        msg.includes('already exists') ||
        msg.includes('conflict') ||
        (err?.status === 409);

      if (!isUniquenessError) {
        // Unexpected error — surface it immediately
        throw err;
      }

      // Bib conflict: advance to the next candidate and retry
      console.warn(`Bib conflict on ${bib} (attempt ${attempt + 1}), trying next...`);
      candidateNum++;
    }
  }

  return Response.json({ error: 'Failed to assign a unique bib after retries' }, { status: 500 });
});
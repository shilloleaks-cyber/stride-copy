/**
 * registrationQr — shared QR parsing helper.
 *
 * Single source of truth for parsing EventRegistration QR codes.
 * Used by StrideCheckin and staffEventAction backend.
 */

/**
 * Parse a raw QR scan string into a normalized lookup object.
 *
 * Supports:
 *   A. JSON: {"type":"event_registration","registration_id":"...","event_id":"...","bib_number":"..."}
 *   B. Legacy JSON fields: registrationId, event_registration_id, id, ticket_id
 *   C. Plain registration ID (UUID-like string)
 *   D. Plain bib number (short alphanum, not UUID)
 *   E. Plain email
 *   F. Raw qr_code string fallback
 *
 * Returns:
 *   { type, registration_id, event_id, bib_number, email, raw, format }
 */
export function parseRegistrationQr(input) {
  const raw = (input || '').trim();
  if (!raw) return { raw, format: 'empty' };

  // A/B — JSON payload
  if (raw.startsWith('{')) {
    try {
      const obj = JSON.parse(raw);
      // Canonical new format
      if (obj.type === 'event_registration' && obj.registration_id) {
        return {
          format: 'json',
          type: obj.type,
          registration_id: obj.registration_id,
          event_id: obj.event_id || null,
          bib_number: obj.bib_number || null,
          email: obj.user_email || obj.email || null,
          raw,
        };
      }
      // Legacy JSON field names
      const reg_id =
        obj.registration_id ||
        obj.registrationId ||
        obj.event_registration_id ||
        obj.id ||
        obj.ticket_id ||
        null;
      if (reg_id) {
        return {
          format: 'json_legacy',
          type: obj.type || 'event_registration',
          registration_id: reg_id,
          event_id: obj.event_id || obj.eventId || null,
          bib_number: obj.bib_number || obj.bibNumber || null,
          email: obj.user_email || obj.email || null,
          raw,
        };
      }
    } catch (_) {
      // not valid JSON — fall through
    }
  }

  // D — email
  if (raw.includes('@')) {
    return { format: 'email', registration_id: null, event_id: null, bib_number: null, email: raw, raw };
  }

  // C — UUID-like (8-4-4-4-12 hex or 24+ hex chars like MongoDB ObjectID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  const isMongoId = /^[0-9a-f]{20,}$/i.test(raw);
  if (isUuid || isMongoId) {
    return { format: 'id', registration_id: raw, event_id: null, bib_number: null, email: null, raw };
  }

  // D — bib number or name search (short text)
  return { format: 'text', registration_id: null, event_id: null, bib_number: raw, email: null, raw };
}

/**
 * Returns an ordered list of lookup strategies for client-side matching
 * given a parsed QR result and a list of candidate registrations.
 *
 * Finds the best matching registration from `candidates`.
 * Returns the matched registration or null.
 */
export function findRegistrationInList(parsed, candidates) {
  if (!candidates?.length) return null;

  // 1. By registration ID (most authoritative)
  if (parsed.registration_id) {
    const byId = candidates.find(r => r.id === parsed.registration_id);
    if (byId) return byId;
  }

  // 2. By raw qr_code string match
  if (parsed.raw) {
    const byQr = candidates.find(r => r.qr_code === parsed.raw);
    if (byQr) return byQr;
  }

  // 3. By bib number (case-insensitive)
  if (parsed.bib_number) {
    const bibUpper = parsed.bib_number.toUpperCase();
    const byBib = candidates.find(r => r.bib_number?.toUpperCase() === bibUpper);
    if (byBib) return byBib;
  }

  // 4. By email
  if (parsed.email) {
    const emailLower = parsed.email.toLowerCase();
    const byEmail = candidates.find(r => r.user_email?.toLowerCase() === emailLower);
    if (byEmail) return byEmail;
  }

  return null;
}
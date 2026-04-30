/**
 * Shared utility: build the standardized participant check-in QR payload.
 * Use this everywhere instead of duplicating QR payload logic.
 *
 * Returns a JSON string suitable for EventRegistration.qr_code.
 */
export function buildRegistrationQrPayload(reg) {
  return JSON.stringify({
    type: 'event_registration',
    registration_id: reg.id,
    event_id: reg.event_id,
    bib_number: reg.bib_number || null,
  });
}

/**
 * Returns true if the qr_code value is a valid new-format JSON payload.
 */
export function isValidQrPayload(qrCode) {
  if (!qrCode || typeof qrCode !== 'string') return false;
  try {
    const obj = JSON.parse(qrCode);
    return obj.type === 'event_registration' && !!obj.registration_id;
  } catch (_) {
    return false;
  }
}
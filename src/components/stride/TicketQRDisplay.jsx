import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a real, scannable participant check-in QR code.
 * Uses the `qrcode` library — no fake/hash patterns.
 *
 * Props:
 *   value {string} — JSON-stringified check-in payload (EventRegistration.qr_code)
 *   size  {number} — pixel size of the QR (default 260)
 */
export default function TicketQRDisplay({ value, size = 260 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,           // 2-module quiet zone (≈ 8–10 px at 260px width) — sufficient for scanners
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }, () => {});
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: size > 150 ? 12 : 6 }}
    />
  );
}
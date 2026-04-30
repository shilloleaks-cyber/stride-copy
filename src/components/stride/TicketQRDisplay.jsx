import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a real, scannable QR code using the `qrcode` library.
 * `value` should be the JSON-stringified check-in payload.
 */
export default function TicketQRDisplay({ value, size = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }, () => {});
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: size > 100 ? 14 : 8, display: 'block' }}
    />
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RefreshCw } from 'lucide-react';

const SCANNER_ID = 'stride-qr-scanner';

export default function QRScanner({ onScan, onClose }) {
  const [status, setStatus] = useState('starting'); // starting | scanning | denied | unavailable
  const scannerRef = useRef(null);
  const lastScannedRef = useRef(null);
  const mountedRef = useRef(true);
  // Guard: prevent overlapping start calls
  const startingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    startScanner();
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    const s = scannerRef.current;
    scannerRef.current = null; // clear ref immediately to prevent double-stop
    if (!s) return;
    try {
      // isScanning() is a method on html5-qrcode, not a property
      if (s.isScanning()) await s.stop();
    } catch (_) {}
    try {
      s.clear();
    } catch (_) {}
  };

  const startScanner = async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    if (!mountedRef.current) { startingRef.current = false; return; }
    setStatus('starting');

    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          // Prevent rapid duplicate scans of the same code
          if (decodedText === lastScannedRef.current) return;
          lastScannedRef.current = decodedText;

          // Stop scanner, then notify parent — fully async-safe
          stopScanner().then(() => {
            if (mountedRef.current) onScan(decodedText);
          });
        },
        () => {} // ignore per-frame decode errors
      );

      if (mountedRef.current) setStatus('scanning');
    } catch (err) {
      if (!mountedRef.current) { startingRef.current = false; return; }

      // Detect permission denial — covers Safari (NotAllowedError), Chrome, Firefox
      const name = err?.name || '';
      const msg = (err?.message || '').toLowerCase();
      const isDenied =
        name === 'NotAllowedError' ||
        msg.includes('permission') ||
        msg.includes('notallowed') ||
        msg.includes('denied');

      const isUnavailable =
        name === 'NotFoundError' ||
        msg.includes('notfound') ||
        msg.includes('no camera') ||
        msg.includes('device not found');

      if (isDenied) {
        setStatus('denied');
      } else if (isUnavailable) {
        setStatus('unavailable');
      } else {
        // Unknown error — treat as unavailable with retry
        console.warn('[QRScanner] Unexpected error:', err);
        setStatus('unavailable');
      }
    } finally {
      startingRef.current = false;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleRetry = async () => {
    lastScannedRef.current = null;
    await stopScanner(); // fully stop before restarting
    startScanner();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.96)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-white font-bold text-lg">Scan QR Code</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Point at the runner's QR code
          </p>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {(status === 'starting' || status === 'scanning') && (
          <div className="relative w-full max-w-sm">
            {/* html5-qrcode mounts the video element here */}
            <div
              id={SCANNER_ID}
              className="w-full rounded-2xl overflow-hidden"
              style={{ minHeight: 300 }}
            />
            {/* Corner frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                {[
                  ['top-0 left-0', 'border-t-2 border-l-2 rounded-tl-xl'],
                  ['top-0 right-0', 'border-t-2 border-r-2 rounded-tr-xl'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2 rounded-bl-xl'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2 rounded-br-xl'],
                ].map(([pos, cls]) => (
                  <div
                    key={pos}
                    className={`absolute w-8 h-8 ${pos} ${cls}`}
                    style={{ borderColor: '#BFFF00' }}
                  />
                ))}
              </div>
            </div>
            {/* Loading spinner while camera is initialising */}
            {status === 'starting' && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#BFFF00', borderTopColor: 'transparent' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Permission denied */}
        {status === 'denied' && (
          <div className="w-full max-w-sm text-center space-y-4 px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(255,80,80,0.12)' }}
            >
              <CameraOff className="w-8 h-8" style={{ color: 'rgba(255,100,100,1)' }} />
            </div>
            <p className="text-white font-bold text-lg">Camera Permission Denied</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Allow camera access in your browser or device settings, then tap Retry.
              On iPhone, go to <strong>Settings → Safari → Camera → Allow</strong>.
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: '#BFFF00', color: '#0A0A0A' }}
            >
              <RefreshCw className="w-5 h-5" /> Retry
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              Use Manual Entry Instead
            </button>
          </div>
        )}

        {/* Camera unavailable */}
        {status === 'unavailable' && (
          <div className="w-full max-w-sm text-center space-y-4 px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(255,200,80,0.1)' }}
            >
              <CameraOff className="w-8 h-8" style={{ color: 'rgba(255,200,80,1)' }} />
            </div>
            <p className="text-white font-bold text-lg">Camera Unavailable</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Could not start the camera. Make sure no other app is using it, or use manual bib entry.
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
            >
              <RefreshCw className="w-5 h-5" /> Retry
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              Use Manual Entry Instead
            </button>
          </div>
        )}
      </div>

      {/* Bottom scanning hint */}
      {status === 'scanning' && (
        <div className="pb-12 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Scanning automatically — hold steady
          </p>
        </div>
      )}
    </div>
  );
}
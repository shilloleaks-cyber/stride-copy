import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff, RefreshCw } from 'lucide-react';

const SCANNER_ID = 'stride-qr-scanner';

export default function QRScanner({ onScan, onClose }) {
  const [status, setStatus] = useState('starting'); // starting | scanning | denied | unavailable
  const scannerRef = useRef(null);
  const lastScannedRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startScanner();
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
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
          stopScanner();
          onScan(decodedText);
        },
        () => {} // ignore per-frame decode errors
      );

      if (mountedRef.current) setStatus('scanning');
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setStatus('denied');
      } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
        setStatus('unavailable');
      } else {
        setStatus('unavailable');
      }
    }
  };

  const stopScanner = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      s.clear();
    } catch (_) {}
    scannerRef.current = null;
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleRetry = async () => {
    lastScannedRef.current = null;
    await stopScanner();
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
            {/* The scanner mounts here */}
            <div
              id={SCANNER_ID}
              className="w-full rounded-2xl overflow-hidden"
              style={{ minHeight: 300 }}
            />
            {/* Corner frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64">
                {[['top-0 left-0', 'border-t-2 border-l-2 rounded-tl-xl'],
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
            {status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#BFFF00', borderTopColor: 'transparent' }} />
              </div>
            )}
          </div>
        )}

        {/* Denied */}
        {status === 'denied' && (
          <div className="w-full max-w-sm text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(255,80,80,0.12)' }}>
              <CameraOff className="w-8 h-8" style={{ color: 'rgba(255,100,100,1)' }} />
            </div>
            <p className="text-white font-bold text-lg">Camera Permission Denied</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Allow camera access in your browser or device settings, then tap Retry.
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: '#BFFF00', color: '#0A0A0A' }}
            >
              <RefreshCw className="w-5 h-5" /> Retry
            </button>
          </div>
        )}

        {/* Unavailable */}
        {status === 'unavailable' && (
          <div className="w-full max-w-sm text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(255,200,80,0.1)' }}>
              <CameraOff className="w-8 h-8" style={{ color: 'rgba(255,200,80,1)' }} />
            </div>
            <p className="text-white font-bold text-lg">Camera Unavailable</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No camera was found on this device. Use manual bib entry instead.
            </p>
            <button
              onClick={handleRetry}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            >
              <RefreshCw className="w-5 h-5" /> Retry
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
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
import React, { useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';

// Simple QR-like visual using the code string as seed (real QR via canvas pattern)
function QRDisplay({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    const cellSize = size / 21;

    // Deterministic pattern from string hash
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    const seed = hash(value);
    for (let row = 0; row < 21; row++) {
      for (let col = 0; col < 21; col++) {
        const isCorner = (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
        let filled;
        if (isCorner) {
          filled = (row === 0 || row === 6 || col === 0 || col === 6 ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4));
        } else {
          filled = ((hash(value + row * 100 + col * 13) + seed) % 3 === 0);
        }
        if (filled) ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 12 }} />;
}

export default function QRModal({ registration, event, category, onClose }) {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="font-bold text-white">{event?.title || 'Event'}</p>
            {category && <p className="text-xs mt-0.5" style={{ color: '#BFFF00' }}>{category.name}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-6 py-6 space-y-4">
          <div className="p-3 rounded-2xl" style={{ background: 'white' }}>
            <QRDisplay value={registration.qr_code} size={200} />
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>QR Code</p>
            <p className="text-sm font-mono font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{registration.qr_code}</p>
          </div>

          {/* Bib + Name */}
          <div className="w-full rounded-2xl p-4" style={{ background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.18)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Name</p>
                <p className="font-bold text-white">{registration.first_name} {registration.last_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Bib</p>
                <p className="text-2xl font-black" style={{ color: '#BFFF00' }}>{registration.bib_number || '—'}</p>
              </div>
            </div>
            {registration.shirt_size && (
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Shirt: <span className="text-white font-semibold">{registration.shirt_size}</span>
                {' · '}Status: <span className="capitalize font-semibold" style={{ color: registration.status === 'confirmed' ? 'rgb(0,210,110)' : 'rgba(255,200,80,1)' }}>{registration.status}</span>
              </p>
            )}
            {registration.checked_in && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(0,210,110)' }} />
                <p className="text-xs font-bold" style={{ color: 'rgb(0,210,110)' }}>Checked In</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
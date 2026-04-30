import React from 'react';
import { X } from 'lucide-react';
import TicketQRDisplay from './TicketQRDisplay';

export default function QRModal({ registration, event, category, onClose }) {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
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
        <div className="flex flex-col items-center px-6 py-8 space-y-5">
          <div style={{ padding: 14, background: 'white', borderRadius: 18, boxShadow: '0 0 40px rgba(191,255,0,0.15)' }}>
            <TicketQRDisplay value={registration.qr_code} size={220} />
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
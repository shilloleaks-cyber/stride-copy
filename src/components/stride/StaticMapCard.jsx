import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function buildStaticMapUrl(event) {
  if (!API_KEY) return null;
  const center = (event.latitude && event.longitude)
    ? `${event.latitude},${event.longitude}`
    : encodeURIComponent(event.location_name || '');
  if (!center) return null;
  const marker = (event.latitude && event.longitude)
    ? `color:0x8A2BE2|${event.latitude},${event.longitude}`
    : `color:0x8A2BE2|${encodeURIComponent(event.location_name)}`;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=15&size=600x300&scale=2&markers=${marker}&key=${API_KEY}&style=feature:all|element:geometry|color:0x1a1a2e&style=feature:road|element:geometry|color:0x2d2d4e&style=feature:water|element:geometry|color:0x0a0a1a&style=feature:landscape|element:geometry|color:0x141428`;
}

export default function StaticMapCard({ event }) {
  const [imgError, setImgError] = useState(false);
  const staticMapUrl = buildStaticMapUrl(event);
  const showRealMap = staticMapUrl && !imgError;

  return (
    <div
      onClick={() => window.open(event.maps_link, '_blank')}
      style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(138,43,226,0.3)',
        height: 180, marginBottom: 10, cursor: 'pointer',
        background: 'linear-gradient(135deg, #0d0620 0%, #0a0a14 60%, #0c1020 100%)',
      }}
    >
      {/* Real Static Map image */}
      {showRealMap && (
        <img
          src={staticMapUrl}
          alt="Map preview"
          onError={() => setImgError(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
          }}
        />
      )}

      {/* Fallback placeholder (no API key or image error) */}
      {!showRealMap && (
        <>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8A2BE2" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mgrid)" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#BFFF00" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.25"/>
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#8A2BE2" strokeWidth="1" strokeDasharray="4,6" opacity="0.2"/>
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#8A2BE2" strokeWidth="1" strokeDasharray="4,6" opacity="0.2"/>
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -65%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50% 50% 50% 0%',
              transform: 'rotate(-45deg)',
              background: 'linear-gradient(135deg, #8A2BE2, #6010b0)',
              border: '2px solid rgba(191,255,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(138,43,226,0.6)',
            }}>
              <MapPin style={{ width: 16, height: 16, color: 'white', transform: 'rotate(45deg)' }} />
            </div>
            <div style={{ width: 2, height: 8, background: 'rgba(138,43,226,0.6)', borderRadius: 2, marginTop: -2 }} />
          </div>
        </>
      )}

      {/* Tap badge */}
      <div style={{
        position: 'absolute', top: 10, right: 12, zIndex: 2,
        padding: '4px 9px', borderRadius: 8,
        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(191,255,0,0.25)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(191,255,0,0.85)', letterSpacing: '0.05em' }}>TAP TO OPEN ↗</span>
      </div>

      {/* Bottom gradient label */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
        padding: '10px 14px',
        background: 'linear-gradient(to top, rgba(8,3,18,0.92) 55%, transparent)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <MapPin style={{ width: 11, height: 11, color: '#8A2BE2', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
          {event.location_name || 'View on Google Maps'}
        </span>
      </div>
    </div>
  );
}
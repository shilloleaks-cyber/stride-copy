import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Parse route_points from any of the supported formats
export function parseRoutePoints(raw) {
  if (!raw) return [];
  try {
    let pts = raw;
    if (typeof raw === 'string') pts = JSON.parse(raw);
    if (!Array.isArray(pts)) return [];
    return pts
      .map(p => {
        if (Array.isArray(p) && p.length >= 2) return { lat: Number(p[0]), lng: Number(p[1]) };
        if (p && typeof p === 'object' && 'lat' in p && 'lng' in p) return { lat: Number(p.lat), lng: Number(p.lng) };
        return null;
      })
      .filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch (_) {
    return [];
  }
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, points]);
  return null;
}

export default function RouteMap({ routePoints }) {
  const points = parseRoutePoints(routePoints);
  const hasRoute = points.length >= 2;
  const center = hasRoute
    ? [points[Math.floor(points.length / 2)].lat, points[Math.floor(points.length / 2)].lng]
    : [13.736717, 100.523186]; // Bangkok fallback

  const latLngs = points.map(p => [p.lat, p.lng]);
  const start = hasRoute ? latLngs[0] : null;
  const end = hasRoute ? latLngs[latLngs.length - 1] : null;

  if (!hasRoute) {
    return (
      <div style={ms.noRoute}>
        <span style={ms.noRouteIcon}>🗺</span>
        <span style={ms.noRouteTxt}>No route recorded</span>
      </div>
    );
  }

  return (
    <div style={ms.mapWrap}>
      <MapContainer
        center={center}
        zoom={15}
        style={ms.map}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <FitBounds points={points} />
        <Polyline
          positions={latLngs}
          pathOptions={{
            color: '#BFFF00',
            weight: 4,
            opacity: 0.92,
          }}
        />
        {/* Start marker as circle */}
        {start && (
          <Polyline
            positions={[start]}
            pathOptions={{ color: '#BFFF00', weight: 10, opacity: 1 }}
          />
        )}
        {/* End marker as circle */}
        {end && (
          <Polyline
            positions={[end]}
            pathOptions={{ color: '#FF6B6B', weight: 12, opacity: 1 }}
          />
        )}
      </MapContainer>

      {/* Dark gradient overlay top */}
      <div style={ms.overlayTop} />
      {/* Dark gradient overlay bottom */}
      <div style={ms.overlayBottom} />

      {/* Legend */}
      <div style={ms.legend}>
        <span style={ms.dotStart} /> <span style={ms.legendTxt}>Start</span>
        <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>·</span>
        <span style={ms.dotEnd} /> <span style={ms.legendTxt}>End</span>
      </div>
    </div>
  );
}

const ms = {
  mapWrap: {
    position: 'relative',
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(191,255,0,0.20)',
    boxShadow: '0 0 24px rgba(191,255,0,0.08), 0 0 40px rgba(138,43,226,0.10)',
  },
  map: {
    width: '100%',
    height: '100%',
    background: '#111',
  },
  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 40,
    background: 'linear-gradient(to bottom, rgba(7,7,10,0.55) 0%, transparent 100%)',
    pointerEvents: 'none', zIndex: 400,
  },
  overlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 40,
    background: 'linear-gradient(to top, rgba(7,7,10,0.55) 0%, transparent 100%)',
    pointerEvents: 'none', zIndex: 400,
  },
  legend: {
    position: 'absolute', bottom: 10, right: 12,
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(7,7,10,0.70)',
    backdropFilter: 'blur(6px)',
    borderRadius: 999, padding: '4px 10px',
    zIndex: 500,
  },
  dotStart: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', backgroundColor: '#BFFF00',
    boxShadow: '0 0 6px rgba(191,255,0,0.8)',
  },
  dotEnd: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', backgroundColor: '#FF6B6B',
    boxShadow: '0 0 6px rgba(255,107,107,0.8)',
  },
  legendTxt: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600 },
  noRoute: {
    height: 80,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
  },
  noRouteIcon: { fontSize: 22, opacity: 0.4 },
  noRouteTxt: { fontSize: 13, color: 'rgba(255,255,255,0.30)', fontWeight: 600 },
};
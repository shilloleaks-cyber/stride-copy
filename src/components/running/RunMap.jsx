import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker for current position
const createRunnerIcon = () => {
  return L.divIcon({
    className: 'custom-runner-marker',
    html: `<div style="
      position: relative;
      width: 24px;
      height: 24px;
    ">
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background: rgba(16, 185, 129, 0.3);
        border-radius: 50%;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 12px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.2);
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0; }
      }
    </style>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to update map view when center changes
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

import { getRouteColor } from '@/utils/itemUtils';

export default function RunMap({ routeCoordinates, currentPosition, isActive, preRunPosition, showFullRoute = false, enableZoom = false, onCenterClick, mapCenter: externalMapCenter, mapZoom: externalMapZoom, children }) {
  const [mapCenter, setMapCenter] = useState([13.7563, 100.5018]);
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef(null);
  
  // Get equipped route color
  const routeStyle = getRouteColor();

  // Use external center/zoom if provided (for ActiveRun smart centering)
  useEffect(() => {
    if (externalMapCenter) {
      setMapCenter(externalMapCenter);
    }
    if (externalMapZoom) {
      setMapZoom(externalMapZoom);
    }
  }, [externalMapCenter, externalMapZoom]);

  // Auto-center logic for other cases
  useEffect(() => {
    if (externalMapCenter) return; // Skip if external control
    
    if (showFullRoute && routeCoordinates && routeCoordinates.length > 0) {
      const latSum = routeCoordinates.reduce((sum, p) => sum + p.lat, 0);
      const lngSum = routeCoordinates.reduce((sum, p) => sum + p.lng, 0);
      const centerLat = latSum / routeCoordinates.length;
      const centerLng = lngSum / routeCoordinates.length;
      setMapCenter([centerLat, centerLng]);
      setMapZoom(15);
    } else if (currentPosition) {
      setMapCenter([currentPosition.lat, currentPosition.lng]);
    } else if (preRunPosition) {
      setMapCenter([preRunPosition.lat, preRunPosition.lng]);
    } else if (routeCoordinates && routeCoordinates.length > 0) {
      const lastPoint = routeCoordinates[routeCoordinates.length - 1];
      setMapCenter([lastPoint.lat, lastPoint.lng]);
    }
  }, [currentPosition, routeCoordinates, preRunPosition, showFullRoute, externalMapCenter]);

  // Convert coordinates for Polyline
  const pathCoordinates = routeCoordinates.map(coord => [coord.lat, coord.lng]);

  // Get start marker position
  const startPosition = routeCoordinates.length > 0 
    ? [routeCoordinates[0].lat, routeCoordinates[0].lng]
    : null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={enableZoom}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Map controller */}
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* Draw the route path */}
        {pathCoordinates.length > 1 && (
          <>
            {/* Glow layer */}
            <Polyline
              positions={pathCoordinates}
              pathOptions={{
                color: routeStyle.glow,
                weight: routeStyle.glowWeight,
                opacity: routeStyle.glowOpacity,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Main route */}
            <Polyline
              positions={pathCoordinates}
              pathOptions={{
                color: routeStyle.main,
                weight: routeStyle.weight,
                opacity: routeStyle.opacity,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}
        
        {/* Minimal start/finish dots */}
        {startPosition && (
          <CircleMarker 
            center={startPosition}
            radius={4}
            pathOptions={{ 
              color: '#BFFF00', 
              fillColor: '#BFFF00', 
              fillOpacity: 1, 
              weight: 1 
            }}
          />
        )}

        {showFullRoute && pathCoordinates.length > 1 && (
          <CircleMarker 
            center={pathCoordinates[pathCoordinates.length - 1]}
            radius={4}
            pathOptions={{ 
              color: '#8A2BE2', 
              fillColor: '#8A2BE2', 
              fillOpacity: 1, 
              weight: 1 
            }}
          />
        )}
        
        {/* Pre-run position marker (before start) */}
        {preRunPosition && !currentPosition && (
          <Marker 
            position={[preRunPosition.lat, preRunPosition.lng]}
            icon={L.divIcon({
              className: 'custom-prerun-marker',
              html: `<div style="
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 8px rgba(59, 130, 246, 0.2);
              "></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          />
        )}

        {/* Current position marker (during run) */}
        {currentPosition && (
          <Marker 
            position={[currentPosition.lat, currentPosition.lng]}
            icon={createRunnerIcon()}
          />
        )}

        {/* Render children (e.g., GhostRunner) */}
        {children}
        </MapContainer>

      {/* Map overlay info */}
      {isActive && (
        <>
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>GPS Tracking Active</span>
            </div>
          </div>


        </>
      )}

      {/* Pre-run overlay */}
      {preRunPosition && !isActive && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>You are here</span>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
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

// Component to auto-center map on current position
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function RunMap({ routeCoordinates, currentPosition, isActive, preRunPosition, showFullRoute = false, enableZoom = false, onCenterClick }) {
  const [mapCenter, setMapCenter] = useState([13.7563, 100.5018]); // Default: Bangkok
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef(null);

  useEffect(() => {
    if (showFullRoute && routeCoordinates && routeCoordinates.length > 0) {
      // Calculate center point of entire route
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
  }, [currentPosition, routeCoordinates, preRunPosition, showFullRoute]);

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
        
        {/* Auto-center controller */}
        {isActive && currentPosition && (
          <MapController center={[currentPosition.lat, currentPosition.lng]} zoom={mapZoom} />
        )}
        
        {/* Draw the route path */}
        {pathCoordinates.length > 1 && (
          <>
            {/* Fading trail effect for active runs */}
            {isActive && pathCoordinates.length > 10 && (
              <Polyline
                positions={pathCoordinates}
                pathOptions={{
                  color: '#10b981',
                  weight: 6,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            )}
            <Polyline
              positions={pathCoordinates}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}
        
        {/* Start marker */}
        {startPosition && (
          <Marker 
            position={startPosition}
            icon={L.divIcon({
              className: 'custom-start-marker',
              html: `<div style="
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  background: white;
                  color: #3b82f6;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                  margin-bottom: 2px;
                  white-space: nowrap;
                ">START</div>
                <div style="
                  width: 16px;
                  height: 16px;
                  background: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })}
          />
        )}

        {/* End marker (only for completed runs with full route) */}
        {showFullRoute && pathCoordinates.length > 1 && (
          <Marker 
            position={pathCoordinates[pathCoordinates.length - 1]}
            icon={L.divIcon({
              className: 'custom-end-marker',
              html: `<div style="
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  background: white;
                  color: #10b981;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                  margin-bottom: 2px;
                  white-space: nowrap;
                ">FINISH</div>
                <div style="
                  width: 16px;
                  height: 16px;
                  background: #10b981;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 40],
            })}
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

          {/* Center button */}
          {onCenterClick && currentPosition && (
            <button
              onClick={onCenterClick}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/80 transition-colors shadow-lg"
              aria-label="Center on location"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          )}
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
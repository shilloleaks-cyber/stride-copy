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
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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

export default function RunMap({ routeCoordinates, currentPosition, isActive, preRunPosition, showFullRoute = false }) {
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
        zoomControl={false}
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
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>GPS Tracking Active</span>
          </div>
        </div>
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
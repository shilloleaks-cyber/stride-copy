import React, { useEffect, useState } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';

export default function GhostRunner({ ghostRoute, currentSeconds, isActive }) {
  const [ghostPosition, setGhostPosition] = useState(null);

  useEffect(() => {
    if (!ghostRoute || !isActive || ghostRoute.length === 0) {
      setGhostPosition(null);
      return;
    }

    // Find ghost position based on elapsed time
    const ghostPoint = ghostRoute.find((point, index) => {
      if (index === 0) return false;
      const prevPoint = ghostRoute[index - 1];
      const prevTime = (new Date(prevPoint.time) - new Date(ghostRoute[0].time)) / 1000;
      const currTime = (new Date(point.time) - new Date(ghostRoute[0].time)) / 1000;
      return prevTime <= currentSeconds && currentSeconds <= currTime;
    });

    if (ghostPoint) {
      setGhostPosition([ghostPoint.lat, ghostPoint.lng]);
    } else if (currentSeconds > 0) {
      // If past the end, show at last point
      const lastPoint = ghostRoute[ghostRoute.length - 1];
      setGhostPosition([lastPoint.lat, lastPoint.lng]);
    }
  }, [currentSeconds, ghostRoute, isActive]);

  if (!ghostRoute || ghostRoute.length === 0) return null;

  const ghostPath = ghostRoute.map(p => [p.lat, p.lng]);

  const ghostIcon = L.divIcon({
    className: 'ghost-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background: rgba(59, 130, 246, 0.6);
      border: 2px solid rgba(59, 130, 246, 0.9);
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      {/* Ghost route path */}
      <Polyline
        positions={ghostPath}
        pathOptions={{
          color: '#3b82f6',
          weight: 3,
          opacity: 0.5,
          dashArray: '10, 10',
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />
      
      {/* Ghost runner position */}
      {ghostPosition && isActive && (
        <Marker position={ghostPosition} icon={ghostIcon} />
      )}
    </>
  );
}
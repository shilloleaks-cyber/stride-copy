import React, { useRef, useEffect } from 'react';

export default function RoutePreview({ routePoints, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!routePoints || routePoints.length < 2 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find bounds
    const lats = routePoints.map(p => p.lat);
    const lngs = routePoints.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    // Add padding
    const padding = 10;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    // Convert lat/lng to canvas coordinates
    const toCanvasCoords = (lat, lng) => {
      const x = padding + ((lng - minLng) / lngRange) * drawWidth;
      const y = padding + ((maxLat - lat) / latRange) * drawHeight;
      return { x, y };
    };

    // Draw route
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const start = toCanvasCoords(routePoints[0].lat, routePoints[0].lng);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < routePoints.length; i++) {
      const point = toCanvasCoords(routePoints[i].lat, routePoints[i].lng);
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();

    // Draw start point with border
    ctx.beginPath();
    ctx.fillStyle = '#3b82f6';
    ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw end point with border
    const end = toCanvasCoords(
      routePoints[routePoints.length - 1].lat,
      routePoints[routePoints.length - 1].lng
    );
    ctx.beginPath();
    ctx.fillStyle = '#10b981';
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [routePoints]);

  if (!routePoints || routePoints.length < 2) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={60}
      className={className}
    />
  );
}
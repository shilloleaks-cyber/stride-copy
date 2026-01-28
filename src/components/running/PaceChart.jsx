import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function PaceChart({ routePoints, avgPace }) {
  if (!routePoints || routePoints.length < 2) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-400">Not enough data to show pace chart</p>
      </div>
    );
  }

  // Calculate pace per kilometer segment
  const paceData = [];
  let cumulativeDistance = 0;
  
  for (let i = 1; i < routePoints.length; i++) {
    const prevPoint = routePoints[i - 1];
    const currPoint = routePoints[i];
    
    const distance = calculateDistance(
      prevPoint.lat,
      prevPoint.lng,
      currPoint.lat,
      currPoint.lng
    );
    
    const timeDiff = (new Date(currPoint.time) - new Date(prevPoint.time)) / 1000; // seconds
    cumulativeDistance += distance;
    
    if (distance > 0 && timeDiff > 0) {
      const segmentPace = (timeDiff / 60) / distance; // min/km
      
      paceData.push({
        km: parseFloat(cumulativeDistance.toFixed(2)),
        pace: parseFloat(Math.min(segmentPace, 15).toFixed(2)), // Cap at 15 min/km for display
        label: `${Math.floor(segmentPace)}:${String(Math.round((segmentPace % 1) * 60)).padStart(2, '0')}`
      });
    }
  }

  // Group by kilometer for cleaner display
  const kmData = [];
  let currentKm = 0;
  let kmPaces = [];
  
  paceData.forEach(point => {
    const pointKm = Math.floor(point.km);
    if (pointKm > currentKm) {
      if (kmPaces.length > 0) {
        const avgKmPace = kmPaces.reduce((a, b) => a + b, 0) / kmPaces.length;
        kmData.push({
          km: currentKm + 1,
          pace: parseFloat(avgKmPace.toFixed(2)),
          label: `${Math.floor(avgKmPace)}:${String(Math.round((avgKmPace % 1) * 60)).padStart(2, '0')}`
        });
      }
      currentKm = pointKm;
      kmPaces = [point.pace];
    } else {
      kmPaces.push(point.pace);
    }
  });
  
  // Add last km
  if (kmPaces.length > 0) {
    const avgKmPace = kmPaces.reduce((a, b) => a + b, 0) / kmPaces.length;
    kmData.push({
      km: currentKm + 1,
      pace: parseFloat(avgKmPace.toFixed(2)),
      label: `${Math.floor(avgKmPace)}:${String(Math.round((avgKmPace % 1) * 60)).padStart(2, '0')}`
    });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">Km {payload[0].payload.km}</p>
          <p className="text-emerald-400 text-sm">Pace: {payload[0].payload.label} /km</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={kmData}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="km" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Kilometer', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            reversed
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="pace" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="url(#paceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
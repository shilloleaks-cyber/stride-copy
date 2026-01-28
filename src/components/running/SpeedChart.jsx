import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SpeedChart({ routePoints, avgSpeed }) {
  if (!routePoints || routePoints.length < 2) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-gray-400">Not enough data to show speed chart</p>
      </div>
    );
  }

  // Calculate speed over time
  const speedData = [];
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
      const speed = (distance / timeDiff) * 3600; // km/h
      const minutes = Math.floor((i * 3) / 60); // Approximate time in minutes
      
      speedData.push({
        time: minutes,
        speed: parseFloat(Math.min(speed, 30).toFixed(2)), // Cap at 30 km/h for display
        distance: parseFloat(cumulativeDistance.toFixed(2))
      });
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white text-sm">Time: ~{payload[0].payload.time} min</p>
          <p className="text-blue-400 text-sm font-medium">Speed: {payload[0].value.toFixed(1)} km/h</p>
          <p className="text-gray-400 text-xs">Distance: {payload[0].payload.distance.toFixed(2)} km</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={speedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgSpeed && (
            <ReferenceLine 
              y={avgSpeed} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              label={{ value: 'Avg', fill: '#f59e0b', fontSize: 10 }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="speed" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
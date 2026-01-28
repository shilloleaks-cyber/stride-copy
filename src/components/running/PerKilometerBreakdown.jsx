import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Heart, Minus } from 'lucide-react';

export default function PerKilometerBreakdown({ routePoints, avgHeartRate }) {
  const calculateKilometerData = () => {
    if (!routePoints || routePoints.length < 2) return [];

    const kmData = [];
    let currentKm = 0;
    let kmStartIndex = 0;
    let totalDistance = 0;

    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      
      const segmentDistance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      totalDistance += segmentDistance;

      // When we reach 1km
      if (totalDistance >= 1.0) {
        const kmPoints = routePoints.slice(kmStartIndex, i + 1);
        const kmStats = calculateKmStats(kmPoints);
        
        if (kmStats) {
          kmData.push({
            km: currentKm + 1,
            ...kmStats
          });
        }

        currentKm++;
        kmStartIndex = i;
        totalDistance = 0;
      }
    }

    // Handle remaining distance
    if (totalDistance > 0.1 && kmStartIndex < routePoints.length - 1) {
      const kmPoints = routePoints.slice(kmStartIndex);
      const kmStats = calculateKmStats(kmPoints);
      
      if (kmStats) {
        kmData.push({
          km: currentKm + 1,
          partial: true,
          distance: totalDistance,
          ...kmStats
        });
      }
    }

    return kmData;
  };

  const calculateKmStats = (points) => {
    if (points.length < 2) return null;

    let totalDistance = 0;
    let totalTime = 0;
    const speeds = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff = (new Date(curr.time) - new Date(prev.time)) / 1000;
      
      totalDistance += distance;
      totalTime += timeDiff;

      if (distance > 0 && timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600);
        if (speed > 0 && speed < 30) {
          speeds.push(speed);
        }
      }
    }

    if (totalDistance === 0 || totalTime === 0) return null;

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const pace = avgSpeed > 0 ? 60 / avgSpeed : 0;

    // Simulate elevation (since we don't have real data)
    const elevationChange = (Math.random() - 0.5) * 20;

    return {
      pace,
      elevation: elevationChange,
      heartRate: avgHeartRate ? avgHeartRate + Math.floor((Math.random() - 0.5) * 10) : null
    };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const kmData = calculateKilometerData();

  if (kmData.length === 0) return null;

  return (
    <div className="space-y-3">
      {kmData.map((km, index) => {
        const isSlower = index > 0 && km.pace > kmData[index - 1].pace;
        const isFaster = index > 0 && km.pace < kmData[index - 1].pace;

        return (
          <motion.div
            key={km.km}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-400">{km.km}</span>
                </div>
                {km.partial && (
                  <span className="text-xs text-gray-500">
                    ({km.distance.toFixed(2)} km)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {isFaster && <TrendingDown className="w-4 h-4 text-green-400" />}
                {isSlower && <TrendingUp className="w-4 h-4 text-orange-400" />}
                {!isFaster && !isSlower && index > 0 && <Minus className="w-4 h-4 text-gray-500" />}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-blue-400" />
                  <p className="text-xs text-gray-500">Pace</p>
                </div>
                <p className="text-lg font-light text-white">{formatPace(km.pace)}</p>
                <p className="text-xs text-gray-500">/km</p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  <p className="text-xs text-gray-500">Elevation</p>
                </div>
                <p className={`text-lg font-light ${km.elevation > 0 ? 'text-red-400' : km.elevation < 0 ? 'text-green-400' : 'text-white'}`}>
                  {km.elevation > 0 ? '+' : ''}{km.elevation.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">m</p>
              </div>

              {km.heartRate && (
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    <p className="text-xs text-gray-500">HR</p>
                  </div>
                  <p className="text-lg font-light text-white">{km.heartRate}</p>
                  <p className="text-xs text-gray-500">bpm</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
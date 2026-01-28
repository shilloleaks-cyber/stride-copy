import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award } from 'lucide-react';

export default function PaceConsistencyScore({ routePoints }) {
  const calculateConsistencyScore = () => {
    if (!routePoints || routePoints.length < 2) return null;

    const paces = [];
    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      
      const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff = (new Date(curr.time) - new Date(prev.time)) / 1000;
      
      if (distance > 0 && timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600); // km/h
        if (speed > 0 && speed < 30) {
          const pace = 60 / speed; // min/km
          paces.push(pace);
        }
      }
    }

    if (paces.length < 5) return null;

    // Calculate standard deviation
    const mean = paces.reduce((a, b) => a + b, 0) / paces.length;
    const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (lower is better)
    const cv = (stdDev / mean) * 100;

    // Convert to score (0-100, where 100 is perfect consistency)
    const score = Math.max(0, Math.min(100, 100 - (cv * 10)));

    return {
      score: Math.round(score),
      rating: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Variable',
      color: score >= 90 ? 'emerald' : score >= 75 ? 'green' : score >= 60 ? 'yellow' : 'orange'
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

  const result = calculateConsistencyScore();

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-${result.color}-500/20 to-${result.color}-600/10 border border-${result.color}-500/30 rounded-2xl p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 text-${result.color}-400`} />
          <h3 className="text-sm font-medium text-white">Pace Consistency</h3>
        </div>
        <Award className={`w-5 h-5 text-${result.color}-400`} />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-light text-white">{result.score}</span>
            <span className="text-gray-400 text-sm">/100</span>
          </div>
          <p className={`text-sm text-${result.color}-400 font-medium`}>{result.rating}</p>
        </div>
        
        <div className="flex-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r from-${result.color}-500 to-${result.color}-400`}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {result.score >= 90 && 'Outstanding pace control! You maintained a very steady rhythm throughout your run.'}
        {result.score >= 75 && result.score < 90 && 'Great pacing! Minor variations are normal and healthy.'}
        {result.score >= 60 && result.score < 75 && 'Your pace varied moderately. Consider focusing on maintaining a steady rhythm.'}
        {result.score < 60 && 'Significant pace variations detected. Try to maintain a more consistent effort level.'}
      </p>
    </motion.div>
  );
}
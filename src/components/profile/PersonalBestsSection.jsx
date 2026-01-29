import React from 'react';
import { motion } from 'framer-motion';
import { Award, MapPin, TrendingUp, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function PersonalBestsSection({ runs }) {
  const completedRuns = runs.filter(r => r.status === 'completed');

  // Calculate personal bests for different distances
  const calculateBestTime = (targetDistance, tolerance = 0.5) => {
    const relevantRuns = completedRuns.filter(r => {
      const distance = r.distance_km || 0;
      return Math.abs(distance - targetDistance) <= tolerance && r.duration_seconds > 0;
    });

    if (relevantRuns.length === 0) return null;

    return relevantRuns.reduce((best, run) => {
      if (!best || run.duration_seconds < best.duration_seconds) {
        return run;
      }
      return best;
    }, null);
  };

  const best5k = calculateBestTime(5);
  const best10k = calculateBestTime(10);
  const bestHalfMarathon = calculateBestTime(21.1, 1);

  const longestRun = completedRuns.reduce((max, r) => 
    (r.distance_km || 0) > (max?.distance_km || 0) ? r : max, null);
  
  const fastestPace = completedRuns
    .filter(r => r.pace_min_per_km > 0)
    .reduce((min, r) => 
      (r.pace_min_per_km || Infinity) < (min?.pace_min_per_km || Infinity) ? r : min, null);

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const personalBests = [
    {
      id: '5k',
      name: '5K',
      icon: Zap,
      run: best5k,
      value: best5k ? formatDuration(best5k.duration_seconds) : 'Not yet',
      gradient: 'from-cyan-500/10 to-transparent',
      border: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    {
      id: '10k',
      name: '10K',
      icon: TrendingUp,
      run: best10k,
      value: best10k ? formatDuration(best10k.duration_seconds) : 'Not yet',
      gradient: 'from-blue-500/10 to-transparent',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      id: 'half',
      name: 'Half Marathon',
      icon: Award,
      run: bestHalfMarathon,
      value: bestHalfMarathon ? formatDuration(bestHalfMarathon.duration_seconds) : 'Not yet',
      gradient: 'from-purple-500/10 to-transparent',
      border: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      id: 'longest',
      name: 'Longest Run',
      icon: MapPin,
      run: longestRun,
      value: longestRun ? `${longestRun.distance_km?.toFixed(2)} km` : 'Not yet',
      gradient: 'from-yellow-500/10 to-transparent',
      border: 'border-yellow-500/20',
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      id: 'fastest',
      name: 'Fastest Pace',
      icon: Zap,
      run: fastestPace,
      value: fastestPace && fastestPace.pace_min_per_km > 0 ? `${formatPace(fastestPace.pace_min_per_km)} /km` : 'Not yet',
      gradient: 'from-red-500/10 to-transparent',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="px-6 mb-6">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Award className="w-4 h-4 text-yellow-400" />
        Personal Bests
      </h2>
      <div className="space-y-3">
        {personalBests.map((pb, index) => (
          <motion.div
            key={pb.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gradient-to-r ${pb.gradient} border ${pb.border} rounded-2xl p-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${pb.bgColor} flex items-center justify-center`}>
                <pb.icon className={`w-5 h-5 ${pb.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{pb.name}</p>
                <p className="text-xl font-light text-white">{pb.value}</p>
              </div>
            </div>
            {pb.run && (
              <p className="text-xs text-gray-500">
                {format(new Date(pb.run.start_time), 'd MMM yyyy')}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import RoutePreview from './RoutePreview';

export default function RunListItem({ run, index }) {
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl(`RunDetails?id=${run.id}`)}
        className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white font-medium">
              {format(new Date(run.start_time), 'EEEE, MMM d')}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(run.start_time), 'h:mm a')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Distance</p>
              <p className="text-xl font-light text-white">{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500">km</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Pace</p>
              <p className="text-xl font-light text-white">{formatPace(run.pace_min_per_km)}</p>
              <p className="text-xs text-gray-500">/km</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Time</p>
              <p className="text-xl font-light text-white">{formatDuration(run.duration_seconds)}</p>
              <p className="text-xs text-gray-500">duration</p>
            </div>
          </div>

          {/* Route Preview */}
          {run.route_points && run.route_points.length >= 2 && (
            <div className="flex-shrink-0">
              <RoutePreview routePoints={run.route_points} className="rounded-lg" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
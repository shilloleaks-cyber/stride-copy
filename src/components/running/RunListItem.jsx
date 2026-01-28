import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ChevronRight, MapPin, Clock, Flame, Heart } from 'lucide-react';

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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl(`RunDetails?id=${run.id}`)}
        className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-4">
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
        
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-lg font-light text-white">{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500">km</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-lg font-light text-white">{formatDuration(run.duration_seconds)}</p>
              <p className="text-xs text-gray-500">time</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-lg font-light text-white">{run.calories_burned || 0}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-lg font-light text-white">{run.avg_heart_rate || '--'}</p>
              <p className="text-xs text-gray-500">bpm</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
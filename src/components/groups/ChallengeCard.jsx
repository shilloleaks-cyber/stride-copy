import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Trophy, MapPin, Activity, Clock, Zap, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ChallengeCard({ challenge, groupId, user }) {
  const typeIcons = {
    total_distance: MapPin,
    most_runs: Activity,
    total_time: Clock,
    avg_pace: Zap
  };

  const typeColors = {
    total_distance: 'text-emerald-400 bg-emerald-500/20',
    most_runs: 'text-blue-400 bg-blue-500/20',
    total_time: 'text-purple-400 bg-purple-500/20',
    avg_pace: 'text-amber-400 bg-amber-500/20'
  };

  const Icon = typeIcons[challenge.challenge_type] || Trophy;
  const colorClass = typeColors[challenge.challenge_type] || 'text-white bg-white/10';

  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Link to={createPageUrl(`ChallengeLeaderboard?id=${challenge.id}`)}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-medium text-white">{challenge.name}</h3>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            
            {challenge.description && (
              <p className="text-sm text-gray-400 mb-2 line-clamp-1">{challenge.description}</p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={daysLeft <= 2 ? 'text-orange-400' : ''}>{daysLeft} days left</span>
              <span>•</span>
              <span>{format(new Date(challenge.end_date), 'MMM d')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
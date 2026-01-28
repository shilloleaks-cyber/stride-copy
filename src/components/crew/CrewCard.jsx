import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CrewCard({ crew, memberData, onCreateClick, onJoinClick }) {
  if (!crew) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-3xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Join a Crew</h3>
            <p className="text-sm text-gray-400">Run together, win together</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={onCreateClick}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Create Crew
          </button>
          <button
            onClick={onJoinClick}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
          >
            Browse Crews
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <Link to={createPageUrl(`CrewHome?id=${crew.id}`)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-3xl p-6 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center text-2xl">
              {crew.logo_emoji || '🏃'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{crew.name}</h3>
              <p className="text-sm text-gray-400">{crew.member_count} members</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">This Week</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-white">
                {memberData?.weekly_distance_km?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-400">km</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Crew Total</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-blue-400">
                {crew.weekly_distance_km?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-gray-400">km</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
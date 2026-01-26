import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, MapPin, Flame, Clock, Heart, Activity, Trophy, Target } from 'lucide-react';
import StatCard from '@/components/running/StatCard';
import WeeklyChart from '@/components/running/WeeklyChart';
import RunListItem from '@/components/running/RunListItem';

export default function Home() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 100),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');
  const recentRuns = completedRuns.slice(0, 5);

  const stats = {
    totalDistance: completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
    totalTime: completedRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
    totalCalories: completedRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0),
    totalRuns: completedRuns.length,
    avgPace: completedRuns.length > 0 
      ? completedRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / completedRuns.length 
      : 0,
  };

  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-500 text-sm uppercase tracking-widest">Welcome back</p>
          <h1 className="text-3xl font-light mt-1">Your Running</h1>
        </motion.div>
      </div>

      {/* Quick Start Button */}
      <div className="px-6 mb-8">
        <Link to={createPageUrl('ActiveRun')}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-2xl shadow-emerald-500/30 neon-glow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Ready to run?</p>
                <h2 className="text-2xl font-semibold text-white">Start New Run</h2>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          </motion.div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Total Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label="Distance" 
            value={stats.totalDistance.toFixed(1)} 
            unit="km" 
            icon={MapPin}
            accent
          />
          <StatCard 
            label="Time" 
            value={formatTotalTime(stats.totalTime)} 
            icon={Clock}
          />
          <StatCard 
            label="Calories" 
            value={stats.totalCalories.toLocaleString()} 
            unit="kcal" 
            icon={Flame}
          />
          <StatCard 
            label="Runs" 
            value={stats.totalRuns} 
            icon={Activity}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Leaderboard')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">อันดับ</p>
                <p className="text-xs text-gray-400">ดูอันดับผู้เล่น</p>
              </div>
            </motion.div>
          </Link>
          <Link to={createPageUrl('Challenges')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Challenges</p>
                <p className="text-xs text-gray-400">เข้าร่วมกิจกรรม</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="px-6 mb-8">
        <WeeklyChart runs={completedRuns} />
      </div>

      {/* Recent Runs */}
      <div className="px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Recent Runs</h2>
          <Link to={createPageUrl('History')} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            See all
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentRuns.length > 0 ? (
          <div className="space-y-4">
            {recentRuns.map((run, index) => (
              <RunListItem key={run.id} run={run} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
          >
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No runs yet</p>
            <p className="text-sm text-gray-600 mt-1">Start your first run to see it here</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
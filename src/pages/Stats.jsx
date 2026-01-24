import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay, subWeeks } from 'date-fns';
import { 
  ArrowLeft, TrendingUp, Award, Target, 
  MapPin, Clock, Flame, Heart, Zap, Calendar 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Stats() {
  const navigate = useNavigate();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  // Overall stats
  const totalDistance = completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  const totalTime = completedRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  const totalCalories = completedRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0);
  const avgPace = completedRuns.length > 0 
    ? completedRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / completedRuns.length 
    : 0;
  const avgHeartRate = completedRuns.filter(r => r.avg_heart_rate).length > 0
    ? completedRuns.reduce((sum, r) => sum + (r.avg_heart_rate || 0), 0) / completedRuns.filter(r => r.avg_heart_rate).length
    : 0;

  // Personal bests
  const longestRun = completedRuns.reduce((max, r) => (r.distance_km || 0) > (max?.distance_km || 0) ? r : max, null);
  const fastestPace = completedRuns.filter(r => r.pace_min_per_km > 0).reduce((min, r) => 
    (r.pace_min_per_km || Infinity) < (min?.pace_min_per_km || Infinity) ? r : min, null);
  const highestCalories = completedRuns.reduce((max, r) => (r.calories_burned || 0) > (max?.calories_burned || 0) ? r : max, null);
  const longestDuration = completedRuns.reduce((max, r) => (r.duration_seconds || 0) > (max?.duration_seconds || 0) ? r : max, null);

  // Weekly data for chart
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = startOfDay(subWeeks(new Date(), 3 - i));
    const weekEnd = endOfDay(subWeeks(new Date(), 2 - i));
    
    const weekRuns = completedRuns.filter(run => {
      const runDate = new Date(run.start_time);
      return runDate >= weekStart && runDate <= weekEnd;
    });
    
    return {
      week: format(weekStart, 'MMM d'),
      distance: parseFloat(weekRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0).toFixed(1)),
      runs: weekRuns.length,
    };
  });

  // Pace trend (last 10 runs)
  const paceTrend = completedRuns.slice(0, 10).reverse().map((run, i) => ({
    run: i + 1,
    pace: run.pace_min_per_km || 0,
    date: format(new Date(run.start_time), 'MMM d'),
  }));

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">{payload[0].payload.date || label}</p>
          <p className="text-sm text-white font-medium">{payload[0].value} {payload[0].dataKey === 'pace' ? '/km' : 'km'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Statistics</h1>
        <div className="w-10" />
      </div>

      {/* Overall Stats */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">All Time Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
              <MapPin className="w-5 h-5 text-emerald-400 mb-3" />
              <p className="text-3xl font-light text-white">{totalDistance.toFixed(1)}</p>
              <p className="text-sm text-gray-400 mt-1">Total km</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Clock className="w-5 h-5 text-blue-400 mb-3" />
              <p className="text-3xl font-light text-white">{formatDuration(totalTime)}</p>
              <p className="text-sm text-gray-400 mt-1">Total time</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Flame className="w-5 h-5 text-orange-400 mb-3" />
              <p className="text-3xl font-light text-white">{totalCalories.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Calories burned</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Calendar className="w-5 h-5 text-purple-400 mb-3" />
              <p className="text-3xl font-light text-white">{completedRuns.length}</p>
              <p className="text-sm text-gray-400 mt-1">Total runs</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Averages */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Averages</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Zap className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-light text-white">{formatPace(avgPace)}</p>
                <p className="text-xs text-gray-500">Avg Pace/km</p>
              </div>
              <div>
                <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-light text-white">{Math.round(avgHeartRate) || '--'}</p>
                <p className="text-xs text-gray-500">Avg HR (bpm)</p>
              </div>
              <div>
                <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-light text-white">
                  {completedRuns.length > 0 ? (totalDistance / completedRuns.length).toFixed(2) : '0'}
                </p>
                <p className="text-xs text-gray-500">Avg km/run</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly Distance Chart */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Weekly Distance</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last4Weeks}>
                  <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorDistance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pace Trend */}
      {paceTrend.length > 0 && (
        <div className="px-6 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Pace Trend (Last 10 Runs)</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paceTrend}>
                    <XAxis 
                      dataKey="run" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis hide reversed />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="pace" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">Lower is better</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Personal Records */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Personal Records
          </h2>
          <div className="space-y-3">
            {longestRun && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Longest Distance</p>
                  <p className="text-xl font-light text-white">{longestRun.distance_km?.toFixed(2)} km</p>
                </div>
                <p className="text-xs text-gray-500">{format(new Date(longestRun.start_time), 'MMM d, yyyy')}</p>
              </div>
            )}
            {fastestPace && fastestPace.pace_min_per_km > 0 && (
              <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Fastest Pace</p>
                  <p className="text-xl font-light text-white">{formatPace(fastestPace.pace_min_per_km)} /km</p>
                </div>
                <p className="text-xs text-gray-500">{format(new Date(fastestPace.start_time), 'MMM d, yyyy')}</p>
              </div>
            )}
            {longestDuration && (
              <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Longest Duration</p>
                  <p className="text-xl font-light text-white">{formatDuration(longestDuration.duration_seconds)}</p>
                </div>
                <p className="text-xs text-gray-500">{format(new Date(longestDuration.start_time), 'MMM d, yyyy')}</p>
              </div>
            )}
            {highestCalories && (
              <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Most Calories Burned</p>
                  <p className="text-xl font-light text-white">{highestCalories.calories_burned} kcal</p>
                </div>
                <p className="text-xs text-gray-500">{format(new Date(highestCalories.start_time), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
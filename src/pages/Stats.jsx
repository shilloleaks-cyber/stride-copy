import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay, subWeeks, isToday, differenceInDays } from 'date-fns';
import { 
  ArrowLeft, TrendingUp, Award, Target, 
  MapPin, Clock, Flame, Heart, Zap, Calendar, Coins 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Stats() {
  const navigate = useNavigate();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walletLogs = [] } = useQuery({
    queryKey: ['wallet-logs'],
    queryFn: () => base44.entities.WalletLog.filter({ user: user?.email }),
    enabled: !!user,
  });

  const coinBalance = walletLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
  const totalDistance = completedRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  const nextRewardAt = Math.ceil(totalDistance / 5) * 5;
  const kmToNextReward = nextRewardAt - totalDistance;

  const completedRuns = runs.filter(r => r.status === 'completed');

  // Today's distance
  const todayRuns = completedRuns.filter(r => isToday(new Date(r.start_time)));
  const todayDistance = todayRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);

  // Current streak
  const calculateStreak = () => {
    if (completedRuns.length === 0) return 0;
    const sortedRuns = [...completedRuns].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let run of sortedRuns) {
      const runDate = new Date(run.start_time);
      runDate.setHours(0, 0, 0, 0);
      const daysDiff = differenceInDays(currentDate, runDate);
      
      if (daysDiff === streak) {
        streak++;
        currentDate = runDate;
      } else if (daysDiff > streak) {
        break;
      }
    }
    return streak;
  };
  const currentStreak = calculateStreak();

  // This week's runs
  const thisWeekStart = startOfDay(subDays(new Date(), new Date().getDay()));
  const thisWeekRuns = completedRuns.filter(r => new Date(r.start_time) >= thisWeekStart);
  const thisWeekAvgPace = thisWeekRuns.length > 0
    ? thisWeekRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / thisWeekRuns.length
    : 0;

  // Best pace (personal record)
  const bestPace = completedRuns.filter(r => r.pace_min_per_km > 0).reduce((min, r) => 
    (r.pace_min_per_km || Infinity) < (min?.pace_min_per_km || Infinity) ? r : min, null);

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

      {/* Top Stats */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Today</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 col-span-2">
              <MapPin className="w-6 h-6 text-emerald-400 mb-4" />
              <p className="text-5xl font-light text-white mb-2">{todayDistance.toFixed(2)}</p>
              <p className="text-sm text-emerald-400">km today</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Flame className="w-5 h-5 text-orange-400 mb-3" />
              <p className="text-3xl font-light text-white">{currentStreak}</p>
              <p className="text-sm text-gray-400 mt-1">Day streak</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Calendar className="w-5 h-5 text-purple-400 mb-3" />
              <p className="text-3xl font-light text-white">{completedRuns.length}</p>
              <p className="text-sm text-gray-400 mt-1">Total runs</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Zap className="w-5 h-5 text-blue-400 mb-3" />
              <p className="text-3xl font-light text-white">{formatPace(thisWeekAvgPace)}</p>
              <p className="text-sm text-gray-400 mt-1">Avg pace (week)</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
              <Award className="w-5 h-5 text-blue-400 mb-3" />
              <p className="text-3xl font-light text-white">{bestPace ? formatPace(bestPace.pace_min_per_km) : '--:--'}</p>
              <p className="text-sm text-blue-400 mt-1">Best pace</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Stats */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Rewards</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-5">
              <Coins className="w-5 h-5 text-yellow-400 mb-3" />
              <p className="text-3xl font-light text-white">{coinBalance.toFixed(0)}</p>
              <p className="text-sm text-yellow-400 mt-1">Coins</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Target className="w-5 h-5 text-emerald-400 mb-3" />
              <p className="text-3xl font-light text-white">{kmToNextReward.toFixed(1)}</p>
              <p className="text-sm text-gray-400 mt-1">km to reward</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly Distance Chart */}
      <div className="px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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


    </div>
  );
}
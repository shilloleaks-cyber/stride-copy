import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeft, Award, TrendingDown, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function PaceHistory() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 100),
  });

  const completedRuns = runs
    .filter(r => r.status === 'completed' && r.pace_min_per_km > 0)
    .slice(0, 7)
    .reverse();

  // Calculate stats
  const bestPace = completedRuns.length > 0
    ? Math.min(...completedRuns.map(r => r.pace_min_per_km))
    : 0;

  const avgPace = completedRuns.length > 0
    ? completedRuns.reduce((sum, r) => sum + r.pace_min_per_km, 0) / completedRuns.length
    : 0;

  // Prepare chart data
  const chartData = completedRuns.map((run, index) => ({
    index: index + 1,
    pace: parseFloat(run.pace_min_per_km.toFixed(2)),
    label: format(new Date(run.start_time), 'MMM d'),
    date: run.start_time,
    isBest: run.pace_min_per_km === bestPace
  }));

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-emerald-500/50 rounded-xl p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{data.label}</p>
          <p className="text-emerald-400 text-lg font-bold">{formatPace(data.pace)} /km</p>
          {data.isBest && (
            <p className="text-yellow-400 text-xs mt-1">🏆 Best Pace</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={payload.isBest ? 8 : 6} 
          fill={payload.isBest ? "#fbbf24" : "#10b981"} 
          stroke={payload.isBest ? "#f59e0b" : "#059669"}
          strokeWidth={2}
        />
        {payload.isBest && (
          <circle 
            cx={cx} 
            cy={cy} 
            r={12} 
            fill="none" 
            stroke="#fbbf24"
            strokeWidth={1}
            opacity={0.5}
          />
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-medium">Pace History</h1>
            <p className="text-sm text-gray-500">Last 7 runs</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-12">
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      ) : completedRuns.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No pace data yet</p>
          <p className="text-sm text-gray-600 mt-1">Complete more runs to see your pace history</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <p className="text-xs uppercase tracking-widest text-yellow-400">Best Pace</p>
                </div>
                <p className="text-3xl font-light text-white">{formatPace(bestPace)}</p>
                <p className="text-sm text-gray-400 mt-1">/km</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <p className="text-xs uppercase tracking-widest text-emerald-400">Avg Pace</p>
                </div>
                <p className="text-3xl font-light text-white">{formatPace(avgPace)}</p>
                <p className="text-sm text-gray-400 mt-1">/km</p>
              </motion.div>
            </div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-6 pb-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <p className="text-xs uppercase tracking-widest text-gray-500">Lower is Better</p>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickLine={false}
                    reversed
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={avgPace} 
                    stroke="#10b981" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    label={{ 
                      value: 'Avg', 
                      fill: '#10b981', 
                      fontSize: 12,
                      position: 'right'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pace" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={<CustomDot />}
                    activeDot={{ r: 8 }}
                    fill="url(#paceGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Your Pace</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Best Pace</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
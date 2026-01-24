import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ArrowLeft, Calendar, Filter, Activity, TrendingUp, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RunListItem from '@/components/running/RunListItem';

export default function History() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 200),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  const filteredRuns = completedRuns.filter(run => {
    const runDate = new Date(run.start_time);
    const now = new Date();
    
    switch (filter) {
      case 'week':
        return isWithinInterval(runDate, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        });
      case 'month':
        return isWithinInterval(runDate, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
      default:
        return true;
    }
  });

  // Stats for filtered runs
  const stats = {
    totalDistance: filteredRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0),
    totalTime: filteredRuns.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
    totalCalories: filteredRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0),
    avgPace: filteredRuns.length > 0 
      ? filteredRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / filteredRuns.length 
      : 0,
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <h1 className="text-lg font-medium">Run History</h1>
        <div className="w-10" />
      </div>

      {/* Filter */}
      <div className="px-6 pt-6 pb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SelectValue placeholder="Filter by period" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            <SelectItem value="all" className="text-white focus:bg-white/10 focus:text-white">All Time</SelectItem>
            <SelectItem value="week" className="text-white focus:bg-white/10 focus:text-white">This Week</SelectItem>
            <SelectItem value="month" className="text-white focus:bg-white/10 focus:text-white">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="px-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
            {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'} Summary
          </h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-light text-white">{filteredRuns.length}</p>
              <p className="text-xs text-gray-500">Runs</p>
            </div>
            <div>
              <p className="text-2xl font-light text-emerald-400">{stats.totalDistance.toFixed(1)}</p>
              <p className="text-xs text-gray-500">km</p>
            </div>
            <div>
              <p className="text-2xl font-light text-white">{formatDuration(stats.totalTime)}</p>
              <p className="text-xs text-gray-500">Time</p>
            </div>
            <div>
              <p className="text-2xl font-light text-white">{formatPace(stats.avgPace)}</p>
              <p className="text-xs text-gray-500">Avg Pace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Runs List */}
      <div className="px-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
          {filteredRuns.length} {filteredRuns.length === 1 ? 'Run' : 'Runs'}
        </h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRuns.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredRuns.map((run, index) => (
                <RunListItem key={run.id} run={run} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
          >
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No runs found</p>
            <p className="text-sm text-gray-600 mt-1">
              {filter !== 'all' ? 'Try changing the filter' : 'Start your first run!'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { History, Filter, MapPin, Clock, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RunListItem from '@/components/running/RunListItem';

export default function RunningHistorySection({ runs }) {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  const [sortBy, setSortBy] = useState('date'); // date, distance, pace

  const completedRuns = runs.filter(r => r.status === 'completed');

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filter by time
  let filteredRuns = completedRuns;
  if (timeFilter === 'week') {
    filteredRuns = completedRuns.filter(r => {
      const runDate = new Date(r.start_time);
      return isWithinInterval(runDate, { start: weekStart, end: weekEnd });
    });
  } else if (timeFilter === 'month') {
    filteredRuns = completedRuns.filter(r => {
      const runDate = new Date(r.start_time);
      return isWithinInterval(runDate, { start: monthStart, end: monthEnd });
    });
  }

  // Sort
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.start_time) - new Date(a.start_time);
    } else if (sortBy === 'distance') {
      return (b.distance_km || 0) - (a.distance_km || 0);
    } else if (sortBy === 'pace') {
      return (a.pace_min_per_km || Infinity) - (b.pace_min_per_km || Infinity);
    }
    return 0;
  });

  const displayRuns = sortedRuns.slice(0, 5);

  const timeFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const sortOptions = [
    { id: 'date', label: 'Recent', icon: Calendar },
    { id: 'distance', label: 'Distance', icon: MapPin },
    { id: 'pace', label: 'Pace', icon: Zap },
  ];

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs uppercase tracking-widest text-gray-500">
            Running History
          </h2>
        </div>
        <button 
          onClick={() => navigate(createPageUrl('History'))}
          className="text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
        >
          View All →
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Time Filter */}
        <div className="flex gap-2">
          {timeFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeFilter === filter.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-500 border border-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          <Filter className="w-4 h-4 text-gray-500 mt-1" />
          {sortOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                sortBy === option.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-gray-500 border border-white/10'
              }`}
            >
              <option.icon className="w-3.5 h-3.5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-3 px-1">
        <p className="text-xs text-gray-500">
          Showing {displayRuns.length} of {filteredRuns.length} runs
        </p>
      </div>

      {/* Run List */}
      <AnimatePresence mode="wait">
        {displayRuns.length > 0 ? (
          <div className="space-y-3">
            {displayRuns.map((run, index) => (
              <RunListItem key={run.id} run={run} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 bg-white/5 rounded-2xl border border-white/10"
          >
            <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No runs found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
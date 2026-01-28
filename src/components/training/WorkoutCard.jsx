import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Circle, Zap, MapPin, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function WorkoutCard({ session }) {
  const [expanded, setExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const workoutIcons = {
    easy_run: Zap,
    tempo_run: TrendingUp,
    intervals: Zap,
    long_run: MapPin,
    rest: Circle,
    cross_training: Zap
  };

  const workoutColors = {
    easy_run: 'text-blue-400 bg-blue-500/20',
    tempo_run: 'text-orange-400 bg-orange-500/20',
    intervals: 'text-red-400 bg-red-500/20',
    long_run: 'text-purple-400 bg-purple-500/20',
    rest: 'text-gray-400 bg-gray-500/20',
    cross_training: 'text-green-400 bg-green-500/20'
  };

  const Icon = workoutIcons[session.workout_type] || Zap;
  const colorClass = workoutColors[session.workout_type] || 'text-white bg-white/5';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleFeedback = async (feedback) => {
    setIsUpdating(true);
    try {
      await base44.entities.WorkoutSession.update(session.id, { feedback });
      queryClient.invalidateQueries(['workout-sessions']);
    } catch (error) {
      console.error('Failed to update feedback:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isPast = new Date(session.scheduled_date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${
        session.completed
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            {session.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-medium text-white capitalize">
                  {session.workout_type.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-400">{formatDate(session.scheduled_date)}</p>
              </div>
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {session.planned_distance > 0 && (
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                <span>{session.planned_distance}km</span>
                {session.planned_pace > 0 && (
                  <span>@{session.planned_pace.toFixed(1)} min/km</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Instructions */}
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Instructions</p>
                <p className="text-sm text-gray-300">{session.instructions}</p>
              </div>

              {/* Warm-up & Cool-down */}
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Tips</p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>🔥 <strong>Warm-up:</strong> 5-10 min easy jog + dynamic stretches</p>
                  <p>❄️ <strong>Cool-down:</strong> 5 min easy walk + static stretches</p>
                </div>
              </div>

              {/* Actions */}
              {!session.completed && !isPast && (
                <Link to={createPageUrl('ActiveRun')}>
                  <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors">
                    Start Workout
                  </button>
                </Link>
              )}

              {session.completed && !session.feedback && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    How was this workout?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleFeedback('too_easy')}
                      disabled={isUpdating}
                      className="py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
                    >
                      Too Easy
                    </button>
                    <button
                      onClick={() => handleFeedback('just_right')}
                      disabled={isUpdating}
                      className="py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                    >
                      Just Right
                    </button>
                    <button
                      onClick={() => handleFeedback('too_hard')}
                      disabled={isUpdating}
                      className="py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      Too Hard
                    </button>
                  </div>
                </div>
              )}

              {session.feedback && (
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400">
                    You rated this: <span className="text-white font-medium">{session.feedback.replace('_', ' ')}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
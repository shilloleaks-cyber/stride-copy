import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Circle, Zap, MapPin, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
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
    cross_training: Zap,
  };

  // Icon accent colors per workout type
  const iconColors = {
    easy_run: 'rgba(120,180,255,0.9)',
    tempo_run: 'rgba(255,160,60,0.9)',
    intervals: 'rgba(255,90,90,0.9)',
    long_run: '#8A2BE2',
    rest: 'rgba(255,255,255,0.3)',
    cross_training: '#BFFF00',
  };

  const iconBgs = {
    easy_run: 'rgba(120,180,255,0.12)',
    tempo_run: 'rgba(255,160,60,0.12)',
    intervals: 'rgba(255,90,90,0.12)',
    long_run: 'rgba(138,43,226,0.15)',
    rest: 'rgba(255,255,255,0.06)',
    cross_training: 'rgba(191,255,0,0.12)',
  };

  const Icon = workoutIcons[session.workout_type] || Zap;
  const iconColor = iconColors[session.workout_type] || 'rgba(255,255,255,0.5)';
  const iconBg = iconBgs[session.workout_type] || 'rgba(255,255,255,0.06)';

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
    await base44.entities.WorkoutSession.update(session.id, { feedback });
    queryClient.invalidateQueries(['workout-sessions']);
    setIsUpdating(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isPast = session.scheduled_date < todayStr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: session.completed ? 'rgba(191,255,0,0.06)' : 'rgba(255,255,255,0.04)',
        border: session.completed
          ? '1px solid rgba(191,255,0,0.20)'
          : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ background: session.completed ? 'rgba(191,255,0,0.10)' : iconBg }}
          >
            {session.completed ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: '#BFFF00' }} />
            ) : (
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold text-white capitalize">
                  {session.workout_type.replace('_', ' ')}
                </h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {formatDate(session.scheduled_date)}
                </p>
              </div>
              {expanded
                ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
                : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
              }
            </div>

            {session.planned_distance > 0 && (
              <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span style={{ color: '#BFFF00', fontWeight: 700 }}>{session.planned_distance}km</span>
                {session.planned_pace > 0 && (
                  <span>@ {session.planned_pace.toFixed(1)} min/km</span>
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
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="p-4 pt-3 space-y-3">
              {/* Instructions */}
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Instructions
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{session.instructions}</p>
              </div>

              {/* Tips */}
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Tips</p>
                <div className="space-y-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <p>🔥 <strong className="text-white">Warm-up:</strong> 5-10 min easy jog + dynamic stretches</p>
                  <p>❄️ <strong className="text-white">Cool-down:</strong> 5 min easy walk + static stretches</p>
                </div>
              </div>

              {/* Start button */}
              {!session.completed && !isPast && (
                <Link to={createPageUrl('ActiveRun')}>
                  <button
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity"
                    style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                  >
                    Start Workout
                  </button>
                </Link>
              )}

              {/* Feedback buttons */}
              {session.completed && !session.feedback && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    How was this workout?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'too_easy', label: 'Too Easy', color: 'rgba(120,180,255,0.15)', text: 'rgba(120,180,255,0.9)' },
                      { key: 'just_right', label: 'Just Right', color: 'rgba(191,255,0,0.12)', text: '#BFFF00' },
                      { key: 'too_hard', label: 'Too Hard', color: 'rgba(255,90,90,0.12)', text: 'rgba(255,90,90,0.9)' },
                    ].map(({ key, label, color, text }) => (
                      <button
                        key={key}
                        onClick={() => handleFeedback(key)}
                        disabled={isUpdating}
                        className="py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
                        style={{ background: color, color: text }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback display */}
              {session.feedback && (
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    You rated this:{' '}
                    <span className="font-semibold" style={{ color: '#BFFF00' }}>
                      {session.feedback.replace('_', ' ')}
                    </span>
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
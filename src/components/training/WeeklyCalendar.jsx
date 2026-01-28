import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

export default function WeeklyCalendar({ sessions, startDate }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  const getSessionForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions.find(s => s.scheduled_date === dateStr);
  };

  const getWorkoutTypeColor = (type) => {
    const colors = {
      easy_run: 'bg-blue-500/20 text-blue-400',
      tempo_run: 'bg-orange-500/20 text-orange-400',
      intervals: 'bg-red-500/20 text-red-400',
      long_run: 'bg-purple-500/20 text-purple-400',
      rest: 'bg-gray-500/20 text-gray-400',
      cross_training: 'bg-green-500/20 text-green-400'
    };
    return colors[type] || 'bg-white/5 text-gray-400';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((date, index) => {
        const session = getSessionForDate(date);
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative aspect-square rounded-2xl border overflow-hidden ${
              isToday
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="p-2 h-full flex flex-col">
              <div className="text-center mb-1">
                <p className="text-xs text-gray-500">{days[date.getDay()]}</p>
                <p className={`text-sm font-medium ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                  {date.getDate()}
                </p>
              </div>

              {session ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  {session.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                  ) : isPast ? (
                    <Circle className="w-6 h-6 text-gray-600 mb-1" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${
                      session.workout_type === 'rest' ? 'bg-gray-500' : 'bg-emerald-500'
                    }`} />
                  )}
                  {session.planned_distance > 0 && (
                    <p className="text-xs text-gray-400 text-center mt-1">
                      {session.planned_distance}km
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <Circle className="w-4 h-4 text-gray-700" />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-7 gap-1.5">
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
            className="relative aspect-square rounded-2xl overflow-hidden"
            style={{
              background: isToday ? 'rgba(191,255,0,0.08)' : 'rgba(255,255,255,0.04)',
              border: isToday
                ? '1px solid rgba(191,255,0,0.35)'
                : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isToday ? '0 0 12px rgba(191,255,0,0.12)' : 'none',
            }}
          >
            <div className="p-2 h-full flex flex-col">
              <div className="text-center mb-1">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{days[date.getDay()]}</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: isToday ? '#BFFF00' : 'rgba(255,255,255,0.85)' }}
                >
                  {date.getDate()}
                </p>
              </div>

              {session ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  {session.completed ? (
                    <CheckCircle2 className="w-5 h-5 mb-1" style={{ color: '#BFFF00' }} />
                  ) : isPast ? (
                    <Circle className="w-5 h-5 mb-1" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  ) : (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: session.workout_type === 'rest'
                          ? 'rgba(255,255,255,0.25)'
                          : '#8A2BE2',
                        boxShadow: session.workout_type !== 'rest' ? '0 0 6px rgba(138,43,226,0.6)' : 'none',
                      }}
                    />
                  )}
                  {session.planned_distance > 0 && (
                    <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {session.planned_distance}km
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <Circle className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
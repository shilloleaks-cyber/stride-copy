import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeeklyCalendar from '@/components/training/WeeklyCalendar';
import CreateGoalDialog from '@/components/training/CreateGoalDialog';
import WorkoutCard from '@/components/training/WorkoutCard';
import ActiveGoalCard from '@/components/training/ActiveGoalCard';
import EmptyGoalState from '@/components/training/EmptyGoalState';
import WeekSwitcher from '@/components/training/WeekSwitcher';

export default function Training() {
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['training-goals', user?.email],
    queryFn: () => base44.entities.TrainingGoal.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const activeGoal = goals.find(g => g.status === 'active');

  const { data: sessions = [] } = useQuery({
    queryKey: ['workout-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // Compute week boundaries (normalized to midnight)
  const { startOfWeek, endOfWeek } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + selectedWeek * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startOfWeek: start, endOfWeek: end };
  }, [selectedWeek]);

  const weekSessions = useMemo(() => {
    return sessions
      .filter(s => {
        const sessionDate = new Date(s.scheduled_date);
        return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
      })
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  }, [sessions, startOfWeek, endOfWeek]);

  const completedThisWeek = weekSessions.filter(s => s.completed).length;
  const totalThisWeek = weekSessions.length;
  const weekProgress = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Training</p>
            <h1 className="text-3xl font-bold text-white">Your Plan</h1>
          </div>
          <button
            onClick={() => setShowCreateGoal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>

        {activeGoal ? (
          <ActiveGoalCard
            goal={activeGoal}
            completedThisWeek={completedThisWeek}
            totalThisWeek={totalThisWeek}
            weekProgress={weekProgress}
          />
        ) : (
          <EmptyGoalState onCreateGoal={() => setShowCreateGoal(true)} />
        )}
      </div>

      {/* Weekly Calendar */}
      {activeGoal && (
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>This Week</h2>
            <WeekSwitcher
              selectedWeek={selectedWeek}
              onPrev={() => setSelectedWeek(w => w - 1)}
              onNext={() => setSelectedWeek(w => w + 1)}
            />
          </div>
          <WeeklyCalendar sessions={weekSessions} startDate={startOfWeek} />
        </div>
      )}

      {/* Upcoming Workouts */}
      {activeGoal && weekSessions.length > 0 && (
        <div className="px-6">
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Workouts</h2>
          <div className="space-y-3">
            {weekSessions.map(session => (
                <WorkoutCard key={session.id} session={session} />
                ))}
          </div>
        </div>
      )}

      {/* Create Goal Dialog */}
      <CreateGoalDialog
        isOpen={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        user={user}
      />
    </div>
  );
}
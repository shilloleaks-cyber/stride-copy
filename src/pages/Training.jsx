import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeeklyCalendar from '@/components/training/WeeklyCalendar';
import CreateGoalDialog from '@/components/training/CreateGoalDialog';
import WorkoutCard from '@/components/training/WorkoutCard';
import ActiveGoalCard from '@/components/training/ActiveGoalCard';
import EmptyGoalState from '@/components/training/EmptyGoalState';
import WeekSwitcher from '@/components/training/WeekSwitcher';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Training() {
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'pause', goal }
  const [isActioning, setIsActioning] = useState(false);
  const queryClient = useQueryClient();

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

  // Fetch plans for active goal only
  const { data: activePlans = [] } = useQuery({
    queryKey: ['training-plans', activeGoal?.id],
    queryFn: () => base44.entities.TrainingPlan.filter({ goal_id: activeGoal.id, user_email: user.email }),
    enabled: !!activeGoal?.id,
  });

  const activePlan = activePlans.find(p => p.status === 'active') || activePlans[0];

  // Fetch sessions scoped strictly to the active plan only
  const { data: sessions = [] } = useQuery({
    queryKey: ['workout-sessions', activePlan?.id],
    queryFn: () => base44.entities.WorkoutSession.filter({ plan_id: activePlan.id, user_email: user.email }),
    enabled: !!activePlan?.id,
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

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsActioning(true);
    try {
      if (confirmAction.type === 'delete') {
        // Fetch fresh from server to ensure no stale/missed records
        const plans = await base44.entities.TrainingPlan.filter({ goal_id: confirmAction.goal.id, user_email: user.email });
        for (const p of plans) {
          const planSessions = await base44.entities.WorkoutSession.filter({ plan_id: p.id, user_email: user.email });
          for (const s of planSessions) {
            await base44.entities.WorkoutSession.delete(s.id);
          }
          await base44.entities.TrainingPlan.delete(p.id);
        }
        await base44.entities.TrainingGoal.delete(confirmAction.goal.id);
      } else if (confirmAction.type === 'pause') {
        await base44.entities.TrainingGoal.update(confirmAction.goal.id, { status: 'paused' });
      }
      queryClient.invalidateQueries({ queryKey: ['training-goals', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
    } finally {
      setIsActioning(false);
      setConfirmAction(null);
    }
  };

  const completedTotal = sessions.filter(s => s.completed).length;
  const totalSessions = sessions.length;

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
            completedTotal={completedTotal}
            totalSessions={totalSessions}
            onPause={() => setConfirmAction({ type: 'pause', goal: activeGoal })}
            onDelete={() => setConfirmAction({ type: 'delete', goal: activeGoal })}
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

      {/* All Plan Workouts */}
      {activeGoal && (
        <div className="px-6">
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Workouts</h2>
          {sessions.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No workouts in this plan yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...sessions].sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).map(session => (
                <WorkoutCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Goal Dialog */}
      <CreateGoalDialog
        isOpen={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        user={user}
        existingActiveGoal={activeGoal}
      />

      {/* Confirm pause / delete */}
      <ConfirmDialog
        open={!!confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        loading={isActioning}
        title={confirmAction?.type === 'delete' ? 'Delete Goal?' : 'Pause Goal?'}
        description={
          confirmAction?.type === 'delete'
            ? 'This will permanently delete your training goal and its generated plan. This cannot be undone.'
            : 'Your goal will be paused. You can create a new goal anytime.'
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Pause'}
        confirmVariant={confirmAction?.type === 'delete' ? 'destructive' : 'primary'}
      />
    </div>
  );
}
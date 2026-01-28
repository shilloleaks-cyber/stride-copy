import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, Target, TrendingUp, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeeklyCalendar from '@/components/training/WeeklyCalendar';
import CreateGoalDialog from '@/components/training/CreateGoalDialog';
import WorkoutCard from '@/components/training/WorkoutCard';

export default function Training() {
  const [user, setUser] = useState(null);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.log('Could not load user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: goals = [] } = useQuery({
    queryKey: ['training-goals', user?.email],
    queryFn: () => base44.entities.TrainingGoal.filter({ user_email: user.email }),
    enabled: !!user
  });

  const activeGoal = goals.find(g => g.status === 'active');

  const { data: sessions = [] } = useQuery({
    queryKey: ['workout-sessions', user?.email],
    queryFn: () => base44.entities.WorkoutSession.filter({ user_email: user.email }),
    enabled: !!user
  });

  // Get current week's sessions
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + selectedWeek * 7);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_date);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });

  const completedThisWeek = weekSessions.filter(s => s.completed).length;
  const totalThisWeek = weekSessions.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Training</p>
            <h1 className="text-3xl font-light mt-1">Your Plan</h1>
          </div>
          <Button
            onClick={() => setShowCreateGoal(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>

        {/* Active Goal Card */}
        {activeGoal ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-3xl p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <p className="text-xs uppercase tracking-widest text-purple-400">Active Goal</p>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-1">
                  {activeGoal.goal_type.replace('_', ' ').toUpperCase()}
                </h2>
                {activeGoal.target_value && (
                  <p className="text-gray-400">
                    Target: {activeGoal.target_value}
                    {activeGoal.goal_type.includes('pace') ? ' min/km' : 'km'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Target Date</p>
                <p className="text-lg font-medium text-white">
                  {new Date(activeGoal.target_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-sm font-medium text-white">
                  {completedThisWeek} / {totalThisWeek} workouts
                </p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedThisWeek / totalThisWeek) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center mb-6"
          >
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Active Goal</h3>
            <p className="text-gray-400 mb-4">
              Create a training goal to get your personalized plan
            </p>
            <Button
              onClick={() => setShowCreateGoal(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create Goal
            </Button>
          </motion.div>
        )}
      </div>

      {/* Weekly Calendar */}
      {activeGoal && (
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-widest text-gray-500">This Week</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWeek(w => w - 1)}
                className="px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:bg-white/10"
              >
                ←
              </button>
              <span className="text-sm text-gray-400">
                {selectedWeek === 0 ? 'Current' : selectedWeek > 0 ? `+${selectedWeek}w` : `${selectedWeek}w`}
              </span>
              <button
                onClick={() => setSelectedWeek(w => w + 1)}
                className="px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:bg-white/10"
              >
                →
              </button>
            </div>
          </div>
          <WeeklyCalendar sessions={weekSessions} startDate={startOfWeek} />
        </div>
      )}

      {/* Upcoming Workouts */}
      {activeGoal && weekSessions.length > 0 && (
        <div className="px-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Workouts</h2>
          <div className="space-y-3">
            {weekSessions
              .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
              .map(session => (
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
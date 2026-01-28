import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, TrendingUp, MapPin, Flame, Clock, Heart, Activity, Trophy, Target, Coins, Zap, Award } from 'lucide-react';
import StatCard from '@/components/running/StatCard';
import WeeklyChart from '@/components/running/WeeklyChart';
import RunListItem from '@/components/running/RunListItem';
import LevelBadge from '@/components/running/LevelBadge';
import DailyQuestCard from '@/components/quest/DailyQuestCard';
import confetti from 'canvas-confetti';

export default function Home() {
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [user, setUser] = useState(null);

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => base44.entities.Run.list('-start_time', 100),
  });

  // Load user data
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

  const completedRuns = runs.filter(r => r.status === 'completed');
  const recentRuns = completedRuns.slice(0, 5);

  // Today's distance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRuns = completedRuns.filter(r => {
    const runDate = new Date(r.start_time);
    runDate.setHours(0, 0, 0, 0);
    return runDate.getTime() === today.getTime();
  });
  const todayDistance = todayRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);

  // Current streak calculation
  const calculateStreak = () => {
    if (completedRuns.length === 0) return 0;
    
    const sortedRuns = [...completedRuns].sort((a, b) => 
      new Date(b.start_time) - new Date(a.start_time)
    );
    
    const uniqueDays = new Set();
    sortedRuns.forEach(run => {
      const date = new Date(run.start_time);
      date.setHours(0, 0, 0, 0);
      uniqueDays.add(date.getTime());
    });
    
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    let streak = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      const expectedDay = today.getTime() - (i * oneDayMs);
      
      if (Math.abs(currentDay - expectedDay) < oneDayMs / 2) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };
  const currentStreak = calculateStreak();

  // This week's average pace
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekRuns = completedRuns.filter(r => new Date(r.start_time) >= oneWeekAgo);
  const weekAvgPace = weekRuns.length > 0
    ? weekRuns.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / weekRuns.length
    : 0;

  // Best pace (personal record)
  const bestPace = completedRuns.length > 0
    ? Math.min(...completedRuns.map(r => r.pace_min_per_km || 999).filter(p => p > 0))
    : 0;

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Streak milestone animation logic
  useEffect(() => {
    if (currentStreak === 0) return;

    const milestones = [
      { days: 3, key: 'streak_3_done', text: '3 Day Streak!' },
      { days: 7, key: 'streak_7_done', text: '7 Day Streak!' },
      { days: 14, key: 'streak_14_done', text: '14 Day Beast Mode!' }
    ];

    const milestone = milestones.find(m => m.days === currentStreak);
    if (!milestone) return;

    const isDone = localStorage.getItem(milestone.key);
    if (isDone) return;

    // Mark as done
    localStorage.setItem(milestone.key, 'true');
    setStreakMilestone(milestone);
    setShowStreakAnimation(true);

    // Play confetti
    if (currentStreak === 3) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b']
      });
    } else if (currentStreak === 7) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#ef4444']
      });
    } else if (currentStreak === 14) {
      const duration = 1000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }

    // Hide animation after delay
    setTimeout(() => {
      setShowStreakAnimation(false);
    }, 3000);
  }, [currentStreak]);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-gray-500 text-sm uppercase tracking-widest">Welcome back</p>
          <h1 className="text-3xl font-light mt-1">Your Running</h1>
        </motion.div>
      </div>

      {/* Quick Start Button */}
      <div className="px-6 mb-8">
        <Link to={createPageUrl('ActiveRun')}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-3xl p-6 shadow-2xl neon-glow"
            style={{ background: 'linear-gradient(135deg, #BFFF00 0%, #8A2BE2 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: '#0A0A0A', opacity: 0.8 }}>Ready to run?</p>
                <h2 className="text-2xl font-semibold" style={{ color: '#0A0A0A' }}>Start New Run</h2>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(10, 10, 10, 0.2)' }}>
                <Play className="w-8 h-8 ml-1" style={{ color: '#0A0A0A' }} fill="#0A0A0A" />
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          </motion.div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-8">
        {/* Today Section */}
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Today</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard 
            label="Distance" 
            value={todayDistance.toFixed(1)} 
            unit="km" 
            icon={MapPin}
            accent
          />
          <motion.div
            animate={showStreakAnimation ? {
              scale: [1, 1.05, 1],
              boxShadow: currentStreak >= 14 
                ? ['0 0 0 0 rgba(249, 115, 22, 0)', '0 0 30px 10px rgba(249, 115, 22, 0.6)', '0 0 0 0 rgba(249, 115, 22, 0)']
                : currentStreak >= 7
                ? ['0 0 0 0 rgba(249, 115, 22, 0)', '0 0 20px 5px rgba(249, 115, 22, 0.5)', '0 0 0 0 rgba(249, 115, 22, 0)']
                : ['0 0 0 0 rgba(249, 115, 22, 0)', '0 0 15px 3px rgba(249, 115, 22, 0.4)', '0 0 0 0 rgba(249, 115, 22, 0)']
            } : {}}
            transition={{ duration: 0.6, repeat: showStreakAnimation ? 1 : 0 }}
          >
            <StatCard 
              label="Streak" 
              value={currentStreak} 
              unit="days"
              icon={Flame}
            />
          </motion.div>
        </div>

        {/* Streak Milestone Popup */}
        <AnimatePresence>
          {showStreakAnimation && streakMilestone && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-2xl"
                >
                  🔥
                </motion.span>
                <span className="font-bold text-lg">{streakMilestone.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Section */}
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Performance</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to={createPageUrl('PaceHistory')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard 
                label="Avg Pace (Week)" 
                value={formatPace(weekAvgPace)} 
                unit="/km"
                icon={Zap}
              />
            </motion.div>
          </Link>
          <StatCard 
            label="Best Pace" 
            value={formatPace(bestPace)} 
            unit="/km"
            icon={Award}
            accent
          />
        </div>

        {/* Game Section */}
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Game</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {user && (
            <LevelBadge
              level={user.current_level || 0}
              totalCoins={user.total_coins || 0}
            />
          )}
          <Link to={createPageUrl('Wallet')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard 
                label="Coin Balance" 
                value={user?.total_coins || 0} 
                unit="coins"
                icon={Coins}
                accent
              />
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Daily Quests */}
      <div className="px-6 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Daily Quests</h2>
        {user && <DailyQuestCard user={user} />}
      </div>

      {/* Quick Links */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Leaderboard')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">อันดับ</p>
                <p className="text-xs text-gray-400">ดูอันดับผู้เล่น</p>
              </div>
            </motion.div>
          </Link>
          <Link to={createPageUrl('Challenges')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Challenges</p>
                <p className="text-xs text-gray-400">เข้าร่วมกิจกรรม</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="px-6 mb-8">
        <WeeklyChart runs={completedRuns} />
      </div>

      {/* Recent Runs */}
      <div className="px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Recent Runs</h2>
          <Link to={createPageUrl('History')} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            See all
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentRuns.length > 0 ? (
          <div className="space-y-4">
            {recentRuns.map((run, index) => (
              <RunListItem key={run.id} run={run} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
          >
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No runs yet</p>
            <p className="text-sm text-gray-600 mt-1">Start your first run to see it here</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
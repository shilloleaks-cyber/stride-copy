import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Share2, Trash2, MapPin, Clock, Zap, Heart, 
  Flame, TrendingUp, Award, Edit2, X, Save, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import RunMap from '@/components/running/RunMap';
import ShareRunDialog from '@/components/running/ShareRunDialog';
import RunInsights from '@/components/running/RunInsights';
import PaceChart from '@/components/running/PaceChart';
import SpeedChart from '@/components/running/SpeedChart';
import PaceConsistencyScore from '@/components/running/PaceConsistencyScore';
import PerKilometerBreakdown from '@/components/running/PerKilometerBreakdown';
import AIFormInsights from '@/components/running/AIFormInsights';

const motivationQuotes = [
  "No excuses. Just progress.",
  "You showed up. That's power.",
  "Small run. Big mindset.",
  "Built different today.",
  "Step by step. Beast mode loading.",
  "Every step counts. Every breath matters.",
  "You're lapping everyone on the couch.",
  "The finish line was just the start.",
  "You didn't quit. Respect.",
  "Consistency beats motivation.",
];

const rareQuotes = [
  "You're not chasing goals. You're becoming them.",
  "Main character energy unlocked.",
  "Discipline just leveled up.",
  "The grind doesn't stop. Neither do you.",
  "You're writing your own comeback story.",
];

export default function RunDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const runId = urlParams.get('id');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Quote system
  const [isRareQuote] = useState(() => Math.random() < 0.03);
  const [randomQuote] = useState(() => {
    const quotes = isRareQuote ? rareQuotes : motivationQuotes;
    return quotes[Math.floor(Math.random() * quotes.length)];
  });
  
  // Rare coin bonus (5% chance)
  const [hasRareBonus] = useState(() => Math.random() < 0.05);
  const [rareBonusAmount] = useState(() => parseFloat((Math.random() * 5 + 1).toFixed(2)));
  
  // Animated coin counter
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [showRareBonus, setShowRareBonus] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  
  // Fetch user's recent runs for streak calculation
  const { data: recentRuns } = useQuery({
    queryKey: ['recentRuns', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const runs = await base44.entities.Run.filter({ 
        created_by: currentUser.email,
        status: 'completed'
      });
      return runs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);
    },
    enabled: !!currentUser,
  });

  const { data: run, isLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: async () => {
      const runs = await base44.entities.Run.filter({ id: runId });
      return runs[0];
    },
    enabled: !!runId,
  });
  
  // Calculate coin breakdown
  const calculateCoins = () => {
    if (!run) return { total: 0, breakdown: {} };
    
    const distance = run.distance_km || 0;
    const pace = run.pace_min_per_km || 0;
    const avgPace = 6.0; // Reference pace
    
    // Distance bonus: 10 coins per km
    const distanceBonus = parseFloat((distance * 10).toFixed(2));
    
    // Pace bonus: bonus for running faster than average
    const paceBonus = pace > 0 && pace < avgPace 
      ? parseFloat(((avgPace - pace) * 2).toFixed(2))
      : 0;
    
    // Streak bonus (if user has consecutive runs)
    const streak = recentRuns?.length || 0;
    const streakBonus = streak > 1 ? parseFloat((streak * 1.5).toFixed(2)) : 0;
    
    // Daily bonus
    const dailyBonus = 1.25;
    
    let total = distanceBonus + paceBonus + streakBonus + dailyBonus;
    
    // Add rare bonus if triggered
    if (hasRareBonus) {
      total += rareBonusAmount;
    }
    
    // Combo bonus (level up + streak > 3)
    const userLeveledUp = currentUser?.current_level > (currentUser?.previous_level || 0);
    const comboBonus = userLeveledUp && streak > 3 ? 2.22 : 0;
    if (comboBonus > 0) total += comboBonus;
    
    return {
      total: parseFloat(total.toFixed(2)),
      breakdown: {
        distance: distanceBonus,
        pace: paceBonus,
        streak: streakBonus,
        daily: dailyBonus,
        rare: hasRareBonus ? rareBonusAmount : 0,
        combo: comboBonus,
      },
      hasCombo: comboBonus > 0,
      streak,
    };
  };
  
  const coinData = calculateCoins();
  
  // Animate coin count-up
  useEffect(() => {
    if (!run || displayedCoins > 0) return;
    
    const duration = 1500;
    const steps = 60;
    const increment = coinData.total / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      
      if (step >= steps) {
        setDisplayedCoins(coinData.total);
        clearInterval(timer);
        
        // Show rare bonus after main animation
        if (hasRareBonus) {
          setTimeout(() => setShowRareBonus(true), 300);
        }
      } else {
        setDisplayedCoins(parseFloat(current.toFixed(2)));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [run, coinData.total, hasRareBonus]);
  
  // Update notes when run loads
  useEffect(() => {
    if (run?.notes) setNotes(run.notes);
  }, [run]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Run.update(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['run', runId]);
      setEditingNotes(false);
    }
  });

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await base44.entities.Run.delete(runId);
      setIsDeleteSheetOpen(false);
      navigate(createPageUrl('History'));
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handleShareToFeed = async () => {
    if (isSharing || !currentUser) return;
    setIsSharing(true);
    try {
      await base44.entities.Post.create({
        content: `เพิ่งวิ่งเสร็จ ${run.distance_km?.toFixed(2)} กิโลเมตร! 🏃‍♂️💪`,
        run_id: run.id,
        run_data: {
          distance_km: run.distance_km,
          duration_seconds: run.duration_seconds,
          pace_min_per_km: run.pace_min_per_km,
          calories_burned: run.calories_burned,
          avg_heart_rate: run.avg_heart_rate,
        },
        author_name: currentUser.full_name || 'Runner',
        author_email: currentUser.email,
        author_image: currentUser.profile_image,
        likes: [],
        comments_count: 0,
      });
      toast.success('แชร์ไปยังฟีดเรียบร้อย!');
      setIsSharing(false);
    } catch (error) {
      console.error('Error sharing to feed:', error);
      toast.error('ไม่สามารถแชร์ได้');
      setIsSharing(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace) => {
    if (!pace || pace === 0) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-6">
        <p className="text-gray-400 mb-4">Run not found</p>
        <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('History'))}
          className="w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center border transition-all"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(138,43,226,0.1) inset'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShareToFeed}
            disabled={isSharing}
            className="w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center border transition-all disabled:opacity-50"
            style={{ 
              backgroundColor: 'rgba(191,255,0,0.12)',
              borderColor: 'rgba(191,255,0,0.25)',
              color: '#BFFF00',
              boxShadow: '0 0 20px rgba(191,255,0,0.15)'
            }}
            title="Share to Feed"
          >
            <Users className="w-5 h-5" />
          </button>
          <ShareRunDialog 
            run={run}
            trigger={
              <button className="w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center border transition-all"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 0 0 1px rgba(138,43,226,0.1) inset'
                }}
              >
                <Share2 className="w-5 h-5" />
              </button>
            }
          />
          <button 
            onClick={() => setIsDeleteSheetOpen(true)}
            className="w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center border transition-all"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(138,43,226,0.1) inset'
            }}
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Date & Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-6 pb-4"
      >
        <p className="text-sm uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          COMPLETED RUN
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
          {run.start_time && format(new Date(run.start_time), 'EEEE, MMMM d')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {run.start_time && format(new Date(run.start_time), 'h:mm a')}
        </p>
      </motion.div>

      {/* Motivation Quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="px-5 pb-3"
      >
        <div 
          className="rounded-2xl backdrop-blur-sm border px-5 py-4 text-center relative overflow-hidden"
          style={{ 
            backgroundColor: isRareQuote ? 'rgba(138,43,226,0.15)' : 'rgba(138,43,226,0.08)',
            borderColor: isRareQuote ? 'rgba(138,43,226,0.4)' : 'rgba(138,43,226,0.2)',
            boxShadow: isRareQuote 
              ? '0 0 40px rgba(138,43,226,0.3), 0 0 0 1px rgba(138,43,226,0.15) inset'
              : '0 0 30px rgba(138,43,226,0.15), 0 0 0 1px rgba(138,43,226,0.08) inset'
          }}
        >
          {isRareQuote && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            </div>
          )}
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>
            {isRareQuote ? '💎 RARE VIBE' : '🔥 Today\'s vibe'}
          </p>
          <p 
            className="text-base font-medium leading-relaxed"
            style={{ 
              color: isRareQuote ? '#C084FC' : '#BFFF00',
              textShadow: isRareQuote 
                ? '0 0 25px rgba(192,132,252,0.5)' 
                : '0 0 20px rgba(191,255,0,0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            "{randomQuote}"
          </p>
        </div>
      </motion.div>

      {/* Coin Reward Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="px-5 pb-3"
      >
        <div 
          className="rounded-2xl backdrop-blur-sm border p-5 relative overflow-hidden"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(191,255,0,0.2)',
            boxShadow: '0 0 30px rgba(191,255,0,0.15), 0 0 0 1px rgba(191,255,0,0.08) inset'
          }}
        >
          {/* Rare Bonus Overlay */}
          {showRareBonus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(138,43,226,0.3)',
                border: '1px solid rgba(138,43,226,0.5)',
                boxShadow: '0 0 20px rgba(138,43,226,0.4)'
              }}
            >
              <p className="text-xs font-bold" style={{ color: '#C084FC' }}>
                💎 BONUS +{rareBonusAmount.toFixed(2)}
              </p>
            </motion.div>
          )}
          
          {/* Combo Banner */}
          {coinData.hasCombo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, type: 'spring' }}
              className="absolute top-3 left-3 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(191,255,0,0.2)',
                border: '1px solid rgba(191,255,0,0.4)',
                boxShadow: '0 0 20px rgba(191,255,0,0.3)'
              }}
            >
              <p className="text-xs font-bold" style={{ color: '#BFFF00' }}>
                ⚡ COMBO +{coinData.breakdown.combo}
              </p>
            </motion.div>
          )}

          <div className="text-center mb-5 mt-8">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Coins Earned
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">🪙</span>
              <motion.p
                className="text-5xl font-black"
                style={{ 
                  color: '#BFFF00',
                  textShadow: '0 0 30px rgba(191,255,0,0.5)'
                }}
                key={displayedCoins}
              >
                {displayedCoins.toFixed(2)}
              </motion.p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <div 
              className="h-px w-full mb-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            />
            
            <div className="flex justify-between items-center py-1.5">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Distance</p>
              <p className="text-sm font-bold" style={{ color: '#BFFF00' }}>
                +{coinData.breakdown.distance.toFixed(2)}
              </p>
            </div>
            
            {coinData.breakdown.pace > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Pace</p>
                <p className="text-sm font-bold" style={{ color: '#BFFF00' }}>
                  +{coinData.breakdown.pace.toFixed(2)}
                </p>
              </div>
            )}
            
            {coinData.breakdown.streak > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Streak {coinData.streak > 1 ? `(${coinData.streak}x)` : ''}
                </p>
                <p className="text-sm font-bold" style={{ color: '#BFFF00' }}>
                  +{coinData.breakdown.streak.toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center py-1.5">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Daily</p>
              <p className="text-sm font-bold" style={{ color: '#BFFF00' }}>
                +{coinData.breakdown.daily.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Route Map */}
      {run.route_points && run.route_points.length >= 2 ? (
        <div className="px-5 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Route</h2>
          <div className="h-56 rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <RunMap 
              routeCoordinates={run.route_points}
              currentPosition={null}
              isActive={false}
              showFullRoute={true}
              enableZoom={true}
            />
          </div>
        </div>
      ) : (
        <div className="px-5 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Route</h2>
          <div 
            className="rounded-2xl p-8 text-center border"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p style={{ color: 'rgba(255,255,255,0.50)' }}>Route not available for this run</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>GPS tracking was not enabled during this run</p>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="px-5 mb-4">
        <div 
          className="rounded-2xl backdrop-blur-sm border p-5"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(138,43,226,0.08) inset'
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Distance</p>
              <p className="text-3xl font-bold" style={{ color: '#BFFF00' }}>{run.distance_km?.toFixed(2) || '0.00'}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>km</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Duration</p>
              <p className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>{formatDuration(run.duration_seconds)}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>time</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>Pace</p>
              <p className="text-3xl font-bold" style={{ color: '#BFFF00' }}>{formatPace(run.pace_min_per_km)}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>/km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="px-5 mb-4">
        <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="rounded-2xl p-4 border backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(138,43,226,0.06) inset'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.2)' }}>
                <Zap className="w-4 h-4" style={{ color: '#BFFF00' }} />
              </div>
            </div>
            <p className="text-center text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Speed</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="text-center">
                <p className="text-[10px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg</p>
                <p className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>{run.avg_speed_kmh?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Max</p>
                <p className="text-2xl font-bold" style={{ color: '#BFFF00', textShadow: '0 0 15px rgba(191,255,0,0.3)' }}>{run.max_speed_kmh?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>km/h</p>
          </div>

          <div 
            className="rounded-2xl p-4 border backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(138,43,226,0.06) inset'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Heart className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <p className="text-center text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Heart Rate</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="text-center">
                <p className="text-[10px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg</p>
                <p className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>{run.avg_heart_rate || '--'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Max</p>
                <p className="text-2xl font-bold" style={{ color: '#BFFF00', textShadow: '0 0 15px rgba(191,255,0,0.3)' }}>{run.max_heart_rate || '--'}</p>
              </div>
            </div>
            <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>bpm</p>
          </div>

          <div 
            className="rounded-2xl p-4 border col-span-2 backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(138,43,226,0.06) inset'
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <p className="text-center text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Calories Burned</p>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1" style={{ color: '#BFFF00', textShadow: '0 0 20px rgba(191,255,0,0.3)' }}>{run.calories_burned || 0}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>kcal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      {run.route_points && run.route_points.length >= 2 && (
        <div className="px-5 mb-4">
          <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Performance Analysis</h2>
          
          {/* Pace Consistency Score */}
          <div className="mb-4">
            <PaceConsistencyScore routePoints={run.route_points} />
          </div>

          {/* Pace Chart */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-400 mb-2">Pace per Kilometer</h3>
            <PaceChart routePoints={run.route_points} avgPace={run.pace_min_per_km} />
          </div>

          {/* Speed Chart */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-400 mb-2">Speed Over Time</h3>
            <SpeedChart routePoints={run.route_points} avgSpeed={run.avg_speed_kmh} />
          </div>

          {/* Per-Kilometer Breakdown */}
          <div>
            <h3 className="text-sm text-gray-400 mb-3">Per-Kilometer Breakdown</h3>
            <PerKilometerBreakdown routePoints={run.route_points} avgHeartRate={run.avg_heart_rate} />
          </div>
        </div>
      )}

      {/* Insights & Tips */}
      <div className="px-5 mb-4">
        <h2 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>Insights & Tips</h2>
        <div className="space-y-4">
          <AIFormInsights run={run} />
          <RunInsights run={run} />
        </div>
      </div>

      {/* Notes */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Notes</h2>
          {!editingNotes && (
            <button 
              onClick={() => {
                setNotes(run.notes || '');
                setEditingNotes(true);
              }}
              className="text-sm flex items-center gap-1"
              style={{ color: '#BFFF00' }}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        
        {editingNotes ? (
          <div 
            className="rounded-2xl p-4 border"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this run feel? Add notes here..."
              className="bg-transparent border-none text-white resize-none min-h-[100px] focus-visible:ring-0"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingNotes(false)}
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => updateMutation.mutate({ notes })}
                className="font-medium"
                style={{ 
                  backgroundColor: '#BFFF00',
                  color: '#0A0A0A'
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="rounded-2xl p-4 border"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            {run.notes ? (
              <p className="whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.75)' }}>{run.notes}</p>
            ) : (
              <p className="italic" style={{ color: 'rgba(255,255,255,0.35)' }}>No notes for this run</p>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteSheetOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/55 z-[99998] flex items-center justify-center p-4"
            onClick={() => !isDeleting && setIsDeleteSheetOpen(false)}
          />
          
          {/* Centered Modal */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="w-full max-w-[340px] bg-[#111] rounded-[20px] p-5 pointer-events-auto"
              style={{ boxShadow: 'none' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-white text-lg font-medium mb-1">Delete run?</h3>
                  <p className="text-gray-400 text-sm">This can't be undone.</p>
                </div>
                <button 
                  onClick={() => !isDeleting && setIsDeleteSheetOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => !isDeleting && setIsDeleteSheetOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 h-12 rounded-full border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 h-12 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  ArrowLeft, Target, Trophy, Calendar, Coins, Check, 
  MapPin, Activity, Flame, ChevronRight, Sparkles, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Challenges() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['myParticipations', currentUser?.email],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const { data: myRuns = [] } = useQuery({
    queryKey: ['myRunsForChallenge', currentUser?.email],
    queryFn: () => base44.entities.Run.filter({ created_by: currentUser?.email, status: 'completed' }),
    enabled: !!currentUser?.email,
  });

  const joinMutation = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.ChallengeParticipant.create({
        challenge_id: challenge.id,
        user_email: currentUser?.email,
        user_name: currentUser?.full_name || 'Runner',
        progress: 0,
        is_completed: false,
        reward_claimed: false,
      });

      // Award coins for joining challenge
      await base44.functions.invoke('awardActivityCoins', {
        activityType: 'challenge_joined',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myParticipations']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success('เข้าร่วม Challenge สำเร็จ! +20 coins');
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ participationId, tokens }) => {
      // Update participation
      await base44.entities.ChallengeParticipant.update(participationId, {
        reward_claimed: true,
      });
      
      // Update user tokens
      const newBalance = (currentUser?.token_balance || 0) + tokens;
      await base44.auth.updateMe({
        token_balance: newBalance,
        total_tokens_earned: (currentUser?.total_tokens_earned || 0) + tokens,
      });
      
      // Create wallet log
      await base44.entities.WalletLog.create({
        user: currentUser?.email,
        amount: tokens,
        type: 'bonus',
        note: 'รางวัล Challenge',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myParticipations']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success('รับรางวัลสำเร็จ!');
    },
  });

  const today = new Date();
  
  const activeChallenges = challenges.filter(c => {
    const endDate = parseISO(c.end_date);
    return c.is_active && endDate >= today;
  });

  const getParticipation = (challengeId) => {
    return participations.find(p => p.challenge_id === challengeId);
  };

  const calculateProgress = (challenge) => {
    const startDate = parseISO(challenge.start_date);
    const endDate = parseISO(challenge.end_date);
    
    const relevantRuns = myRuns.filter(run => {
      const runDate = new Date(run.created_date);
      return isWithinInterval(runDate, { start: startDate, end: endDate });
    });

    switch (challenge.goal_type) {
      case 'distance':
        return relevantRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      case 'runs':
        return relevantRuns.length;
      case 'calories':
        return relevantRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0);
      default:
        return 0;
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'distance': return <MapPin className="w-4 h-4" />;
      case 'runs': return <Activity className="w-4 h-4" />;
      case 'calories': return <Flame className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getGoalUnit = (type) => {
    switch (type) {
      case 'distance': return 'กม.';
      case 'runs': return 'ครั้ง';
      case 'calories': return 'kcal';
      default: return '';
    }
  };

  const myJoinedChallenges = activeChallenges.filter(c => getParticipation(c.id));
  const availableChallenges = activeChallenges.filter(c => !getParticipation(c.id));

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Challenges</h1>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white/5 p-1">
            <TabsTrigger 
              value="active" 
              className="flex-1 data-[state=active]:text-black"
              style={{ 
                backgroundColor: activeTab === 'active' ? '#BFFF00' : 'transparent'
              }}
            >
              กำลังเข้าร่วม ({myJoinedChallenges.length})
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="flex-1 data-[state=active]:text-black"
              style={{ 
                backgroundColor: activeTab === 'available' ? '#BFFF00' : 'transparent'
              }}
            >
              Challenge ใหม่ ({availableChallenges.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="px-6 mt-6 space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : activeTab === 'active' ? (
          myJoinedChallenges.length > 0 ? (
            <AnimatePresence>
              {myJoinedChallenges.map((challenge, index) => {
                const participation = getParticipation(challenge.id);
                const progress = calculateProgress(challenge);
                const progressPercent = Math.min((progress / challenge.goal_value) * 100, 100);
                const isCompleted = progress >= challenge.goal_value;
                const canClaim = isCompleted && !participation?.reward_claimed;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(createPageUrl(`ChallengeDetail?id=${challenge.id}`))}
                    className={`bg-gradient-to-br ${
                      isCompleted ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 neon-border' : 'from-white/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40'
                    } border rounded-2xl p-5 transition-colors cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          challenge.type === 'weekly' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {challenge.type === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> สำเร็จ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-medium">{challenge.reward_tokens}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-1">{challenge.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          {getGoalIcon(challenge.goal_type)}
                          <span>{progress.toFixed(1)} / {challenge.goal_value} {getGoalUnit(challenge.goal_type)}</span>
                        </div>
                        <span className="text-white">{progressPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2 bg-white/10" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>สิ้นสุด {format(parseISO(challenge.end_date), 'd MMM yyyy', { locale: th })}</span>
                      </div>
                      
                      {canClaim && (
                        <Button 
                          onClick={() => claimRewardMutation.mutate({ 
                            participationId: participation.id, 
                            tokens: challenge.reward_tokens 
                          })}
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          รับรางวัล
                        </Button>
                      )}
                      
                      {participation?.reward_claimed && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> รับรางวัลแล้ว
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">คุณยังไม่ได้เข้าร่วม Challenge</p>
              <Button 
                onClick={() => setActiveTab('available')}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                ดู Challenge ที่มี
              </Button>
            </div>
          )
        ) : (
          availableChallenges.length > 0 ? (
            <AnimatePresence>
              {availableChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(createPageUrl(`ChallengeDetail?id=${challenge.id}`))}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      challenge.type === 'weekly' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {challenge.type === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">+{challenge.reward_tokens} RUN</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-1">{challenge.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      {getGoalIcon(challenge.goal_type)}
                      <span>เป้าหมาย: {challenge.goal_value} {getGoalUnit(challenge.goal_type)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(parseISO(challenge.start_date), 'd MMM', { locale: th })} - {format(parseISO(challenge.end_date), 'd MMM yyyy', { locale: th })}</span>
                    </div>
                    
                    <Button 
                      onClick={() => joinMutation.mutate(challenge)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      เข้าร่วม
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">ไม่มี Challenge ใหม่ในขณะนี้</p>
              <p className="text-sm text-gray-600 mt-1">กลับมาเช็คใหม่ในภายหลัง</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
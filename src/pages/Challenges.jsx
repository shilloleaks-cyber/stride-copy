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
import { Progress } from '@/components/ui/progress';
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
      await base44.functions.invoke('awardActivityCoins', { activityType: 'challenge_joined' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myParticipations']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success('เข้าร่วม Challenge สำเร็จ! +20 coins');
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ participationId, tokens }) => {
      await base44.entities.ChallengeParticipant.update(participationId, { reward_claimed: true });
      const newBalance = (currentUser?.token_balance || 0) + tokens;
      await base44.auth.updateMe({
        token_balance: newBalance,
        total_tokens_earned: (currentUser?.total_tokens_earned || 0) + tokens,
      });
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

  const getParticipation = (challengeId) => participations.find(p => p.challenge_id === challengeId);

  const calculateProgress = (challenge) => {
    const startDate = parseISO(challenge.start_date);
    const endDate = parseISO(challenge.end_date);
    const relevantRuns = myRuns.filter(run => {
      const runDate = new Date(run.created_date);
      return isWithinInterval(runDate, { start: startDate, end: endDate });
    });
    switch (challenge.goal_type) {
      case 'distance': return relevantRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      case 'runs': return relevantRuns.length;
      case 'calories': return relevantRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0);
      default: return 0;
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'distance': return <MapPin style={{ width: 14, height: 14 }} />;
      case 'runs': return <Activity style={{ width: 14, height: 14 }} />;
      case 'calories': return <Flame style={{ width: 14, height: 14 }} />;
      default: return <Target style={{ width: 14, height: 14 }} />;
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

  const tabs = [
    { key: 'active', label: `กำลังเข้าร่วม`, count: myJoinedChallenges.length },
    { key: 'available', label: `Challenge ใหม่`, count: availableChallenges.length },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#fff', paddingBottom: 96 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          style={{
            width: 40, height: 40, borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Challenges</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Tabs */}
      <div style={{ margin: '18px 20px 0' }}>
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {tabs.map(({ key, label, count }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  ...(active ? {
                    background: 'rgba(191,255,0,0.10)',
                    border: '1px solid rgba(191,255,0,0.28)',
                    color: '#BFFF00',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'rgba(255,255,255,0.35)',
                  }),
                }}
              >
                {label}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 99,
                  background: active ? 'rgba(191,255,0,0.15)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#BFFF00' : 'rgba(255,255,255,0.3)',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 140, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }} />
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
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(createPageUrl(`ChallengeDetail?id=${challenge.id}`))}
                    style={{
                      borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                      border: isCompleted
                        ? '1px solid rgba(191,255,0,0.25)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: isCompleted
                        ? 'rgba(191,255,0,0.04)'
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: isCompleted ? '0 0 18px rgba(191,255,0,0.07)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                          background: challenge.type === 'weekly' ? 'rgba(100,150,255,0.12)' : 'rgba(138,43,226,0.15)',
                          color: challenge.type === 'weekly' ? 'rgba(130,170,255,0.85)' : 'rgba(180,120,255,0.85)',
                          border: challenge.type === 'weekly' ? '1px solid rgba(100,150,255,0.2)' : '1px solid rgba(138,43,226,0.25)',
                        }}>
                          {challenge.type === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                        </span>
                        {isCompleted && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                            background: 'rgba(191,255,0,0.10)', color: '#BFFF00',
                            border: '1px solid rgba(191,255,0,0.25)',
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}>
                            <Check style={{ width: 10, height: 10 }} /> สำเร็จ
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(212,175,55,0.85)' }}>
                        <Coins style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{challenge.reward_tokens}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{challenge.title}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px', lineHeight: 1.5 }}>{challenge.description}</p>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          {getGoalIcon(challenge.goal_type)}
                          <span>{progress.toFixed(1)} / {challenge.goal_value} {getGoalUnit(challenge.goal_type)}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isCompleted ? '#BFFF00' : 'rgba(255,255,255,0.6)' }}>
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${progressPercent}%`,
                          background: isCompleted ? '#BFFF00' : 'linear-gradient(90deg, rgba(138,43,226,0.8), rgba(191,255,0,0.8))',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                        <Calendar style={{ width: 11, height: 11 }} />
                        <span>สิ้นสุด {format(parseISO(challenge.end_date), 'd MMM yyyy', { locale: th })}</span>
                      </div>

                      {canClaim && (
                        <button
                          onClick={(e) => { e.stopPropagation(); claimRewardMutation.mutate({ participationId: participation.id, tokens: challenge.reward_tokens }); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                            background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)',
                            color: 'rgba(212,175,55,0.95)', cursor: 'pointer',
                          }}
                        >
                          <Gift style={{ width: 13, height: 13 }} />
                          รับรางวัล
                        </button>
                      )}

                      {participation?.reward_claimed && (
                        <span style={{ fontSize: 11, color: 'rgba(191,255,0,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check style={{ width: 11, height: 11 }} /> รับรางวัลแล้ว
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <EmptyState
              icon={Target}
              title="ยังไม่ได้เข้าร่วม Challenge"
              subtitle="เข้าร่วม Challenge เพื่อสะสมคะแนนและรับรางวัล"
              ctaLabel="ดู Challenge ที่มี"
              onCta={() => setActiveTab('available')}
            />
          )
        ) : (
          availableChallenges.length > 0 ? (
            <AnimatePresence>
              {availableChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(createPageUrl(`ChallengeDetail?id=${challenge.id}`))}
                  style={{
                    borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                      background: challenge.type === 'weekly' ? 'rgba(100,150,255,0.12)' : 'rgba(138,43,226,0.15)',
                      color: challenge.type === 'weekly' ? 'rgba(130,170,255,0.85)' : 'rgba(180,120,255,0.85)',
                      border: challenge.type === 'weekly' ? '1px solid rgba(100,150,255,0.2)' : '1px solid rgba(138,43,226,0.25)',
                    }}>
                      {challenge.type === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(191,255,0,0.75)' }}>
                      <Sparkles style={{ width: 13, height: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>+{challenge.reward_tokens} BX</span>
                    </div>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>{challenge.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px', lineHeight: 1.5 }}>{challenge.description}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                      <Calendar style={{ width: 11, height: 11 }} />
                      <span>{format(parseISO(challenge.start_date), 'd MMM', { locale: th })} – {format(parseISO(challenge.end_date), 'd MMM yyyy', { locale: th })}</span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); joinMutation.mutate(challenge); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 12px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                        background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.28)',
                        color: '#BFFF00', cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(191,255,0,0.08)',
                      }}
                    >
                      เข้าร่วม
                      <ChevronRight style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <EmptyState
              icon={Trophy}
              title="ไม่มี Challenge ใหม่"
              subtitle="กลับมาเช็คใหม่เร็วๆ นี้"
            />
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '60px 24px 40px', textAlign: 'center',
        position: 'relative',
      }}
    >
      {/* Subtle radial glow behind icon */}
      <div style={{
        position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,43,226,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 56, height: 56, borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, position: 'relative',
      }}>
        <Icon style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.25)' }} />
      </div>

      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: '0 0 8px' }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0, lineHeight: 1.6, maxWidth: 220 }}>
          {subtitle}
        </p>
      )}

      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop: 24,
            padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.28)',
            color: '#BFFF00', cursor: 'pointer',
            boxShadow: '0 0 14px rgba(191,255,0,0.08)',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );
}
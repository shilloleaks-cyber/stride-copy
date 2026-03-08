import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';

function ChallengeCard({ challenge, currentUser, groupId }) {
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery({
    queryKey: ['challengeParticipants', challenge.id],
    queryFn: () => base44.entities.GroupChallengeParticipant.filter({ challenge_id: challenge.id }),
  });

  const myParticipant = participants.find(p => p.user_email === currentUser?.email);
  const isJoined = !!myParticipant;
  const isActive = challenge.status === 'active' || (challenge.end_date && isAfter(parseISO(challenge.end_date), new Date()));

  const { data: myRuns = [] } = useQuery({
    queryKey: ['challengeRuns', challenge.id, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const runs = await base44.entities.Runs.filter({ user: currentUser.email, status: 'completed' }, '-start_time', 200);
      const start = parseISO(challenge.start_date);
      const end = parseISO(challenge.end_date);
      return runs.filter(r => {
        const t = r.start_time ? new Date(r.start_time) : null;
        return t && isAfter(t, start) && isBefore(t, end);
      });
    },
    enabled: isJoined && !!currentUser?.email,
  });

  const myProgress = useMemo(() => {
    if (challenge.type === 'runs') return myRuns.length;
    return myRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
  }, [myRuns, challenge.type]);

  const progressPct = Math.min(100, (myProgress / (challenge.target_value || 1)) * 100);

  const sortedParticipants = useMemo(() =>
    [...participants].sort((a, b) => (b.progress_value || 0) - (a.progress_value || 0)),
    [participants]
  );

  const joinMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupChallengeParticipant.create({
        challenge_id: challenge.id,
        group_id: groupId,
        user_email: currentUser.email,
      });
      await base44.entities.GroupChallenge.update(challenge.id, {
        participant_count: (challenge.participant_count || 0) + 1,
      });
    },
    onSuccess: () => {
      toast.success('Joined challenge!');
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants', challenge.id] });
      queryClient.invalidateQueries({ queryKey: ['groupChallenges', groupId] });
    },
  });

  const typeLabel = challenge.type === 'runs' ? 'runs' : 'km';
  const progressLabel = challenge.type === 'runs' ? `${myProgress} runs` : `${myProgress.toFixed(1)} km`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: isActive ? 'rgba(30,30,30,0.7)' : 'rgba(20,20,20,0.5)',
        border: isActive ? '1px solid rgba(191,255,0,0.15)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#BFFF00' : 'rgba(255,255,255,0.3)' }} />
            <h4 className="text-white font-bold text-sm truncate">{challenge.title}</h4>
            {!isActive && <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>Ended</span>}
          </div>
          {challenge.description && <p className="text-xs ml-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{challenge.description}</p>}
        </div>
        {isActive && !isJoined && (
          <Button
            size="sm"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="ml-2 flex-shrink-0 h-8 text-xs font-bold"
            style={{ background: '#BFFF00', color: '#0A0A0A' }}
          >
            Join
          </Button>
        )}
        {isJoined && <CheckCircle2 className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: '#BFFF00' }} />}
      </div>

      {/* Target & Dates */}
      <div className="flex items-center justify-between mb-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span>Target: <span className="text-white font-semibold">{challenge.target_value} {typeLabel}</span></span>
        <span>{format(parseISO(challenge.start_date), 'MMM d')} – {format(parseISO(challenge.end_date), 'MMM d')}</span>
      </div>

      {/* My Progress */}
      {isJoined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>My progress</span>
            <span style={{ color: '#BFFF00', fontWeight: 700 }}>{progressLabel} / {challenge.target_value} {typeLabel}</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: progressPct >= 100 ? '#BFFF00' : 'linear-gradient(90deg, #8A2BE2, #BFFF00)' }}
            />
          </div>
        </div>
      )}

      {/* Participants count */}
      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <Users className="w-3.5 h-3.5" />
        <span>{challenge.participant_count || participants.length} participants</span>
      </div>

      {/* Mini Leaderboard */}
      {sortedParticipants.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(10,10,10,0.4)' }}>
          {sortedParticipants.slice(0, 5).map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-xs font-bold w-4" style={{ color: i < 3 ? '#BFFF00' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
              <span className="flex-1 text-xs text-white truncate">{p.user_name || p.user_email}</span>
              <span className="text-xs font-bold" style={{ color: '#BFFF00' }}>{(p.progress_value || 0).toFixed(1)} {typeLabel}</span>
              {p.completed && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#BFFF00' }} />}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ChallengesTab({ groupId, currentUser, onCreateChallenge }) {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['groupChallenges', groupId],
    queryFn: () => base44.entities.GroupChallenge.filter({ group_id: groupId }, '-created_date'),
    enabled: !!groupId,
  });

  const active = challenges.filter(c => c.status === 'active' || (c.end_date && isAfter(parseISO(c.end_date), new Date())));
  const ended = challenges.filter(c => !active.includes(c));

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#BFFF00', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="space-y-3">
      <Button onClick={onCreateChallenge} className="w-full h-12" style={{ background: '#BFFF00', color: '#0A0A0A' }}>
        <Target className="w-4 h-4 mr-2" />
        Create Challenge
      </Button>

      {active.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#BFFF00' }}>Active</p>
          {active.map(c => <ChallengeCard key={c.id} challenge={c} currentUser={currentUser} groupId={groupId} />)}
        </>
      )}

      {ended.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Ended</p>
          {ended.map(c => <ChallengeCard key={c.id} challenge={c} currentUser={currentUser} groupId={groupId} />)}
        </>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-4xl mb-3">🏆</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No challenges yet</p>
        </div>
      )}
    </div>
  );
}
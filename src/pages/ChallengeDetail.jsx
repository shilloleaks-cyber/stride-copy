import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Calendar, Users, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';

export default function ChallengeDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const challengeId = urlParams.get('id');

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => base44.entities.Challenge.filter({ id: challengeId }).then(c => c[0]),
    enabled: !!challengeId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['challengeParticipants', challengeId],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ challenge_id: challengeId }),
    enabled: !!challengeId,
  });

  const sortedParticipants = [...participants].sort((a, b) => b.progress - a.progress);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-amber-600" />;
    return null;
  };

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 backdrop-blur-lg border-b" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(191, 255, 0, 0.3)' }}>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(createPageUrl('Challenges'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">Challenge Details</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Challenge Info */}
      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-medium text-white mb-2">{challenge.title}</h2>
              <p className="text-gray-300 text-sm">{challenge.description}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-white">{challenge.target_value}</div>
              <div className="text-xs text-gray-400 mt-1">
                {challenge.challenge_type === 'distance' ? 'km' : challenge.challenge_type === 'time' ? 'hrs' : 'runs'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-white">{participants.length}</div>
              <div className="text-xs text-gray-400 mt-1">Participants</div>
            </div>
            <div className="text-center">
              <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">
                {format(parseISO(challenge.end_date), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="font-medium text-white">Leaderboard</h3>
          </div>

          <div className="space-y-3">
            {sortedParticipants.length > 0 ? (
              sortedParticipants.map((participant, index) => {
                const progressPercent = Math.min((participant.progress / challenge.target_value) * 100, 100);
                
                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="w-8 text-center">
                      {index < 3 ? (
                        getRankIcon(index)
                      ) : (
                        <span className="text-gray-500 font-medium">#{index + 1}</span>
                      )}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        {getInitials(participant.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{participant.user_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progressPercent} className="h-1.5 flex-1 bg-white/10" />
                        <span className="text-xs text-gray-400">{progressPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{participant.progress.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">
                        {challenge.challenge_type === 'distance' ? 'km' : challenge.challenge_type === 'time' ? 'hrs' : 'runs'}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No participants yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
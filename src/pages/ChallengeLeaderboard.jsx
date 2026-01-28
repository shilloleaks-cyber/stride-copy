import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award, MapPin, Activity, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function ChallengeLeaderboard() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const challengeId = urlParams.get('id');
  const [user, setUser] = useState(null);

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

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      const challenges = await base44.entities.GroupChallenge.filter({ id: challengeId });
      return challenges[0];
    },
    enabled: !!challengeId
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['challenge-progress', challengeId],
    queryFn: () => base44.entities.GroupChallengeProgress.filter({ challenge_id: challengeId }),
    enabled: !!challengeId
  });

  const getSortedLeaderboard = () => {
    if (!challenge) return [];
    
    const sortKey = {
      total_distance: 'total_distance',
      most_runs: 'total_runs',
      total_time: 'total_time',
      avg_pace: 'avg_pace'
    }[challenge.challenge_type];

    return [...progress].sort((a, b) => {
      if (challenge.challenge_type === 'avg_pace') {
        return a[sortKey] - b[sortKey]; // Lower is better for pace
      }
      return b[sortKey] - a[sortKey]; // Higher is better
    });
  };

  const leaderboard = getSortedLeaderboard();
  const userRank = leaderboard.findIndex(p => p.user_email === user?.email) + 1;

  const typeIcons = {
    total_distance: MapPin,
    most_runs: Activity,
    total_time: Clock,
    avg_pace: Zap
  };

  const Icon = challenge ? typeIcons[challenge.challenge_type] : Trophy;

  const formatValue = (value, type) => {
    if (type === 'total_distance') return `${value.toFixed(1)} km`;
    if (type === 'most_runs') return `${value} runs`;
    if (type === 'total_time') return `${Math.floor(value / 60)} min`;
    if (type === 'avg_pace') {
      const mins = Math.floor(value);
      const secs = Math.round((value - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')} /km`;
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {challenge && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-emerald-400" />
              <p className="text-sm text-gray-400 uppercase tracking-wider">Leaderboard</p>
            </div>
            <h1 className="text-3xl font-light mb-2">{challenge.name}</h1>
            <p className="text-sm text-gray-400">
              Ends {format(new Date(challenge.end_date), 'MMMM d, yyyy')}
            </p>
          </div>
        )}
      </div>

      {/* Your Rank */}
      {userRank > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-1">Your Rank</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-light text-white">#{userRank}</p>
              {leaderboard[userRank - 1] && (
                <p className="text-lg text-emerald-400">
                  {formatValue(
                    leaderboard[userRank - 1][{
                      total_distance: 'total_distance',
                      most_runs: 'total_runs',
                      total_time: 'total_time',
                      avg_pace: 'avg_pace'
                    }[challenge.challenge_type]],
                    challenge.challenge_type
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="px-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Rankings</h2>
        <div className="space-y-2">
          {leaderboard.map((player, index) => {
            const isCurrentUser = player.user_email === user?.email;
            const value = player[{
              total_distance: 'total_distance',
              most_runs: 'total_runs',
              total_time: 'total_time',
              avg_pace: 'avg_pace'
            }[challenge.challenge_type]];

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border p-4 ${
                  isCurrentUser
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-10 flex-shrink-0">
                    {index === 0 && <Trophy className="w-6 h-6 text-amber-400 mx-auto" />}
                    {index === 1 && <Medal className="w-6 h-6 text-gray-400 mx-auto" />}
                    {index === 2 && <Award className="w-6 h-6 text-orange-400 mx-auto" />}
                    {index > 2 && (
                      <p className="text-center text-gray-400 font-medium">#{index + 1}</p>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {player.user_name[0]}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{player.user_name}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-lg font-medium text-white">
                      {formatValue(value, challenge.challenge_type)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No participants yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
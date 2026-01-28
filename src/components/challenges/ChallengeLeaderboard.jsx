import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

export default function ChallengeLeaderboard({ challenge, participants, runs }) {
  // Calculate rankings based on challenge type
  const calculateScore = (participant) => {
    const userRuns = runs.filter(r => 
      r.created_by === participant.user_email &&
      r.status === 'completed' &&
      new Date(r.start_time) >= new Date(challenge.start_date) &&
      new Date(r.start_time) <= new Date(challenge.end_date)
    );

    switch (challenge.goal_type) {
      case 'distance':
        return userRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      
      case 'runs':
        return userRuns.length;
      
      case 'calories':
        return userRuns.reduce((sum, r) => sum + (r.calories_burned || 0), 0);
      
      case 'streak':
        // Calculate longest streak during challenge period
        const sortedDates = [...new Set(userRuns.map(r => 
          new Date(r.start_time).toISOString().split('T')[0]
        ))].sort();
        
        let maxStreak = 0;
        let currentStreak = 0;
        
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            currentStreak = 1;
          } else {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          }
          maxStreak = Math.max(maxStreak, currentStreak);
        }
        return maxStreak;
      
      case 'longest_run':
        return Math.max(...userRuns.map(r => r.distance_km || 0), 0);
      
      case 'fastest_pace':
        const validPaces = userRuns.map(r => r.pace_min_per_km).filter(p => p > 0);
        return validPaces.length > 0 ? Math.min(...validPaces) : 999;
      
      default:
        return 0;
    }
  };

  const rankedParticipants = participants
    .map(p => ({
      ...p,
      score: calculateScore(p)
    }))
    .sort((a, b) => {
      // For fastest_pace, lower is better
      if (challenge.goal_type === 'fastest_pace') {
        return a.score - b.score;
      }
      return b.score - a.score;
    })
    .slice(0, 10);

  const formatScore = (score, type) => {
    switch (type) {
      case 'distance':
      case 'longest_run':
        return `${score.toFixed(1)} km`;
      case 'runs':
        return `${score} runs`;
      case 'calories':
        return `${Math.round(score)} kcal`;
      case 'streak':
        return `${score} days`;
      case 'fastest_pace':
        if (score === 999) return '--:--';
        const mins = Math.floor(score);
        const secs = Math.round((score - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}/km`;
      default:
        return score;
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-400" />;
    return null;
  };

  return (
    <div className="space-y-2">
      {rankedParticipants.map((participant, index) => (
        <motion.div
          key={participant.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${
            index < 3
              ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center justify-center w-10">
            {getRankIcon(index) || (
              <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
            )}
          </div>

          <div className="flex-1">
            <p className="font-medium text-white">{participant.user_name}</p>
            <p className="text-sm text-gray-400">
              {formatScore(participant.score, challenge.goal_type)}
            </p>
          </div>

          {participant.is_completed && (
            <div className="px-3 py-1 bg-emerald-500/20 rounded-full">
              <p className="text-xs text-emerald-400 font-medium">✓ Completed</p>
            </div>
          )}
        </motion.div>
      ))}

      {rankedParticipants.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No participants yet. Be the first!
        </div>
      )}
    </div>
  );
}
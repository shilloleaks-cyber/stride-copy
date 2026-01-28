import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Coins, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DailyQuestCard({ user }) {
  const [showComplete, setShowComplete] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Generate quests if needed
  useEffect(() => {
    const generateQuests = async () => {
      try {
        await base44.functions.invoke('generateDailyQuests', {});
        queryClient.invalidateQueries(['daily-quests']);
      } catch (error) {
        console.log('Failed to generate quests:', error);
      }
    };
    generateQuests();
  }, []);

  const { data: quests = [] } = useQuery({
    queryKey: ['daily-quests', today],
    queryFn: () => base44.entities.DailyQuest.filter({ quest_date: today }),
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['quest-progress', user?.email, today],
    queryFn: () => base44.entities.QuestProgress.filter({ 
      user_email: user.email, 
      quest_date: today 
    }),
    enabled: !!user
  });

  const getQuestProgress = (questId) => {
    return progress.find(p => p.quest_id === questId);
  };

  const allCompleted = quests.length > 0 && quests.every(q => {
    const p = getQuestProgress(q.id);
    return p?.completed;
  });

  useEffect(() => {
    if (allCompleted && !showComplete) {
      setShowComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [allCompleted, showComplete]);

  if (quests.length === 0) return null;

  return (
    <div className="space-y-3">
      {quests.map((quest, index) => {
        const questProgress = getQuestProgress(quest.id);
        const progressValue = questProgress?.progress || 0;
        const isCompleted = questProgress?.completed || false;
        const progressPercent = Math.min((progressValue / quest.target_value) * 100, 100);

        return (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-2xl border p-4 ${
              isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${
                isCompleted ? 'bg-emerald-500/20' : 'bg-white/10'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-white">{quest.title}</h3>
                    <p className="text-sm text-gray-400">{quest.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Coins className="w-4 h-4" />
                    <span className="text-sm font-medium">+{quest.reward_coins}</span>
                  </div>
                </div>

                {!isCompleted && (
                  <>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {progressValue.toFixed(1)} / {quest.target_value}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {allCompleted && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4 text-center"
        >
          <Zap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-white mb-1">Daily Complete! 🎉</h3>
          <p className="text-sm text-gray-400">Come back tomorrow for new quests</p>
        </motion.div>
      )}
    </div>
  );
}
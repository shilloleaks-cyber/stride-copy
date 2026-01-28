import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Trophy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateChallengeDialog({ isOpen, onClose, user }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('distance');
  const [goalValue, setGoalValue] = useState('');
  const [rewardTokens, setRewardTokens] = useState('100');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const startDate = new Date().toISOString().split('T')[0];
      
      await base44.entities.Challenge.create({
        title,
        description,
        type: 'community',
        goal_type: goalType,
        goal_value: goalValue ? parseFloat(goalValue) : 0,
        reward_tokens: parseInt(rewardTokens),
        badge_reward: {
          name: `${title} Champion`,
          icon: '🏆'
        },
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        created_by: user.email,
        is_community: true
      });

      queryClient.invalidateQueries(['challenges']);
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setGoalType('distance');
      setGoalValue('');
      setRewardTokens('100');
      setEndDate('');
    } catch (error) {
      console.error('Failed to create challenge:', error);
      alert('Failed to create challenge. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const goalOptions = [
    { value: 'distance', label: 'Most Distance', desc: 'Total km run' },
    { value: 'runs', label: 'Most Runs', desc: 'Number of runs' },
    { value: 'streak', label: 'Longest Streak', desc: 'Consecutive days' },
    { value: 'longest_run', label: 'Longest Single Run', desc: 'Longest distance' },
    { value: 'fastest_pace', label: 'Fastest Pace', desc: 'Best avg pace' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[99998]"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 border border-yellow-500/50 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Create Challenge</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g., January Distance Challenge"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the challenge..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Challenge Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {goalOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGoalType(option.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          goalType === option.value
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{option.label}</p>
                        <p className="text-xs text-gray-400">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {goalType !== 'streak' && goalType !== 'longest_run' && goalType !== 'fastest_pace' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={goalValue}
                      onChange={(e) => setGoalValue(e.target.value)}
                      placeholder="e.g., 100"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Reward (Coins)
                  </label>
                  <input
                    type="number"
                    value={rewardTokens}
                    onChange={(e) => setRewardTokens(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || !title || !endDate}
                  className="w-full h-12 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-medium rounded-full disabled:opacity-50"
                >
                  {isCreating ? (
                    'Creating...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Challenge
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
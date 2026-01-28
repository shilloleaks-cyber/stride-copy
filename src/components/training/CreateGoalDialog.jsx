import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateGoalDialog({ isOpen, onClose, user }) {
  const [goalType, setGoalType] = useState('5k');
  const [targetDate, setTargetDate] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Create goal
      const goal = await base44.entities.TrainingGoal.create({
        user_email: user.email,
        goal_type: goalType,
        target_value: targetValue ? parseFloat(targetValue) : null,
        target_date: targetDate,
        current_level: user.current_level || 0,
        status: 'active'
      });

      // Generate training plan
      await base44.functions.invoke('generateTrainingPlan', {
        goal_id: goal.id
      });

      queryClient.invalidateQueries(['training-goals']);
      queryClient.invalidateQueries(['workout-sessions']);
      onClose();
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create training plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const goalOptions = [
    { value: '5k', label: '5K Run', description: 'Complete a 5km run' },
    { value: '10k', label: '10K Run', description: 'Complete a 10km run' },
    { value: 'half_marathon', label: 'Half Marathon', description: '21km challenge' },
    { value: 'pace', label: 'Improve Pace', description: 'Get faster' },
    { value: 'distance', label: 'Distance Goal', description: 'Run further' },
    { value: 'endurance', label: 'Build Endurance', description: 'Run longer' }
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
            <div className="bg-gray-900 border border-purple-500/50 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">New Training Goal</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Goal Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Select Your Goal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGoalType(option.value)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          goalType === option.value
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{option.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Value (if applicable) */}
                {(goalType === 'distance' || goalType === 'pace') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Target {goalType === 'distance' ? 'Distance (km)' : 'Pace (min/km)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                      placeholder={goalType === 'distance' ? '10' : '5.5'}
                    />
                  </div>
                )}

                {/* Target Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isGenerating || !targetDate}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-medium rounded-full disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Create Plan
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  AI will generate a personalized 4-week training plan based on your goal and current fitness level
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
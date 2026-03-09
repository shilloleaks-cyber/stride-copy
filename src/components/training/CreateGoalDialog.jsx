import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

// Goal types that map to a fixed target_value (km)
const FIXED_TARGET_VALUES = {
  '5k': 5,
  '10k': 10,
  'half_marathon': 21.1,
};

// Goal types that require the user to enter a target value
const REQUIRES_TARGET_VALUE = ['distance', 'pace'];

const goalOptions = [
  { value: '5k',            label: '5K Run',          description: 'Complete a 5km run' },
  { value: '10k',           label: '10K Run',          description: 'Complete a 10km run' },
  { value: 'half_marathon', label: 'Half Marathon',    description: '21km challenge' },
  { value: 'pace',          label: 'Improve Pace',     description: 'Get faster (min/km)' },
  { value: 'distance',      label: 'Distance Goal',    description: 'Run further (km)' },
  { value: 'endurance',     label: 'Build Endurance',  description: 'Run longer' },
];

export default function CreateGoalDialog({ isOpen, onClose, user, existingActiveGoal }) {
  const [goalType, setGoalType]       = useState('5k');
  const [targetDate, setTargetDate]   = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const queryClient = useQueryClient();

  const needsTargetValue = REQUIRES_TARGET_VALUE.includes(goalType);

  // Resolved target_value: fixed for race goals, user-supplied for others
  const resolvedTargetValue = FIXED_TARGET_VALUES[goalType] ?? (targetValue ? parseFloat(targetValue) : null);

  const canSubmit =
    !isGenerating &&
    targetDate.trim() !== '' &&
    (!needsTargetValue || (targetValue !== '' && !isNaN(parseFloat(targetValue))));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg('');
    setIsGenerating(true);

    try {
      // Deactivate any existing active goal first to prevent duplicates
      if (existingActiveGoal) {
        await base44.entities.TrainingGoal.update(existingActiveGoal.id, { status: 'paused' });
      }

      const goal = await base44.entities.TrainingGoal.create({
        user_email:    user.email,
        goal_type:     goalType,
        target_value:  resolvedTargetValue,
        target_date:   targetDate,
        current_level: user.current_level || 0,
        status:        'active',
      });

      await base44.functions.invoke('generateTrainingPlan', { goal_id: goal.id });

      // Use the exact query keys from pages/Training
      queryClient.invalidateQueries({ queryKey: ['training-goals', user.email] });
      queryClient.invalidateQueries({ queryKey: ['workout-sessions', user.email] });

      onClose();
    } catch (error) {
      console.error('Failed to create goal:', error);
      setErrorMsg('Failed to create training plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
                        onClick={() => { setGoalType(option.value); setTargetValue(''); }}
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

                {/* Target Value — only for distance / pace */}
                {needsTargetValue && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Target {goalType === 'distance' ? 'Distance (km)' : 'Pace (min/km)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
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

                {/* Inline error message */}
                {errorMsg && (
                  <p className="text-sm text-red-400 text-center">{errorMsg}</p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
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
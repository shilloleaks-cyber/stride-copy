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
  const [goalType, setGoalType]         = useState('5k');
  const [targetDate, setTargetDate]     = useState('');
  const [targetValue, setTargetValue]   = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const queryClient = useQueryClient();

  const needsTargetValue = REQUIRES_TARGET_VALUE.includes(goalType);
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          >
            <div
              className="rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: '#0A0A0A',
                border: '1px solid rgba(138,43,226,0.30)',
                boxShadow: '0 0 40px rgba(138,43,226,0.15), 0 0 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)' }}
                  >
                    <Target className="w-5 h-5" style={{ color: '#BFFF00' }} />
                  </div>
                  <h2 className="text-xl font-bold text-white">New Training Goal</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Goal Type grid */}
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Select Your Goal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map(option => {
                      const isSelected = goalType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => { setGoalType(option.value); setTargetValue(''); }}
                          className="p-4 rounded-2xl text-left transition-all"
                          style={{
                            background: isSelected ? 'rgba(138,43,226,0.15)' : 'rgba(255,255,255,0.04)',
                            border: isSelected
                              ? '1px solid rgba(138,43,226,0.50)'
                              : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: isSelected ? '0 0 16px rgba(138,43,226,0.20)' : 'none',
                          }}
                        >
                          <p className="font-semibold text-sm" style={{ color: isSelected ? '#BFFF00' : 'rgba(255,255,255,0.85)' }}>
                            {option.label}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Value — only for distance / pace */}
                {needsTargetValue && (
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Target {goalType === 'distance' ? 'Distance (km)' : 'Pace (min/km)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-white text-base focus:outline-none transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                      }}
                      placeholder={goalType === 'distance' ? '10' : '5.5'}
                    />
                  </div>
                )}

                {/* Target Date */}
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 rounded-2xl text-white text-base focus:outline-none transition-colors appearance-none box-border"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      colorScheme: 'dark',
                      WebkitAppearance: 'none',
                    }}
                  />
                </div>

                {/* Error */}
                {errorMsg && (
                  <p className="text-sm text-center" style={{ color: 'rgba(255,100,100,0.9)' }}>{errorMsg}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: canSubmit ? '#BFFF00' : 'rgba(255,255,255,0.08)',
                    color: canSubmit ? '#0A0A0A' : 'rgba(255,255,255,0.25)',
                    boxShadow: canSubmit ? '0 0 24px rgba(191,255,0,0.25)' : 'none',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Zap className="w-4 h-4 animate-pulse" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Create Plan
                    </>
                  )}
                </button>

                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
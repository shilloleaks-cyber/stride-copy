import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Target, Zap } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// ─── Goal Config ────────────────────────────────────────────────────────────
const GOAL_CONFIG = {
  '5k':            { label: '5K Run',          description: 'Complete a 5km run',    fixedTargetValue: 5,    requiresTargetValue: false },
  '10k':           { label: '10K Run',          description: 'Complete a 10km run',   fixedTargetValue: 10,   requiresTargetValue: false },
  'half_marathon': { label: 'Half Marathon',    description: '21km challenge',         fixedTargetValue: 21.1, requiresTargetValue: false },
  'pace':          { label: 'Improve Pace',     description: 'Get faster (min/km)',    fixedTargetValue: null, requiresTargetValue: true  },
  'distance':      { label: 'Distance Goal',    description: 'Run further (km)',       fixedTargetValue: null, requiresTargetValue: true  },
  'endurance':     { label: 'Build Endurance',  description: 'Run longer',             fixedTargetValue: null, requiresTargetValue: false },
};

const GOAL_TYPES = Object.keys(GOAL_CONFIG);

// ─── Helpers ────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}

// ────────────────────────────────────────────────────────────────────────────
export default function CreateGoalDialog({ isOpen, onClose, user, existingActiveGoal }) {
  const [goalType,               setGoalType]               = useState('5k');
  const [targetDate,             setTargetDate]             = useState('');
  const [targetValue,            setTargetValue]            = useState('');
  const [isGenerating,           setIsGenerating]           = useState(false);
  const [errorMsg,               setErrorMsg]               = useState('');
  const [pendingReplaceConfirm,  setPendingReplaceConfirm]  = useState(false);

  const queryClient = useQueryClient();

  // ─── Derived values ────────────────────────────────────────────────────────
  const goalConfig = GOAL_CONFIG[goalType];
  const needsTargetValue = goalConfig.requiresTargetValue;

  const resolvedTargetValue = useMemo(() => {
    if (goalConfig.fixedTargetValue !== null) return goalConfig.fixedTargetValue;
    if (!needsTargetValue) return null;
    const parsed = parseFloat(targetValue);
    return isNaN(parsed) ? null : parsed;
  }, [goalConfig, needsTargetValue, targetValue]);

  const isTargetDateValid = useMemo(() => {
    if (!targetDate) return false;
    return targetDate >= today();
  }, [targetDate]);

  const isTargetValueValid = useMemo(() => {
    if (!needsTargetValue) return true;
    const v = parseFloat(targetValue);
    if (isNaN(v) || v <= 0) return false;
    if (goalType === 'pace' && v > 20) return false;
    return true;
  }, [needsTargetValue, targetValue, goalType]);

  const dateErrorMsg = useMemo(() => {
    if (!targetDate || isTargetDateValid) return '';
    return 'Start date cannot be in the past.';
  }, [targetDate, isTargetDateValid]);

  const targetValueErrorMsg = useMemo(() => {
    if (!needsTargetValue || !targetValue) return '';
    const v = parseFloat(targetValue);
    if (isNaN(v) || v <= 0) return `Please enter a valid ${goalType === 'pace' ? 'pace' : 'distance'}.`;
    if (goalType === 'pace' && v > 20) return 'Pace must be 20 min/km or less.';
    return '';
  }, [needsTargetValue, targetValue, goalType]);

  const canSubmit =
    !isGenerating &&
    isTargetDateValid &&
    isTargetValueValid &&
    (!needsTargetValue || targetValue !== '');

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleGoalTypeChange = (type) => {
    setGoalType(type);
    setTargetValue('');
    setErrorMsg('');
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg('');

    if (existingActiveGoal) {
      setPendingReplaceConfirm(true);
    } else {
      executeCreate();
    }
  };

  const executeCreate = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      // 1. pause existing goal if replacing
      if (existingActiveGoal) {
        await base44.entities.TrainingGoal.update(existingActiveGoal.id, { status: 'paused' });
      }

      // 2. create new goal
      const goal = await base44.entities.TrainingGoal.create({
        user_email:    user.email,
        goal_type:     goalType,
        target_value:  resolvedTargetValue,
        target_date:   targetDate,
        current_level: user.current_level || 0,
        status:        'active',
      });

      // 3. generate plan — treat any response (or no response) as success
      //    as long as the goal was created above
      try {
        await base44.functions.invoke('generateTrainingPlan', { goal_id: goal.id });
      } catch (planErr) {
        // Plan generation failed, but the goal record exists — still succeed
        console.warn('Plan generation error (goal created):', planErr);
      }

      // 4. invalidate queries
      queryClient.invalidateQueries({ queryKey: ['training-goals'] });
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });

      // 5. close
      onClose();
    } catch (err) {
      console.error('Goal creation failed:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
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

                <form onSubmit={handleSubmitClick} className="space-y-6">
                  {/* Goal Type grid */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Select Your Goal
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {GOAL_TYPES.map(type => {
                        const cfg = GOAL_CONFIG[type];
                        const isSelected = goalType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleGoalTypeChange(type)}
                            className="p-4 rounded-2xl text-left transition-all"
                            style={{
                              background: isSelected ? 'rgba(138,43,226,0.15)' : 'rgba(255,255,255,0.04)',
                              border: isSelected ? '1px solid rgba(138,43,226,0.50)' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: isSelected ? '0 0 16px rgba(138,43,226,0.20)' : 'none',
                            }}
                          >
                            <p className="font-semibold text-sm" style={{ color: isSelected ? '#BFFF00' : 'rgba(255,255,255,0.85)' }}>
                              {cfg.label}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {cfg.description}
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
                        min="0.1"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl text-white text-base focus:outline-none transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: targetValueErrorMsg ? '1px solid rgba(255,80,80,0.5)' : '1px solid rgba(255,255,255,0.10)',
                          colorScheme: 'dark',
                        }}
                        placeholder={goalType === 'distance' ? '10' : '5.5'}
                      />
                      {targetValueErrorMsg && (
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,100,100,0.9)' }}>{targetValueErrorMsg}</p>
                      )}
                    </div>
                  )}

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={today()}
                      className="w-full px-4 py-3 rounded-2xl text-white text-base focus:outline-none transition-colors appearance-none box-border"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: dateErrorMsg ? '1px solid rgba(255,80,80,0.5)' : '1px solid rgba(255,255,255,0.10)',
                        colorScheme: 'dark',
                        WebkitAppearance: 'none',
                      }}
                    />
                    <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Your training plan will begin on this date.
                    </p>
                    {dateErrorMsg && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,100,100,0.9)' }}>{dateErrorMsg}</p>
                    )}
                  </div>

                  {/* Global error */}
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
                    A personalized training plan will be generated starting from your selected start date
                  </p>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Replacement confirmation */}
      <ConfirmDialog
        open={pendingReplaceConfirm}
        title="Replace current goal?"
        description="Your current active goal will be paused and replaced by the new one."
        confirmLabel="Replace"
        cancelLabel="Cancel"
        confirmVariant="primary"
        loading={isGenerating}
        onConfirm={() => { setPendingReplaceConfirm(false); executeCreate(); }}
        onCancel={() => setPendingReplaceConfirm(false)}
      />
    </>
  );
}
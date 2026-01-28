import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Trophy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CreateChallengeDialog({ isOpen, onClose, groupId, user }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState('total_distance');
  const [duration, setDuration] = useState('weekly');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const challengeTypes = [
    { value: 'total_distance', label: 'Total Distance', description: 'Most kilometers run' },
    { value: 'most_runs', label: 'Most Runs', description: 'Highest run count' },
    { value: 'total_time', label: 'Total Time', description: 'Most time spent running' },
    { value: 'avg_pace', label: 'Best Pace', description: 'Fastest average pace' }
  ];

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (duration === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      await base44.entities.GroupChallenge.create({
        group_id: groupId,
        name: name.trim(),
        description: description.trim(),
        challenge_type: challengeType,
        duration: duration,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active'
      });

      queryClient.invalidateQueries(['group-challenges']);
      onClose();
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create challenge:', error);
      alert('Failed to create challenge');
    } finally {
      setIsCreating(false);
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create Challenge</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Challenge Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="January Distance Challenge"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Who can run the most this week?"
                    className="bg-white/5 border-white/10 text-white resize-none"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Challenge Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {challengeTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setChallengeType(type.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          challengeType === type.value
                            ? 'bg-emerald-500/20 border-emerald-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{type.label}</p>
                        <p className="text-xs text-gray-400">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDuration('weekly')}
                      className={`p-3 rounded-xl border ${
                        duration === 'weekly'
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mb-1 mx-auto" />
                      <p className="text-sm text-white text-center">Weekly</p>
                    </button>
                    <button
                      onClick={() => setDuration('monthly')}
                      className={`p-3 rounded-xl border ${
                        duration === 'monthly'
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mb-1 mx-auto" />
                      <p className="text-sm text-white text-center">Monthly</p>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !name.trim()}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCreating ? 'Creating...' : 'Create Challenge'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
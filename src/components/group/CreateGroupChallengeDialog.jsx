import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

export default function CreateGroupChallengeDialog({ open, onClose, groupId, user }) {
  const queryClient = useQueryClient();
  const [challenge, setChallenge] = useState({
    title: '',
    description: '',
    challenge_type: 'distance',
    target_value: 50,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupChallenge.create({
        group_id: groupId,
        ...challenge,
        creator_email: user.email,
        creator_name: user.full_name,
        participant_count: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupChallenges']);
      toast.success('Challenge created!');
      onClose();
      setChallenge({
        title: '',
        description: '',
        challenge_type: 'distance',
        target_value: 50,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    },
  });

  const challengeTypes = [
    { id: 'distance', label: 'Total Distance', unit: 'km', emoji: '🏃‍♂️' },
    { id: 'time', label: 'Total Time', unit: 'hours', emoji: '⏱️' },
    { id: 'runs_count', label: 'Number of Runs', unit: 'runs', emoji: '🔢' },
    { id: 'consistency', label: 'Run Streak', unit: 'days', emoji: '🔥' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Challenge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Challenge Title</label>
            <Input
              value={challenge.title}
              onChange={(e) => setChallenge({ ...challenge, title: e.target.value })}
              placeholder="e.g., 50km Weekly Challenge"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <Textarea
              value={challenge.description}
              onChange={(e) => setChallenge({ ...challenge, description: e.target.value })}
              placeholder="Challenge details..."
              className="bg-white/5 border-white/10 text-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Challenge Type</label>
            <div className="grid grid-cols-2 gap-2">
              {challengeTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setChallenge({ ...challenge, challenge_type: type.id })}
                  className={`p-3 rounded-xl text-sm transition-all ${
                    challenge.challenge_type === type.id
                      ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-lg mr-2">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Target Value</label>
            <Input
              type="number"
              value={challenge.target_value}
              onChange={(e) => setChallenge({ ...challenge, target_value: parseFloat(e.target.value) })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Start Date</label>
              <Input
                type="date"
                value={challenge.start_date}
                onChange={(e) => setChallenge({ ...challenge, start_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">End Date</label>
              <Input
                type="date"
                value={challenge.end_date}
                onChange={(e) => setChallenge({ ...challenge, end_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!challenge.title || createMutation.isPending}
            className="w-full h-12"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            Create Challenge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
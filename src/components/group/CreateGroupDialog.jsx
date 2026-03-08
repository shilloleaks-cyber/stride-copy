import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'marathon_training', label: 'Marathon Training', emoji: '🏃‍♂️' },
  { id: 'local_club', label: 'Local Club', emoji: '📍' },
  { id: 'beginners', label: 'Beginners', emoji: '🌱' },
  { id: 'advanced', label: 'Advanced', emoji: '⚡' },
  { id: 'trail_running', label: 'Trail Running', emoji: '⛰️' },
  { id: 'social', label: 'Social', emoji: '🎉' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export default function CreateGroupDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'social',
    is_private: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error('User not ready');

      const group = await base44.entities.Group.create({
        name: data.name.trim(),
        description: data.description || '',
        privacy: data.is_private ? 'private' : 'public',
        join_policy: data.is_private ? 'approval' : 'open',
        group_type: 'social',
        owner_email: user.email,
        member_count: 1,
      });

      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        user_image: user.profile_image || '',
        role: 'owner',
        status: 'active',
        joined_date: new Date().toISOString(),
      });

      return group;
    },
    onSuccess: (group) => {
      toast.success('Group created!');
      onOpenChange(false);
      setForm({ name: '', description: '', category: 'social', is_private: false });
      onCreated?.(group);
    },
    onError: (e) => {
      toast.error(e?.message || 'Create group failed');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[55vh] pr-1 space-y-4 mt-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Group Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Bangkok Runners"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell others what this group is about..."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm({ ...form, category: cat.id })}
                  className={`p-3 rounded-xl text-sm transition-all ${
                    form.category === cat.id
                      ? 'bg-purple-500/20 border-2 border-purple-500/50'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-lg mr-2">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <input
              type="checkbox"
              checked={form.is_private}
              onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-300">
              Make this group private (only invited members can join)
            </label>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => createMutation.mutate(form)}
          disabled={!form.name?.trim() || createMutation.isPending}
          className="w-full h-12 mt-4"
          style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
        >
          Create Group
        </Button>
      </DialogContent>
    </Dialog>
  );
}
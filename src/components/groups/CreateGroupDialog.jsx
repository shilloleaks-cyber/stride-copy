import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const emojiOptions = ['🏃', '⚡', '🔥', '💪', '🎯', '🏆', '⭐', '🚀'];
const colorOptions = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899'];

export default function CreateGroupDialog({ isOpen, onClose, user }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏃');
  const [color, setColor] = useState('#10b981');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsCreating(true);
    try {
      const group = await base44.entities.Group.create({
        name: name.trim(),
        description: description.trim(),
        created_by: user.email,
        avatar_color: color,
        emoji: emoji,
        is_private: isPrivate
      });

      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'admin',
        joined_date: new Date().toISOString()
      });

      queryClient.invalidateQueries(['my-groups']);
      queryClient.invalidateQueries(['all-groups']);
      onClose();
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
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
                <h2 className="text-xl font-bold text-white">Create Group</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Avatar */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Avatar</label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: color }}
                    >
                      {emoji}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {emojiOptions.map(e => (
                          <button
                            key={e}
                            onClick={() => setEmoji(e)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-xl ${
                              emoji === e ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {colorOptions.map(c => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-white' : ''}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Group Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Running Squad"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A group for friends to run together..."
                    className="bg-white/5 border-white/10 text-white resize-none"
                    rows={3}
                  />
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm text-white">Private Group</p>
                    <p className="text-xs text-gray-400">Only members can see challenges</p>
                  </div>
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isPrivate ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isPrivate ? 24 : 2 }}
                      className="w-5 h-5 bg-white rounded-full mt-0.5"
                    />
                  </button>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !name.trim()}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
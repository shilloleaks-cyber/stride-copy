import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const EMOJIS = ['🏃', '⚡', '🔥', '💪', '🌟', '🏆', '🚀', '💨', '⭐', '👟'];

export default function CreateCrewModal({ isOpen, onClose, user }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏃');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const crew = await base44.entities.Crew.create({
        name: name.trim(),
        description: description.trim(),
        logo_emoji: emoji,
        creator_email: user.email,
        weekly_distance_km: 0,
        member_count: 1
      });

      await base44.entities.CrewMember.create({
        crew_id: crew.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'admin',
        weekly_distance_km: 0,
        total_coins: user.total_coins || 0
      });

      onClose(true);
    } catch (error) {
      console.error('Failed to create crew:', error);
    } finally {
      setLoading(false);
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
            onClick={() => onClose(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Create Crew</h2>
                </div>
                <button
                  onClick={() => onClose(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Choose Logo</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                          emoji === e ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-white/5 border-2 border-transparent'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Crew Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Thunder Runners"
                    className="bg-white/5 border-white/10 text-white"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description (Optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="We run fast, we run far..."
                    className="bg-white/5 border-white/10 text-white"
                    rows={3}
                    maxLength={150}
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Crew'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
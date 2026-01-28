import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JoinGroupDialog({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();

  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.Group.list(),
    enabled: isOpen
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-groups', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user && isOpen
  });

  const joinableuGroups = allGroups.filter(g => 
    !myMemberships.some(m => m.group_id === g.id) && !g.is_private
  );

  const joinMutation = useMutation({
    mutationFn: async (groupId) => {
      await base44.entities.GroupMember.create({
        group_id: groupId,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'member',
        joined_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-groups']);
      queryClient.invalidateQueries(['group-members']);
      onClose();
    }
  });

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
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[99999] flex items-end justify-center p-4"
          >
            <div className="bg-gray-900 border border-white/10 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto pb-8">
              <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Join a Group</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {joinableGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No groups available</p>
                  </div>
                ) : (
                  joinableGroups.map(group => (
                    <div key={group.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: group.avatar_color }}
                        >
                          {group.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-gray-400 line-clamp-1">{group.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => joinMutation.mutate(group.id)}
                        disabled={joinMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                      >
                        {joinMutation.isPending ? 'Joining...' : 'Join Group'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, TrendingUp } from 'lucide-react';

export default function BrowseCrewsModal({ isOpen, onClose, user }) {
  const queryClient = useQueryClient();

  const { data: crews = [] } = useQuery({
    queryKey: ['public-crews'],
    queryFn: () => base44.entities.Crew.filter({ is_public: true }),
    enabled: isOpen
  });

  const joinMutation = useMutation({
    mutationFn: async (crewId) => {
      const crew = crews.find(c => c.id === crewId);
      
      await base44.entities.CrewMember.create({
        crew_id: crewId,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'member',
        weekly_distance_km: 0,
        total_coins: user.total_coins || 0
      });

      await base44.entities.Crew.update(crewId, {
        member_count: (crew.member_count || 1) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['crew-membership']);
      queryClient.invalidateQueries(['crew']);
      onClose(true);
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
            onClick={() => onClose(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[99999] flex items-end justify-center p-4"
          >
            <div className="bg-gray-900 border border-white/10 rounded-t-3xl w-full max-w-md max-h-[80vh] overflow-y-auto pb-8">
              <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Browse Crews</h2>
                </div>
                <button
                  onClick={() => onClose(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {crews.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No crews available</p>
                    <p className="text-sm text-gray-600 mt-1">Be the first to create one!</p>
                  </div>
                ) : (
                  crews.map(crew => (
                    <motion.div
                      key={crew.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
                            {crew.logo_emoji || '🏃'}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{crew.name}</h3>
                            <p className="text-xs text-gray-400">{crew.member_count} members</p>
                          </div>
                        </div>
                      </div>
                      
                      {crew.description && (
                        <p className="text-sm text-gray-400 mb-3">{crew.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-blue-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>{crew.weekly_distance_km?.toFixed(1) || '0.0'} km this week</span>
                        </div>
                        <button
                          onClick={() => joinMutation.mutate(crew.id)}
                          disabled={joinMutation.isPending}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {joinMutation.isPending ? 'Joining...' : 'Join'}
                        </button>
                      </div>
                    </motion.div>
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
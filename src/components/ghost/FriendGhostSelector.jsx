import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Users, Trophy, Zap } from 'lucide-react';

export default function FriendGhostSelector({ isOpen, onClose, onSelect, user }) {
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { data: follows = [] } = useQuery({
    queryKey: ['following', user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user && isOpen
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen
  });

  const { data: allRuns = [] } = useQuery({
    queryKey: ['all-runs-for-ghost'],
    queryFn: () => base44.entities.Run.list('-start_time', 100),
    enabled: isOpen
  });

  const friends = allUsers.filter(u => 
    follows.some(f => f.following_email === u.email)
  );

  const getFriendBestRun = (friendEmail) => {
    const friendRuns = allRuns.filter(r => 
      r.created_by === friendEmail && 
      r.status === 'completed' &&
      r.route_points &&
      r.route_points.length > 5 &&
      r.distance_km > 0.5
    );

    if (friendRuns.length === 0) return null;

    return friendRuns.reduce((best, run) => 
      (!best || run.pace_min_per_km < best.pace_min_per_km) ? run : best
    );
  };

  const handleSelect = () => {
    if (selectedFriend) {
      const bestRun = getFriendBestRun(selectedFriend.email);
      if (bestRun) {
        onSelect(bestRun, selectedFriend);
        onClose();
      }
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
                  <h2 className="text-xl font-bold text-white">Race Friend Ghost</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No friends yet</p>
                    <p className="text-sm text-gray-600 mt-1">Follow runners to race their ghosts</p>
                  </div>
                ) : (
                  friends.map(friend => {
                    const bestRun = getFriendBestRun(friend.email);
                    if (!bestRun) return null;

                    return (
                      <button
                        key={friend.id}
                        onClick={() => setSelectedFriend(friend)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all ${
                          selectedFriend?.id === friend.id
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {friend.full_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{friend.full_name || friend.email}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                              <span>{bestRun.distance_km.toFixed(2)}km</span>
                              <span>•</span>
                              <span>{Math.floor(bestRun.duration_seconds / 60)}min</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {bestRun.pace_min_per_km.toFixed(1)} min/km
                              </span>
                            </div>
                          </div>
                          <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedFriend && (
                <div className="px-6">
                  <button
                    onClick={handleSelect}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Race {selectedFriend.full_name || 'Friend'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
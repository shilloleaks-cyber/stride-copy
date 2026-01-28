import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Users, Trophy, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateGroupDialog from '@/components/groups/CreateGroupDialog';
import GroupCard from '@/components/groups/GroupCard';
import JoinGroupDialog from '@/components/groups/JoinGroupDialog';

export default function Groups() {
  const [user, setUser] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.log('Could not load user:', error);
      }
    };
    loadUser();
  }, []);

  const { data: memberships = [] } = useQuery({
    queryKey: ['my-groups', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.Group.list(),
  });

  const myGroups = allGroups.filter(g => 
    memberships.some(m => m.group_id === g.id)
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Groups</p>
            <h1 className="text-3xl font-light mt-1">Your Teams</h1>
          </div>
          <Button
            onClick={() => setShowCreateGroup(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Quick Stats */}
        {myGroups.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-4">
              <Users className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-2xl font-light text-white">{myGroups.length}</p>
              <p className="text-xs text-gray-400">Groups Joined</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4">
              <Trophy className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-2xl font-light text-white">0</p>
              <p className="text-xs text-gray-400">Challenges Won</p>
            </div>
          </div>
        )}
      </div>

      {/* My Groups */}
      {myGroups.length > 0 ? (
        <div className="px-6 mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">My Groups</h2>
          <div className="space-y-3">
            {myGroups.map(group => (
              <GroupCard key={group.id} group={group} user={user} />
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mb-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Groups Yet</h3>
            <p className="text-gray-400 mb-4">
              Create or join a group to compete with friends
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowCreateGroup(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Group
              </Button>
              <Button
                onClick={() => setShowJoinGroup(true)}
                variant="outline"
                className="border-white/20"
              >
                Join Group
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Discover Groups */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-500">Discover</h2>
          <button
            onClick={() => setShowJoinGroup(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Browse all
          </button>
        </div>
        <div className="space-y-3">
          {allGroups
            .filter(g => !myGroups.some(mg => mg.id === g.id))
            .slice(0, 3)
            .map(group => (
              <GroupCard key={group.id} group={group} user={user} isDiscovery />
            ))}
        </div>
      </div>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        user={user}
      />

      {/* Join Group Dialog */}
      <JoinGroupDialog
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        user={user}
      />
    </div>
  );
}
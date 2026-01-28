import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Trophy, Plus, Crown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateChallengeDialog from '@/components/groups/CreateChallengeDialog';
import ChallengeCard from '@/components/groups/ChallengeCard';

export default function GroupDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get('id');
  const [user, setUser] = useState(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

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

  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0];
    },
    enabled: !!groupId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
    enabled: !!groupId
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['group-challenges', groupId],
    queryFn: () => base44.entities.GroupChallenge.filter({ group_id: groupId }),
    enabled: !!groupId
  });

  const currentMember = members.find(m => m.user_email === user?.email);
  const isAdmin = currentMember?.role === 'admin';
  const activeChallenges = challenges.filter(c => c.status === 'active');

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Groups'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateChallenge(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Challenge
          </Button>
        )}
      </div>

      {/* Group Header */}
      {group && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-4 pb-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: group.avatar_color }}
            >
              {group.emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{group.name}</h1>
              {group.description && (
                <p className="text-sm text-gray-400">{group.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{members.length} members</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{activeChallenges.length} active</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="px-6 mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Active Challenges</h2>
          <div className="space-y-3">
            {activeChallenges.map(challenge => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                groupId={groupId}
                user={user}
              />
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="px-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Members</h2>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                {member.user_name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{member.user_name}</p>
                <p className="text-xs text-gray-400">{member.user_email}</p>
              </div>
              {member.role === 'admin' && (
                <Crown className="w-4 h-4 text-amber-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Challenge Dialog */}
      <CreateChallengeDialog
        isOpen={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        groupId={groupId}
        user={user}
      />
    </div>
  );
}
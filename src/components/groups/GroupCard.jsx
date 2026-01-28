import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GroupCard({ group, user, isDiscovery }) {
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['group-challenges', group.id],
    queryFn: () => base44.entities.GroupChallenge.filter({ 
      group_id: group.id,
      status: 'active'
    }),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'member',
        joined_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-groups']);
      queryClient.invalidateQueries(['group-members']);
    }
  });

  if (isDiscovery) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: group.avatar_color }}
          >
            {group.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{group.name}</h3>
            <p className="text-sm text-gray-400">{members.length} members</p>
          </div>
          <Button
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {joinMutation.isPending ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Link to={createPageUrl(`GroupDetails?id=${group.id}`)}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: group.avatar_color }}
          >
            {group.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-gray-400 truncate">{group.description}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{members.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>{challenges.length} active</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
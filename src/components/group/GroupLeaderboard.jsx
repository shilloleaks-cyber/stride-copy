import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function GroupLeaderboard({ groupId }) {
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: runs = [] } = useQuery({
    queryKey: ['allRuns'],
    queryFn: () => base44.entities.Run.list('-start_time', 500),
  });

  const completedRuns = runs.filter(r => r.status === 'completed');

  // Calculate stats for each member
  const memberStats = members.map(member => {
    const memberRuns = completedRuns.filter(r => r.created_by === member.user_email);
    const totalDistance = memberRuns.reduce((sum, r) => sum + (r.distance_km || 0), 0);
    const totalRuns = memberRuns.length;
    
    return {
      ...member,
      totalDistance,
      totalRuns,
    };
  });

  // Sort by total distance
  const sortedMembers = [...memberStats].sort((a, b) => b.totalDistance - a.totalDistance);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {sortedMembers.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-xl ${
            index < 3 
              ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20' 
              : 'bg-white/5 border border-white/10'
          }`}
        >
          <div className="w-8 text-center">
            {index < 3 ? (
              getRankIcon(index)
            ) : (
              <span className="text-gray-500 font-medium">#{index + 1}</span>
            )}
          </div>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              {getInitials(member.user_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{member.user_name}</p>
            <p className="text-xs text-gray-500">{member.totalRuns} runs</p>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">{member.totalDistance.toFixed(1)}</p>
            <p className="text-xs text-gray-500">km</p>
          </div>
        </motion.div>
      ))}
      
      {sortedMembers.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No members yet
        </div>
      )}
    </div>
  );
}
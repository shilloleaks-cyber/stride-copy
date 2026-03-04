import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareRunToGroup({ open, onClose, run, user }) {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const queryClient = useQueryClient();

  const { data: memberships = [] } = useQuery({
    queryKey: ['myGroupMemberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email && open,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
    enabled: open,
  });

  const myGroupIds = new Set(memberships.map(m => m.group_id));
  const myGroups = groups.filter(g => myGroupIds.has(g.id));

  const shareMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupPost.create({
        group_id: selectedGroupId,
        author_email: user.email,
        author_name: user.full_name,
        author_image: user.profile_image || '',
        run_id: run.id,
        run_data: {
          distance_km: run.distance_km,
          duration_seconds: run.duration_seconds,
          pace_min_per_km: run.pace_min_per_km,
        },
        likes: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupPosts', selectedGroupId]);
      toast.success('Run shared to group!');
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Share Run to Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {myGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">You're not in any groups yet</p>
            </div>
          ) : (
            myGroups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedGroupId === group.id
                    ? 'border-purple-500/50 bg-purple-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <Avatar className="w-10 h-10">
                  {group.avatar_image && <AvatarImage src={group.avatar_image} />}
                  <AvatarFallback className="bg-purple-600 text-white text-sm">
                    {group.name?.[0]?.toUpperCase() || 'G'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">{group.name}</p>
                  <p className="text-xs text-gray-500">{group.member_count} members</p>
                </div>
                {selectedGroupId === group.id && (
                  <Check className="w-5 h-5 text-purple-400" />
                )}
              </button>
            ))
          )}
        </div>
        <Button
          onClick={() => shareMutation.mutate()}
          disabled={!selectedGroupId || shareMutation.isPending}
          className="w-full h-12 mt-2"
          style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
        >
          Share Run
        </Button>
      </DialogContent>
    </Dialog>
  );
}
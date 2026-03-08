import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import GroupCard from '@/components/group/GroupCard';
import CreateGroupDialog from '@/components/group/CreateGroupDialog';

export default function GroupsPanel({ mode = 'page', showHeader = true, showCreateButton = true, embedded = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['myGroupMemberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (group) => {
      const existing = await base44.entities.GroupMember.filter({
        group_id: group.id,
        user_email: user.email,
      });
      if (existing.length > 0) return;

      const joinPolicy = group.join_policy || 'open';
      const status = joinPolicy === 'approval' ? 'pending' : 'active';

      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        user_image: user.profile_image || '',
        role: 'member',
        status,
        joined_date: new Date().toISOString(),
      });

      if (status === 'active') {
        await base44.entities.Group.update(group.id, {
          member_count: (group.member_count || 0) + 1,
        });
        await base44.functions.invoke('awardActivityCoins', { activityType: 'group_joined' });
      }
    },
    onSuccess: (_, group) => {
      queryClient.invalidateQueries(['groups']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['currentUser']);
      const policy = group.join_policy || 'open';
      toast.success(policy === 'approval' ? 'Join request sent!' : 'Joined group! +30 coins');
    },
  });

  const myGroupIds = new Set(myMemberships.map(m => m.group_id));

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroups = filteredGroups.filter(g => myGroupIds.has(g.id));
  const discoverGroups = filteredGroups.filter(g => !myGroupIds.has(g.id) && g.privacy !== 'private');

  return (
    <div className="text-white">
      {/* Search + Create */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        {showCreateButton && !embedded && (
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Groups ({myGroups.length})
          </h2>
          <div className="space-y-3">
            {myGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                variant="my"
                onClick={() => navigate(createPageUrl(`GroupDetail?id=${group.id}`))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discover */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Discover
        </h2>
        {discoverGroups.length > 0 ? (
          <div className="space-y-3">
            {discoverGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                variant="discover"
                onJoin={() => joinGroupMutation.mutate(group)}
                isJoining={joinGroupMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No groups found</p>
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        user={user}
        onCreated={(group) => {
          queryClient.invalidateQueries(['groups']);
          queryClient.invalidateQueries(['myGroupMemberships']);
          navigate(createPageUrl(`GroupDetail?id=${group.id}`));
        }}
      />
    </div>
  );
}
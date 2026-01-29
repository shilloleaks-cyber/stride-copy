import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, Lock, Globe, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function Groups() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: 'social',
    is_private: false,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['myGroupMemberships', user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      const group = await base44.entities.Group.create({
        ...groupData,
        creator_email: user.email,
        creator_name: user.full_name,
        member_count: 1,
      });

      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'admin',
      });

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      setCreateDialogOpen(false);
      setNewGroup({ name: '', description: '', category: 'social', is_private: false });
      toast.success('Group created!');
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (group) => {
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'member',
      });

      await base44.entities.Group.update(group.id, {
        member_count: (group.member_count || 1) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      toast.success('Joined group!');
    },
  });

  const myGroupIds = new Set(myMemberships.map(m => m.group_id));

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroups = filteredGroups.filter(g => myGroupIds.has(g.id));
  const discoverGroups = filteredGroups.filter(g => !myGroupIds.has(g.id) && !g.is_private);

  const categories = [
    { id: 'marathon_training', label: 'Marathon Training', emoji: '🏃‍♂️' },
    { id: 'local_club', label: 'Local Club', emoji: '📍' },
    { id: 'beginners', label: 'Beginners', emoji: '🌱' },
    { id: 'advanced', label: 'Advanced', emoji: '⚡' },
    { id: 'trail_running', label: 'Trail Running', emoji: '⛰️' },
    { id: 'social', label: 'Social', emoji: '🎉' },
    { id: 'other', label: 'Other', emoji: '✨' },
  ];

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[categories.length - 1];
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 border-b backdrop-blur-lg" style={{ backgroundColor: 'rgba(10, 10, 10, 0.95)', borderColor: 'rgba(138, 43, 226, 0.3)' }}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(createPageUrl('Feed'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">Groups</h1>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Groups ({myGroups.length})
          </h2>
          <div className="space-y-3">
            {myGroups.map(group => {
              const categoryInfo = getCategoryInfo(group.category);
              return (
                <motion.button
                  key={group.id}
                  onClick={() => navigate(createPageUrl(`GroupDetail?id=${group.id}`))}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4"
                >
                  <Avatar className="w-14 h-14">
                    {group.cover_image ? (
                      <AvatarImage src={group.cover_image} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-lg">
                      {categoryInfo.emoji}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white">{group.name}</p>
                      {group.is_private && <Lock className="w-3 h-3 text-gray-500" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{group.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600">{group.member_count} members</span>
                      <span className="text-xs text-purple-400">{categoryInfo.label}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Discover Groups */}
      <div className="px-6 mt-8">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Discover
        </h2>
        {discoverGroups.length > 0 ? (
          <div className="space-y-3">
            {discoverGroups.map(group => {
              const categoryInfo = getCategoryInfo(group.category);
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                >
                  <Avatar className="w-14 h-14">
                    {group.cover_image ? (
                      <AvatarImage src={group.cover_image} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-lg">
                      {categoryInfo.emoji}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-white">{group.name}</p>
                      <Globe className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-1">{group.description || 'No description'}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">{group.member_count} members</span>
                      <span className="text-xs text-emerald-400">{categoryInfo.label}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => joinGroupMutation.mutate(group)}
                    disabled={joinGroupMutation.isPending}
                    size="sm"
                    style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                  >
                    Join
                  </Button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No groups found</p>
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Group Name</label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="e.g., Bangkok Runners"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description</label>
              <Textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Tell others what this group is about..."
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewGroup({ ...newGroup, category: cat.id })}
                    className={`p-3 rounded-xl text-sm transition-all ${
                      newGroup.category === cat.id
                        ? 'bg-purple-500/20 border-2 border-purple-500/50'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <span className="text-lg mr-2">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <input
                type="checkbox"
                checked={newGroup.is_private}
                onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-300">
                Make this group private (only invited members can join)
              </label>
            </div>
            <Button
              onClick={() => createGroupMutation.mutate(newGroup)}
              disabled={!newGroup.name || createGroupMutation.isPending}
              className="w-full h-12"
              style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, UserCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FriendRequestButton({ targetUser, currentUser }) {
  const queryClient = useQueryClient();

  // Check if already following
  const { data: isFollowing = false } = useQuery({
    queryKey: ['isFollowing', currentUser?.email, targetUser?.email],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser?.email,
        following_email: targetUser?.email,
      });
      return follows.length > 0;
    },
    enabled: !!currentUser?.email && !!targetUser?.email,
  });

  // Check pending friend request
  const { data: pendingRequest } = useQuery({
    queryKey: ['friendRequest', currentUser?.email, targetUser?.email],
    queryFn: async () => {
      const requests = await base44.entities.FriendRequest.filter({
        sender_email: currentUser?.email,
        receiver_email: targetUser?.email,
        status: 'pending',
      });
      return requests[0] || null;
    },
    enabled: !!currentUser?.email && !!targetUser?.email,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FriendRequest.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || 'Runner',
        receiver_email: targetUser.email,
        receiver_name: targetUser.full_name || 'Runner',
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequest']);
      toast.success('ส่งคำขอเป็นเพื่อนแล้ว!');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: targetUser.email,
      });
      if (follows[0]) {
        await base44.entities.Follow.delete(follows[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['isFollowing']);
      queryClient.invalidateQueries(['follows']);
      toast.success('เลิกติดตามแล้ว');
    },
  });

  if (currentUser?.email === targetUser?.email) {
    return null;
  }

  if (isFollowing) {
    return (
      <Button
        onClick={() => unfollowMutation.mutate()}
        variant="outline"
        size="sm"
        className="border-2"
        style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
      >
        <UserCheck className="w-4 h-4 mr-1" />
        Following
      </Button>
    );
  }

  if (pendingRequest) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="border-2"
        style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
      >
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Button>
    );
  }

  return (
    <Button
      onClick={() => sendRequestMutation.mutate()}
      size="sm"
      className="border-0"
      style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
    >
      <UserPlus className="w-4 h-4 mr-1" />
      Add Friend
    </Button>
  );
}
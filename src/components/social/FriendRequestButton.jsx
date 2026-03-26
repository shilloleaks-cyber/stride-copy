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

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 11px', borderRadius: 9,
    fontSize: 11, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollowMutation.mutate()}
        style={{
          ...btnBase,
          background: 'rgba(138,43,226,0.10)',
          border: '1px solid rgba(138,43,226,0.35)',
          color: 'rgba(138,43,226,0.9)',
        }}
      >
        <UserCheck style={{ width: 12, height: 12 }} />
        Following
      </button>
    );
  }

  if (pendingRequest) {
    return (
      <button
        disabled
        style={{
          ...btnBase,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'default',
        }}
      >
        <Clock style={{ width: 12, height: 12 }} />
        Pending
      </button>
    );
  }

  return (
    <button
      onClick={() => sendRequestMutation.mutate()}
      style={{
        ...btnBase,
        background: 'rgba(191,255,0,0.08)',
        border: '1px solid rgba(191,255,0,0.35)',
        color: '#BFFF00',
        boxShadow: '0 0 10px rgba(191,255,0,0.10)',
      }}
    >
      <UserPlus style={{ width: 12, height: 12 }} />
      Add Friend
    </button>
  );
}
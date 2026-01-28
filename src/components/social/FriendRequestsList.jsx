import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FriendRequestsList({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['friendRequests', currentUser?.email],
    queryFn: () =>
      base44.entities.FriendRequest.filter({
        receiver_email: currentUser?.email,
        status: 'pending',
      }),
    enabled: !!currentUser?.email,
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ requestId, accept, senderEmail }) => {
      await base44.entities.FriendRequest.update(requestId, {
        status: accept ? 'accepted' : 'rejected',
      });

      if (accept) {
        // Create mutual follows
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: senderEmail,
        });
        await base44.entities.Follow.create({
          follower_email: senderEmail,
          following_email: currentUser.email,
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['friendRequests']);
      queryClient.invalidateQueries(['follows']);
      toast.success(variables.accept ? 'ยอมรับคำขอแล้ว!' : 'ปฏิเสธคำขอแล้ว');
    },
  });

  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400">Friend Requests ({requests.length})</h3>
      {requests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#8A2BE2' }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{request.sender_name}</p>
              <p className="text-xs text-gray-500">wants to be your friend</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                handleRequestMutation.mutate({
                  requestId: request.id,
                  accept: true,
                  senderEmail: request.sender_email,
                })
              }
              size="sm"
              className="border-0"
              style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={() =>
                handleRequestMutation.mutate({
                  requestId: request.id,
                  accept: false,
                  senderEmail: request.sender_email,
                })
              }
              size="sm"
              variant="outline"
              style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
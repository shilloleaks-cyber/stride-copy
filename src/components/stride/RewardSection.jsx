import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Star, Zap, CheckCircle2, Loader2 } from 'lucide-react';

const REWARD_ICONS = {
  coupon: Gift,
  coins: Zap,
  badge: Star,
  other: Gift,
};

function RewardCard({ reward, onRedeem, isRedeeming }) {
  const Icon = REWARD_ICONS[reward.reward_type] || Gift;
  const isRedeemed = reward.status === 'redeemed';

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: isRedeemed ? 'rgba(255,255,255,0.03)' : 'rgba(191,255,0,0.06)',
      border: `1px solid ${isRedeemed ? 'rgba(255,255,255,0.06)' : 'rgba(191,255,0,0.2)'}`,
    }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{
          background: isRedeemed ? 'rgba(255,255,255,0.05)' : 'rgba(191,255,0,0.12)',
        }}>
          <Icon className="w-5 h-5" style={{ color: isRedeemed ? 'rgba(255,255,255,0.3)' : '#BFFF00' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: isRedeemed ? 'rgba(255,255,255,0.4)' : 'white' }}>
            {reward.reward_label || reward.reward_type}
          </p>
          <p className="text-xs capitalize mt-0.5" style={{ color: isRedeemed ? 'rgba(255,255,255,0.25)' : 'rgba(191,255,0,0.7)' }}>
            {reward.reward_type}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isRedeemed ? (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Used</span>
            </div>
          ) : (
            <button
              onClick={() => onRedeem(reward)}
              disabled={isRedeeming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: '#BFFF00', color: '#0A0A0A' }}
            >
              {isRedeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Redeem
            </button>
          )}
        </div>
      </div>

      {/* Redeemed timestamp */}
      {isRedeemed && reward.redeemed_at && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Redeemed {new Date(reward.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function RewardSection({ registrationId, userEmail }) {
  const queryClient = useQueryClient();
  const [redeemingId, setRedeemingId] = useState(null);

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', registrationId],
    queryFn: () => base44.entities.EventRewardUnlock.filter({ registration_id: registrationId, user_email: userEmail }),
    enabled: !!registrationId && !!userEmail,
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      // Guard: prevent duplicate redemption
      if (reward.status === 'redeemed') throw new Error('Already redeemed');
      await base44.entities.EventRewardUnlock.update(reward.id, {
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
      });
    },
    onMutate: (reward) => setRedeemingId(reward.id),
    onSettled: () => {
      setRedeemingId(null);
      queryClient.invalidateQueries({ queryKey: ['rewards', registrationId] });
    },
  });

  if (rewards.length === 0) return null;

  const unlocked = rewards.filter(r => r.status === 'unlocked');
  const redeemed = rewards.filter(r => r.status === 'redeemed');

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#BFFF00' }}>
        🎁 Rewards · {unlocked.length} available
      </p>
      <div className="space-y-2">
        {/* Unlocked first */}
        {unlocked.map(r => (
          <RewardCard
            key={r.id}
            reward={r}
            onRedeem={(reward) => redeemMutation.mutate(reward)}
            isRedeeming={redeemingId === r.id}
          />
        ))}
        {/* Redeemed below */}
        {redeemed.map(r => (
          <RewardCard
            key={r.id}
            reward={r}
            onRedeem={() => {}}
            isRedeeming={false}
          />
        ))}
      </div>
    </div>
  );
}
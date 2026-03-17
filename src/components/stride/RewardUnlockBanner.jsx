import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, Star, Coins } from 'lucide-react';

const REWARD_ICONS = {
  coupon: Gift,
  coins: Coins,
  badge: Star,
  other: Gift,
};

export default function RewardUnlockBanner({ registrationId, userEmail }) {
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', registrationId],
    queryFn: () => base44.entities.EventRewardUnlock.filter({ registration_id: registrationId, user_email: userEmail }),
    enabled: !!registrationId && !!userEmail,
  });

  if (rewards.length === 0) return null;

  return (
    <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: 'rgba(191,255,0,0.07)', border: '1px solid rgba(191,255,0,0.2)' }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#BFFF00' }}>🎁 Rewards Unlocked</p>
      {rewards.map(r => {
        const Icon = REWARD_ICONS[r.reward_type] || Gift;
        return (
          <div key={r.id} className="flex items-center gap-2">
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#BFFF00' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{r.reward_label || r.reward_type}</p>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
              style={r.status === 'redeemed'
                ? { background: 'rgba(138,43,226,0.2)', color: '#BFFF00' }
                : { background: 'rgba(0,210,110,0.12)', color: 'rgb(0,210,110)' }
              }
            >
              {r.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
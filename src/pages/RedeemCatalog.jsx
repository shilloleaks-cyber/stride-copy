import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Coins, Play, Sparkles, ShoppingBag, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function RedeemCatalog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.RewardItem.filter({ is_active: true }),
  });

  const { data: userRedemptions = [] } = useQuery({
    queryKey: ['userRedemptions', user?.email],
    queryFn: () => base44.entities.Redemption.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const redeemMutation = useMutation({
    mutationFn: async ({ reward }) => {
      // Create redemption record
      await base44.entities.Redemption.create({
        user_email: user.email,
        reward_id: reward.id,
        reward_name: reward.name,
        coin_price: reward.coin_price,
      });

      // Deduct coins from user
      await base44.auth.updateMe({
        total_coins: user.total_coins - reward.coin_price,
      });

      // Update stock if merch
      if (reward.category === 'merch' && reward.stock !== null) {
        await base44.entities.RewardItem.update(reward.id, {
          stock: reward.stock - 1,
        });
      }
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#BFFF00', '#8A2BE2', '#FFFFFF'],
      });
      toast.success('Reward redeemed successfully!');
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['rewards']);
      queryClient.invalidateQueries(['userRedemptions']);
    },
  });

  const coinBalance = user?.total_coins || 0;

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'digital', label: 'Digital' },
    { id: 'merch', label: 'Merch' },
    { id: 'easy', label: 'Easy' },
    { id: 'limited', label: 'Limited' },
  ];

  const filteredRewards = rewards.filter(reward => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'digital' || activeFilter === 'merch') {
      return reward.category === activeFilter;
    }
    return reward.rarity === activeFilter;
  });

  const quickRedeemItems = rewards.filter(reward => {
    const percentageNeeded = (reward.coin_price - coinBalance) / reward.coin_price;
    return coinBalance >= reward.coin_price || percentageNeeded < 0.3;
  }).slice(0, 3);

  const digitalRewards = filteredRewards.filter(r => r.category === 'digital');
  const merchRewards = filteredRewards.filter(r => r.category === 'merch');

  const canRedeem = (reward) => {
    if (coinBalance < reward.coin_price) return false;
    if (reward.category === 'merch' && reward.stock !== null && reward.stock <= 0) return false;
    return true;
  };

  const handleRedeem = (reward) => {
    redeemMutation.mutate({ reward });
  };

  const getRarityBadge = (rarity) => {
    const badges = {
      easy: { text: 'EASY', color: '#10b981' },
      rare: { text: 'RARE', color: '#8A2BE2' },
      limited: { text: 'LIMITED', color: '#ef4444' },
    };
    return badges[rarity] || badges.easy;
  };

  return (
    <div className="min-h-screen text-white pb-24" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 px-6 pt-6 pb-4 border-b" style={{ backgroundColor: '#0A0A0A', borderColor: 'rgba(138, 43, 226, 0.3)' }}>
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium">Redeem</h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(191, 255, 0, 0.1)' }}>
            <Coins className="w-4 h-4" style={{ color: '#BFFF00' }} />
            <span className="font-semibold" style={{ color: '#BFFF00' }}>{coinBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeFilter === filter.id ? 'border-2' : 'border'
              }`}
              style={{
                backgroundColor: activeFilter === filter.id ? 'rgba(138, 43, 226, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: activeFilter === filter.id ? '#8A2BE2' : 'rgba(255, 255, 255, 0.1)',
                color: activeFilter === filter.id ? '#8A2BE2' : '#999',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Redeem Section */}
      {quickRedeemItems.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Quick Redeem</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickRedeemItems.map(reward => {
              const canRedeemNow = canRedeem(reward);
              const coinsNeeded = reward.coin_price - coinBalance;
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-xl p-3 border ${canRedeemNow ? 'ring-1' : ''}`}
                  style={{
                    backgroundColor: canRedeemNow ? 'rgba(191, 255, 0, 0.05)' : 'rgba(138, 43, 226, 0.05)',
                    borderColor: canRedeemNow ? '#BFFF00' : 'rgba(138, 43, 226, 0.3)',
                    ringColor: canRedeemNow ? 'rgba(191, 255, 0, 0.3)' : 'transparent',
                    boxShadow: canRedeemNow ? '0 0 20px rgba(191, 255, 0, 0.2)' : 'none',
                  }}
                >
                  <div className="aspect-square rounded-lg mb-2 bg-white/5 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-white truncate mb-1">{reward.name}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <Coins className="w-3 h-3" style={{ color: '#BFFF00' }} />
                    <span className="text-xs font-medium" style={{ color: '#BFFF00' }}>{reward.coin_price}</span>
                  </div>
                  {canRedeemNow ? (
                    <p className="text-xs font-medium" style={{ color: '#10b981' }}>You can redeem</p>
                  ) : (
                    <p className="text-xs" style={{ color: '#8A2BE2' }}>Need {coinsNeeded} coins</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Digital Rewards */}
      {digitalRewards.length > 0 && (
        <div className="px-6 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" style={{ color: '#8A2BE2' }} />
            <h2 className="text-xs uppercase tracking-widest text-gray-500">Digital Rewards</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {digitalRewards.map(reward => {
              const canRedeemNow = canRedeem(reward);
              const coinsNeeded = reward.coin_price - coinBalance;
              const badge = getRarityBadge(reward.rarity);

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl overflow-hidden border ${canRedeemNow ? 'ring-1' : ''}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    ringColor: canRedeemNow ? 'rgba(191, 255, 0, 0.3)' : 'transparent',
                    boxShadow: canRedeemNow ? '0 0 20px rgba(191, 255, 0, 0.15)' : 'none',
                  }}
                >
                  <div className="aspect-square bg-white/5 relative flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-gray-700" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: badge.color, color: '#fff' }}>
                      {badge.text}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-white mb-1 truncate">{reward.name}</p>
                    <div className="flex items-center gap-1 mb-3">
                      <Coins className="w-3.5 h-3.5" style={{ color: '#BFFF00' }} />
                      <span className="text-sm font-semibold" style={{ color: '#BFFF00' }}>{reward.coin_price}</span>
                    </div>
                    {canRedeemNow ? (
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={redeemMutation.isPending}
                        className="w-full h-8 text-xs font-semibold rounded-lg"
                        style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                      >
                        Redeem
                      </Button>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Need {coinsNeeded} coins</p>
                        <Button
                          onClick={() => navigate(createPageUrl('ActiveRun'))}
                          variant="outline"
                          className="w-full h-8 text-xs"
                          style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
                        >
                          Run Now
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Merch */}
      {merchRewards.length > 0 && (
        <div className="px-6 mt-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4" style={{ color: '#8A2BE2' }} />
            <h2 className="text-xs uppercase tracking-widest text-gray-500">Merchandise</h2>
          </div>
          <div className="space-y-4">
            {merchRewards.map(reward => {
              const canRedeemNow = canRedeem(reward);
              const coinsNeeded = reward.coin_price - coinBalance;
              const badge = getRarityBadge(reward.rarity);
              const isLimited = reward.rarity === 'limited';

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-2xl overflow-hidden border ${isLimited ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: isLimited ? 'rgba(138, 43, 226, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isLimited ? '0 0 30px rgba(138, 43, 226, 0.3)' : 'none',
                  }}
                >
                  <div className="aspect-video bg-white/5 relative flex items-center justify-center">
                    <Gift className="w-16 h-16 text-gray-700" />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: badge.color, color: '#fff' }}>
                      {badge.text}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-lg font-medium text-white mb-1">{reward.name}</p>
                        <p className="text-sm text-gray-500">{reward.description || 'Premium merchandise'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(191, 255, 0, 0.1)' }}>
                        <Coins className="w-4 h-4" style={{ color: '#BFFF00' }} />
                        <span className="font-semibold" style={{ color: '#BFFF00' }}>{reward.coin_price}</span>
                      </div>
                    </div>
                    {reward.stock !== null && (
                      <p className="text-xs mb-3" style={{ color: reward.stock < 10 ? '#ef4444' : '#8A2BE2' }}>
                        {reward.stock} left in stock
                      </p>
                    )}
                    {canRedeemNow ? (
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={redeemMutation.isPending}
                        className="w-full h-12 text-sm font-semibold rounded-xl"
                        style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
                      >
                        Redeem Now
                      </Button>
                    ) : (
                      <div>
                        <p className="text-sm mb-2" style={{ color: '#8A2BE2' }}>Need {coinsNeeded} more coins</p>
                        <Button
                          onClick={() => navigate(createPageUrl('ActiveRun'))}
                          variant="outline"
                          className="w-full h-12 text-sm"
                          style={{ borderColor: '#8A2BE2', color: '#8A2BE2' }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run Now
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRewards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-12 text-center"
        >
          <Sparkles className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 mb-6">Run more to unlock rewards</p>
          <Button
            onClick={() => navigate(createPageUrl('ActiveRun'))}
            className="h-12 px-8 text-sm font-semibold rounded-xl"
            style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
          >
            <Play className="w-4 h-4 mr-2" />
            Start Run
          </Button>
        </motion.div>
      )}
    </div>
  );
}
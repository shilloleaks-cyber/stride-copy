import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Check, Coins, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SkinsShop({ user, skinType = 'route' }) {
  const [selectedSkin, setSelectedSkin] = useState(null);
  const queryClient = useQueryClient();

  const { data: skins = [] } = useQuery({
    queryKey: ['skins', skinType],
    queryFn: () => base44.entities.ItemSkin.filter({ item_type: skinType }),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', user?.email],
    queryFn: () => base44.entities.UserInventory.filter({ user_email: user.email }),
    enabled: !!user
  });

  const ownedSkinIds = inventory.map(i => i.item_id);

  const purchaseMutation = useMutation({
    mutationFn: async (skinId) => {
      const skin = skins.find(s => s.id === skinId);
      
      const currentBalance = user?.coin_balance ?? user?.total_coins ?? 0;

      // Check if user can afford
      if (currentBalance < skin.cost_coins) {
        throw new Error('Not enough coins');
      }

      // Deduct coins
      await base44.auth.updateMe({
        coin_balance: currentBalance - skin.cost_coins
      });

      // Add to inventory
      await base44.entities.UserInventory.create({
        user_email: user.email,
        item_id: skinId,
        acquired_date: new Date().toISOString()
      });

      return skin;
    },
    onSuccess: () => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['user']);
    }
  });

  const equipMutation = useMutation({
    mutationFn: async (skinId) => {
      const fieldMap = {
        route: 'equipped_route_skin',
        coin: 'equipped_coin_skin',
        badge: 'equipped_badge',
        theme: 'equipped_theme'
      };
      
      await base44.auth.updateMe({
        [fieldMap[skinType]]: skinId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
    }
  });

  const getEquippedSkinId = () => {
    const fieldMap = {
      route: user?.equipped_route_skin,
      coin: user?.equipped_coin_skin,
      badge: user?.equipped_badge,
      theme: user?.equipped_theme
    };
    return fieldMap[skinType];
  };

  const equippedSkinId = getEquippedSkinId();

  const handleSkinClick = (skin) => {
    setSelectedSkin(skin);
  };

  const handlePurchase = async () => {
    if (selectedSkin) {
      try {
        await purchaseMutation.mutateAsync(selectedSkin.id);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleEquip = async () => {
    if (selectedSkin) {
      await equipMutation.mutateAsync(selectedSkin.id);
    }
  };

  const isOwned = (skinId) => ownedSkinIds.includes(skinId) || skins.find(s => s.id === skinId)?.is_default;
  const isLocked = (skin) => {
    if (skin.is_default) return false;
    if (user.current_level < skin.unlock_level) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {skins.map(skin => {
          const owned = isOwned(skin.id);
          const locked = isLocked(skin);
          const equipped = equippedSkinId === skin.id;

          return (
            <motion.button
              key={skin.id}
              onClick={() => !locked && handleSkinClick(skin)}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square rounded-2xl border p-4 transition-all ${
                locked
                  ? 'bg-white/5 border-white/10 opacity-50'
                  : equipped
                  ? 'bg-emerald-500/20 border-emerald-500/50'
                  : selectedSkin?.id === skin.id
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Preview */}
              <div 
                className="w-full h-20 rounded-xl mb-2"
                style={{ 
                  background: `linear-gradient(135deg, ${skin.preview_color} 0%, ${skin.preview_color}80 100%)`,
                  boxShadow: equipped ? `0 0 20px ${skin.preview_color}40` : 'none'
                }}
              />

              {/* Name */}
              <p className="text-sm font-medium text-white text-center mb-1">{skin.name}</p>

              {/* Status */}
              <div className="flex items-center justify-center gap-1">
                {locked ? (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Lock className="w-3 h-3" />
                    <span>Lv.{skin.unlock_level}</span>
                  </div>
                ) : equipped ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check className="w-3 h-3" />
                    <span>Equipped</span>
                  </div>
                ) : owned ? (
                  <span className="text-xs text-gray-400">Owned</span>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Coins className="w-3 h-3" />
                    <span>{skin.cost_coins}</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Skin Actions */}
      {selectedSkin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-xl flex-shrink-0"
              style={{ 
                background: `linear-gradient(135deg, ${selectedSkin.preview_color} 0%, ${selectedSkin.preview_color}80 100%)` 
              }}
            />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{selectedSkin.name}</h3>
              <p className="text-sm text-gray-400">{selectedSkin.description}</p>
            </div>
          </div>

          {isOwned(selectedSkin.id) ? (
            <button
              onClick={handleEquip}
              disabled={equipMutation.isPending || equippedSkinId === selectedSkin.id}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {equippedSkinId === selectedSkin.id ? 'Equipped' : 'Equip'}
            </button>
          ) : isLocked(selectedSkin) ? (
            <div className="text-center py-3 bg-white/5 rounded-xl">
              <Lock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-400">
                Unlock at Level {selectedSkin.unlock_level}
              </p>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending || (user?.coin_balance ?? user?.total_coins ?? 0) < selectedSkin.cost_coins}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Coins className="w-5 h-5" />
              <span>Purchase ({selectedSkin.cost_coins} coins)</span>
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

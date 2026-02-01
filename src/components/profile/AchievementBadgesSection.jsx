import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AchievementBadgeDetailModal from './AchievementBadgeDetailModal';

export default function AchievementBadgesSection({ stats }) {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // Fetch achievements with auto-seed and sorting
  const { data: rawAchievements = [], refetch: refetchAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list('display_order', 100),
  });

  // Auto-seed if not exactly 8 achievements
  React.useEffect(() => {
    const seedIfNeeded = async () => {
      if (rawAchievements.length !== 8 && user) {
        try {
          await base44.functions.invoke('seedAchievements', {});
          await refetchAchievements();
        } catch (error) {
          console.log('Could not seed achievements:', error);
        }
      }
    };
    seedIfNeeded();
  }, [rawAchievements.length, user]);

  // Sort by display_order
  const achievements = React.useMemo(() => {
    return [...rawAchievements].sort((a, b) => 
      (a.display_order || 0) - (b.display_order || 0)
    );
  }, [rawAchievements]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', user?.email],
    queryFn: () => base44.entities.UserAchievement.filter({ user_email: user.email }),
    enabled: !!user,
  });

  // Map user achievements
  const achievementsWithStatus = achievements.map(achievement => {
    const userAch = userAchievements.find(ua => ua.achievement_id === achievement.id);
    return {
      ...achievement,
      unlocked: !!userAch,
      userAchievement: userAch,
    };
  });

  const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length;
  const totalCount = achievementsWithStatus.length;

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
  };

  return (
    <>
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4" style={{ color: '#BFFF00', filter: 'drop-shadow(0 0 4px rgba(191, 255, 0, 0.4))' }} />
            <h2 className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Achievement Badges
            </h2>
            <span className="text-xs font-bold" style={{ color: '#BFFF00' }}>
              {unlockedCount}/8
            </span>
          </div>
          <button 
            onClick={() => setShowAllModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: 'rgba(191, 255, 0, 0.12)',
              border: '1px solid rgba(191, 255, 0, 0.3)',
              color: '#BFFF00',
              boxShadow: '0 0 10px rgba(191, 255, 0, 0.2)',
            }}
          >
            <Info className="w-3 h-3" />
            Details
          </button>
        </div>

        <div className="h-px mb-4" style={{
          background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.4) 20%, rgba(191, 255, 0, 0.3) 50%, rgba(138, 43, 226, 0.4) 80%, transparent)',
        }} />

        <div className="grid grid-cols-4 gap-3">
          {achievementsWithStatus.slice(0, 8).map((achievement, index) => (
            <motion.button
              key={achievement.id}
              onClick={() => handleBadgeClick(achievement)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: achievement.unlocked ? 1 : 0.9, 
                opacity: achievement.unlocked ? 1 : 0.4 
              }}
              transition={{ delay: index * 0.05 }}
              whileHover={achievement.unlocked ? { scale: 1.08 } : { scale: 0.92 }}
              whileTap={{ scale: 0.95 }}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden border-2 cursor-pointer"
              style={{
                background: achievement.unlocked 
                  ? 'radial-gradient(circle at top, rgba(138, 43, 226, 0.25), rgba(10, 10, 10, 0.4))'
                  : 'rgba(255, 255, 255, 0.03)',
                borderColor: achievement.unlocked 
                  ? 'rgba(191, 255, 0, 0.4)' 
                  : 'rgba(255, 255, 255, 0.1)',
                boxShadow: achievement.unlocked 
                  ? '0 0 20px rgba(138, 43, 226, 0.3), 0 0 0 1px rgba(191, 255, 0, 0.15) inset'
                  : 'none',
              }}
            >
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.6)' }}>
                  <span className="text-2xl">🔒</span>
                </div>
              )}
              <span className="text-2xl mb-1" style={{
                filter: achievement.unlocked ? 'drop-shadow(0 0 6px rgba(191, 255, 0, 0.3))' : 'none',
              }}>
                {achievement.badge_emoji || '🏆'}
              </span>
              <p className="text-[10px] text-center leading-tight" style={{ 
                color: achievement.unlocked ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)' 
              }}>
                {achievement.title}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AchievementBadgeDetailModal
        isOpen={!!selectedBadge && !showAllModal}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
        userAchievement={selectedBadge?.userAchievement}
        user={user}
      />

      {/* All Badges List Modal */}
      {showAllModal && (
        <AllBadgesModal
          achievements={achievementsWithStatus}
          onClose={() => setShowAllModal(false)}
          onSelectBadge={(badge) => {
            setShowAllModal(false);
            setSelectedBadge(badge);
          }}
          user={user}
        />
      )}
    </>
  );
}

// All Badges List Modal Component
function AllBadgesModal({ achievements, onClose, onSelectBadge, user }) {
  const [claimedAmounts, setClaimedAmounts] = useState({});

  useEffect(() => {
    const fetchClaimedAmounts = async () => {
      if (!user) return;
      
      const amounts = {};
      for (const achievement of achievements) {
        try {
          // Query WalletLog with achievement_id for accurate tracking
          const logs = await base44.entities.WalletLog.filter({
            user: user.email,
            source_type: 'achievement',
            achievement_id: achievement.id
          });
          
          if (logs.length > 0) {
            const sum = logs.reduce((acc, log) => acc + (log.amount || 0), 0);
            amounts[achievement.id] = sum;
          } else {
            amounts[achievement.id] = 0;
          }
        } catch (error) {
          amounts[achievement.id] = 0;
        }
      }
      setClaimedAmounts(amounts);
    };

    fetchClaimedAmounts();
  }, [achievements, user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="badgeModalOverlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="badgeModalSheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>
            <h3 className="badgeTitle">All Achievement Badges</h3>
            <p className="badgeSubtitle">
              {achievements.filter(a => a.unlocked).length} / 8 Unlocked
            </p>
            <div className="summaryCoinInfo">
              <div className="summaryRow">
                <span className="summaryLabel">Total rewards available:</span>
                <span className="summaryValue">
                  {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.reward_coins || 0), 0).toFixed(0)} coins
                </span>
              </div>
              <div className="summaryRow">
                <span className="summaryLabel">Total claimed:</span>
                <span className="summaryValue claimed">
                  {Object.values(claimedAmounts).reduce((sum, val) => sum + val, 0).toFixed(0)} coins
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="closeBtn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="badgesList">
          {achievements.map((achievement) => (
            <button
              key={achievement.id}
              onClick={() => onSelectBadge(achievement)}
              className="badgeListItem"
              style={{
                opacity: achievement.unlocked ? 1 : 0.5,
              }}
            >
              <div className="badgeListIcon" style={{
                background: achievement.unlocked 
                  ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(191, 255, 0, 0.2))'
                  : 'rgba(255, 255, 255, 0.05)',
                border: achievement.unlocked 
                  ? '2px solid rgba(191, 255, 0, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                {achievement.unlocked ? achievement.badge_emoji || '🏆' : '🔒'}
              </div>
              <div className="badgeListContent">
                <div className="badgeListName">{achievement.title}</div>
                <div className="badgeListReward">
                  Reward: {achievement.reward_coins} coins
                </div>
                {claimedAmounts[achievement.id] !== undefined && claimedAmounts[achievement.id] > 0 && (
                  <div className="badgeListClaimed">
                    Claimed: {claimedAmounts[achievement.id].toFixed(0)} coins
                  </div>
                )}
                {!achievement.unlocked && (
                  <div className="badgeListLocked">🔒 Locked</div>
                )}
              </div>
              <div className="badgeListArrow">›</div>
            </button>
          ))}
        </div>

        <style>{allBadgesStyles}</style>
      </motion.div>
    </motion.div>
  );
}

const allBadgesStyles = `
.badgeModalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.badgeModalSheet {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: radial-gradient(circle at top, rgba(43, 11, 63, 0.95), rgba(10, 10, 10, 0.98));
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border: 1px solid rgba(138, 43, 226, 0.4);
  box-shadow: 
    0 0 60px rgba(138, 43, 226, 0.4),
    0 0 0 1px rgba(191, 255, 0, 0.1) inset;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}

.modalHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.badgeTitle {
  font-size: 20px;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0 0 4px;
}

.badgeSubtitle {
  font-size: 13px;
  color: #BFFF00;
  font-weight: 600;
  margin-bottom: 12px;
}

.summaryCoinInfo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(191, 255, 0, 0.08);
  border: 1px solid rgba(191, 255, 0, 0.2);
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.summaryLabel {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.summaryValue {
  color: #BFFF00;
  font-weight: 700;
}

.summaryValue.claimed {
  color: rgba(191, 255, 0, 0.8);
}

.closeBtn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.closeBtn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
}

.badgesList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badgeListItem {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.badgeListItem:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(191, 255, 0, 0.3);
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.2);
}

.badgeListIcon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
}

.badgeListContent {
  flex: 1;
}

.badgeListName {
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
}

.badgeListReward {
  font-size: 12px;
  font-weight: 700;
  color: #BFFF00;
  margin-bottom: 2px;
}

.badgeListClaimed {
  font-size: 11px;
  font-weight: 600;
  color: rgba(191, 255, 0, 0.7);
}

.badgeListLocked {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.badgeListArrow {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
}
`;
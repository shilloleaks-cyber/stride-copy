import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle, Clock, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AchievementBadgeDetailModal({ isOpen, onClose, badge, userAchievement, user }) {
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [claimedAt, setClaimedAt] = useState(null);
  const [walletLog, setWalletLog] = useState(null);
  const [multiplier, setMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const isUnlocked = !!userAchievement;

  useEffect(() => {
    if (!isOpen || !badge) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch token config for multiplier
        const configs = await base44.entities.TokenConfig.list();
        const rewardMultiplier = configs[0]?.reward_multiplier ?? 1.0;
        setMultiplier(rewardMultiplier);

        if (isUnlocked) {
          // Check if already claimed using WalletLog with achievement_id
          const logs = await base44.entities.WalletLog.filter({
            user: user.email,
            source_type: 'achievement',
            achievement_id: badge.id
          });
          
          if (logs.length > 0) {
            const sum = logs.reduce((acc, log) => acc + (log.amount || 0), 0);
            setClaimedAmount(sum);
            setClaimedAt(logs[0].created_date);
            setWalletLog(logs[0]);
            setHasClaimed(true);
          } else {
            setHasClaimed(false);
            setClaimedAmount(0);
          }
        }
      } catch (error) {
        console.log('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, badge, userAchievement, user, isUnlocked]);

  const handleClaimReward = async () => {
    if (!isUnlocked || hasClaimed || claiming) return;
    
    setClaiming(true);
    try {
      const baseReward = badge.reward_coins || 0;
      const finalReward = baseReward * multiplier;

      // Create wallet log entry
      await base44.entities.WalletLog.create({
        user: user.email,
        amount: finalReward,
        source_type: 'achievement',
        achievement_id: badge.id,
        note: `Achievement reward: ${badge.title}`,
        base_reward: baseReward,
        final_reward: finalReward,
        multiplier_used: multiplier
      });

      // Update user coin balance
      const currentCoins = user.coin_balance || 0;
      await base44.auth.updateMe({ 
        coin_balance: currentCoins + finalReward 
      });

      // Mark as claimed
      await base44.entities.UserAchievement.update(userAchievement.id, {
        claimed_at: new Date().toISOString(),
        final_reward: finalReward
      });

      // Update state
      setHasClaimed(true);
      setClaimedAmount(finalReward);
      setClaimedAt(new Date().toISOString());

      // Close modal and refresh
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('เกิดข้อผิดพลาดในการเคลมรางวัล');
    } finally {
      setClaiming(false);
    }
  };

  if (!badge) return null;

  const baseReward = badge.reward_coins || 0;
  const finalReward = baseReward * multiplier;

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* Header */}
            <div className="modalHeader">
              <div className="modalHeaderLeft">
                <div className="badgeIconLarge">
                  {badge.badge_emoji || '🏆'}
                </div>
                <div>
                  <h3 className="badgeTitle">{badge.title}</h3>
                  <div className={`statusChip ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    {isUnlocked ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Unlocked</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="closeBtn">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            {badge.description && (
              <div className="modalDescription">
                {badge.description}
              </div>
            )}

            <div className="modalDivider" />

            {/* Rewards Section */}
            <div className="modalSection">
              <div className="sectionLabel">
                <Award className="w-4 h-4" />
                <span>REWARD</span>
              </div>
              <div className="rewardGrid">
                <div className="rewardItem">
                  <div className="rewardLabel">Base Reward</div>
                  <div className="rewardValue">{baseReward} <span className="coinUnit">coins</span></div>
                </div>
                <div className="rewardItem">
                  <div className="rewardLabel">Multiplier</div>
                  <div className="rewardValue multiplier">×{multiplier.toFixed(1)}</div>
                </div>
                <div className="rewardItem highlight">
                  <div className="rewardLabel">Final Reward</div>
                  <div className="rewardValue final">{finalReward.toFixed(2)} <span className="coinUnit">coins</span></div>
                </div>
              </div>
            </div>

            <div className="modalDivider" />

            {/* Claimed Section */}
            <div className="modalSection">
              <div className="sectionLabel">
                <Clock className="w-4 h-4" />
                <span>CLAIM STATUS</span>
              </div>
              
              {loading ? (
                <div className="loadingState">Loading...</div>
              ) : (
                <>
                  {isUnlocked ? (
                    <>
                      {hasClaimed ? (
                        <>
                          <div className="claimedAmount">
                            {claimedAmount.toFixed(2)} <span className="coinUnit">coins claimed</span>
                          </div>
                          {claimedAt && (
                            <div className="claimedDate">
                              Claimed at: {new Date(claimedAt).toLocaleString()}
                            </div>
                          )}
                          
                          {/* Wallet Log Proof */}
                          {walletLog && (
                            <div className="logProof">
                              <div className="logLabel">Transaction Log</div>
                              <div className="logDetails">
                                <div className="logRow">
                                  <span>Base:</span>
                                  <span>{walletLog.base_reward || baseReward} coins</span>
                                </div>
                                <div className="logRow">
                                  <span>Multiplier:</span>
                                  <span>×{walletLog.multiplier_used || multiplier}</span>
                                </div>
                                <div className="logRow">
                                  <span>Final:</span>
                                  <span className="logFinal">{walletLog.final_reward || walletLog.amount} coins</span>
                                </div>
                                <div className="logRow">
                                  <span>Date:</span>
                                  <span>{new Date(walletLog.created_date).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="unclaimedState">
                            <div className="unclaimedIcon">🎁</div>
                            <p className="unclaimedText">Reward ready to claim!</p>
                            <button 
                              className="claimButton" 
                              onClick={handleClaimReward}
                              disabled={claiming}
                            >
                              {claiming ? 'Claiming...' : `Claim ${finalReward.toFixed(2)} Coins`}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="lockedState">
                      <Lock className="w-8 h-8 lockIcon" />
                      <p className="lockedText">Complete the requirement to unlock this achievement</p>
                      <div className="lockedAmount">0 coins claimed</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          <style>{styles}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = `
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
  margin-bottom: 16px;
}

.modalHeaderLeft {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.badgeIconLarge {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(191, 255, 0, 0.2));
  border: 2px solid rgba(191, 255, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 
    0 0 20px rgba(138, 43, 226, 0.5),
    0 0 0 1px rgba(191, 255, 0, 0.2) inset;
  flex-shrink: 0;
}

.badgeTitle {
  font-size: 18px;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0 0 6px;
}

.statusChip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.statusChip.unlocked {
  background: rgba(191, 255, 0, 0.15);
  border: 1px solid rgba(191, 255, 0, 0.4);
  color: #BFFF00;
}

.statusChip.locked {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
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

.modalDescription {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.modalDivider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(138, 43, 226, 0.4) 20%,
    rgba(191, 255, 0, 0.3) 50%,
    rgba(138, 43, 226, 0.4) 80%,
    transparent
  );
  margin: 20px 0;
}

.modalSection {
  margin-bottom: 20px;
}

.sectionLabel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.rewardGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.rewardItem {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.rewardItem.highlight {
  grid-column: 1 / -1;
  background: rgba(191, 255, 0, 0.08);
  border-color: rgba(191, 255, 0, 0.3);
  box-shadow: 0 0 20px rgba(191, 255, 0, 0.15);
}

.rewardLabel {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}

.rewardValue {
  font-size: 22px;
  font-weight: 900;
  color: #FFFFFF;
}

.rewardValue.multiplier {
  color: #8A2BE2;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
}

.rewardValue.final {
  color: #BFFF00;
  font-size: 28px;
  text-shadow: 0 0 15px rgba(191, 255, 0, 0.5);
}

.coinUnit {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 4px;
}

.claimedAmount {
  font-size: 32px;
  font-weight: 900;
  color: #BFFF00;
  text-align: center;
  text-shadow: 0 0 20px rgba(191, 255, 0, 0.4);
  margin-bottom: 8px;
}

.claimedDate {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16px;
}

.logProof {
  margin-top: 16px;
  background: rgba(10, 10, 10, 0.5);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  padding: 12px;
}

.logLabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.logDetails {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.logRow {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.logRow span:first-child {
  color: rgba(255, 255, 255, 0.5);
}

.logFinal {
  color: #BFFF00;
  font-weight: 700;
}

.noLog {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  padding: 12px;
}

.lockedState {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  text-align: center;
}

.lockIcon {
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.lockedText {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.lockedAmount {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
}

.loadingState {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.unclaimedState {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  text-align: center;
}

.unclaimedIcon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: giftBounce 2s ease-in-out infinite;
}

@keyframes giftBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.unclaimedText {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

.claimButton {
  width: 100%;
  max-width: 280px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #BFFF00, #8FD400);
  color: #0A0A0A;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(191, 255, 0, 0.4);
  transition: all 0.2s;
}

.claimButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(191, 255, 0, 0.6);
}

.claimButton:active {
  transform: scale(0.98);
}

.claimButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 420px) {
  .badgeModalSheet {
    padding: 20px;
  }

  .badgeIconLarge {
    width: 50px;
    height: 50px;
    font-size: 26px;
  }

  .badgeTitle {
    font-size: 16px;
  }

  .rewardValue.final {
    font-size: 24px;
  }

  .claimedAmount {
    font-size: 28px;
  }
}
`;
import React from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Flame, Calendar, Gift, Award } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RewardBreakdownModal({ open, onClose, log }) {
  const navigate = useNavigate();

  if (!open || !log) return null;

  const safeJSONParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const breakdown = safeJSONParse(log.note);

  const getTitle = () => {
    if (log.source_type === 'run') return 'Run reward';
    if (log.source_type === 'achievement') return 'Achievement reward';
    return 'Wallet activity';
  };

  const handleViewRun = () => {
    if (log.run_id) {
      onClose();
      navigate(createPageUrl(`RunDetails?id=${log.run_id}`));
    }
  };

  // Compute values with fallbacks
  const baseReward = log.base_reward ?? 
    (breakdown ? (breakdown.distance || 0) + (breakdown.streak || 0) + (breakdown.daily || 0) + (breakdown.bonus || 0) : null);
  const multiplier = log.multiplier_used ?? 1.0;
  const finalReward = log.final_reward ?? log.amount;
  const credited = log.amount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.65)',
        backdropFilter: 'blur(14px)',
        zIndex: 9999,
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(16px + env(safe-area-inset-left))',
        paddingRight: 'calc(16px + env(safe-area-inset-right))',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, calc(100vw - 32px))',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          background: 'radial-gradient(circle at top, rgba(123, 77, 255, 0.18), rgba(5, 5, 8, 0.95))',
          border: '2px solid',
          borderImage: 'linear-gradient(135deg, rgba(123, 77, 255, 0.5), rgba(123, 77, 255, 0.2)) 1',
          boxShadow: '0 0 40px rgba(123, 77, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.7)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(5, 5, 8, 0.8)'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '4px',
              textShadow: '0 0 16px rgba(123, 77, 255, 0.4)'
            }}>
              {getTitle()}
            </h3>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {format(new Date(log.created_date), 'd MMM yyyy, HH:mm')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          maxHeight: 'calc(100dvh - 180px)',
          overflowY: 'auto',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          {/* Components Breakdown */}
          {breakdown && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
                fontWeight: 700
              }}>
                Reward Components
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {breakdown.distance > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <TrendingUp className="w-4 h-4" style={{ color: 'rgba(123, 77, 255, 0.8)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        Distance reward
                        {breakdown.distance_km && <span style={{ color: 'rgba(255, 255, 255, 0.4)', marginLeft: '6px' }}>
                          ({breakdown.distance_km.toFixed(2)} km)
                        </span>}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                      +{breakdown.distance.toFixed(2)}
                    </span>
                  </div>
                )}
                {breakdown.streak > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Flame className="w-4 h-4" style={{ color: 'rgba(255, 123, 77, 0.8)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>Streak bonus</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                      +{breakdown.streak.toFixed(2)}
                    </span>
                  </div>
                )}
                {breakdown.daily > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar className="w-4 h-4" style={{ color: 'rgba(123, 200, 255, 0.8)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>Daily bonus</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                      +{breakdown.daily.toFixed(2)}
                    </span>
                  </div>
                )}
                {breakdown.bonus > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gift className="w-4 h-4" style={{ color: 'rgba(255, 200, 77, 0.8)' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>Other bonus</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                      +{breakdown.bonus.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{
            padding: '16px',
            background: 'rgba(123, 77, 255, 0.08)',
            borderRadius: '16px',
            border: '1px solid rgba(123, 77, 255, 0.2)',
            boxShadow: '0 0 20px rgba(123, 77, 255, 0.15)'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              fontWeight: 700
            }}>
              Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {baseReward !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>Base reward</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                    {baseReward.toFixed(2)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>Multiplier</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(123, 77, 255, 0.9)' }}>
                  {multiplier.toFixed(2)}x
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>Final reward</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  {finalReward.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>Credited</span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#B6FF00', textShadow: '0 0 20px rgba(182, 255, 0, 0.5)' }}>
                  +{credited.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: '10px',
          background: 'rgba(5, 5, 8, 0.8)'
        }}>
          {log.run_id && (
            <button
              onClick={handleViewRun}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '12px',
                border: '1px solid rgba(123, 77, 255, 0.3)',
                background: 'rgba(123, 77, 255, 0.1)',
                color: 'rgba(123, 77, 255, 0.9)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Award className="w-4 h-4" />
              View Run
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: log.run_id ? 1 : 2,
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7B4DFF 0%, #5F3DC4 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 20px rgba(123, 77, 255, 0.4)'
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
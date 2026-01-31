import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Lock, Check, Trophy, Zap, Gift, Star, Award, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const LEVELS_CONFIG = [
  { level: 1, coinsRequired: 0, reward: 'Rookie Badge', icon: Trophy, description: 'Start your journey' },
  { level: 2, coinsRequired: 100, reward: 'Custom Route Color', icon: Zap, description: 'Personalize your runs' },
  { level: 3, coinsRequired: 250, reward: 'Streak Animation', icon: Star, description: 'Celebrate consistency' },
  { level: 4, coinsRequired: 500, reward: 'Friend Challenges', icon: Award, description: 'Compete with friends' },
  { level: 5, coinsRequired: 1000, reward: 'Weekly Tournament', icon: Crown, description: 'Join elite competitions' },
  { level: 6, coinsRequired: 1500, reward: 'Premium Stats', icon: Zap, description: 'Advanced analytics' },
  { level: 7, coinsRequired: 2500, reward: 'Redeem Merchandise', icon: Gift, description: 'Get exclusive gear' },
  { level: 8, coinsRequired: 4000, reward: 'VIP Badge', icon: Crown, description: 'Show your dedication' },
  { level: 9, coinsRequired: 6000, reward: 'Custom Achievements', icon: Star, description: 'Create your goals' },
  { level: 10, coinsRequired: 10000, reward: 'Special Frame', icon: Crown, description: 'Legendary status' },
];

export default function LevelProgress() {
  const navigate = useNavigate();
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showLevelUpOverlay, setShowLevelUpOverlay] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [isRare, setIsRare] = useState(false);
  const prevLevelRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const currentLevel = user?.current_level || 1;
  const totalCoins = user?.total_coins || 0;

  // Check for level up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      setNewLevel(currentLevel);
      setIsRare(Math.random() < 0.065);
      setShowLevelUpOverlay(true);
      
      const timer = setTimeout(() => {
        setShowLevelUpOverlay(false);
      }, 900);
      
      return () => clearTimeout(timer);
    }
    
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  const currentLevelConfig = LEVELS_CONFIG.find(l => l.level === currentLevel) || LEVELS_CONFIG[0];
  const nextLevelConfig = LEVELS_CONFIG.find(l => l.level === currentLevel + 1);

  const coinsForCurrentLevel = currentLevelConfig.coinsRequired;
  const coinsForNextLevel = nextLevelConfig?.coinsRequired || coinsForCurrentLevel;
  const coinsInCurrentLevel = totalCoins - coinsForCurrentLevel;
  const coinsNeededForNext = coinsForNextLevel - coinsForCurrentLevel;
  const progress = (coinsInCurrentLevel / coinsNeededForNext) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressPercentage(Math.min(progress, 100));
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  const isCloseToNextLevel = progress >= 75;

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Header */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(createPageUrl('Home'))}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-medium">Your Level</h1>
        <div className="w-10" />
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 pt-12 pb-8 flex flex-col items-center"
      >
        {/* Level Badge */}
        <motion.div
          animate={isCloseToNextLevel ? {
            boxShadow: [
              '0 0 30px rgba(138, 43, 226, 0.5)',
              '0 0 50px rgba(138, 43, 226, 0.8)',
              '0 0 30px rgba(138, 43, 226, 0.5)',
            ]
          } : {
            boxShadow: '0 0 30px rgba(138, 43, 226, 0.4)'
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center mb-6"
          style={{ borderColor: '#8A2BE2', backgroundColor: 'rgba(138, 43, 226, 0.1)' }}
        >
          <p className="text-5xl font-bold" style={{ color: '#BFFF00' }}>{currentLevel}</p>
          <p className="text-sm text-gray-400 mt-1">Level</p>
        </motion.div>

        {/* Coins Progress */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-sm mb-2">
            <span style={{ color: '#8A2BE2' }}>Progress</span>
            <span className="text-gray-400">
              {totalCoins.toLocaleString()} / {nextLevelConfig ? coinsForNextLevel.toLocaleString() : 'MAX'} coins
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ 
                backgroundColor: '#BFFF00',
                boxShadow: isCloseToNextLevel ? '0 0 15px rgba(191, 255, 0, 0.8)' : 'none'
              }}
            />
          </div>
          {nextLevelConfig && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {(coinsNeededForNext - coinsInCurrentLevel).toLocaleString()} coins to Level {currentLevel + 1}
            </p>
          )}
        </div>
      </motion.div>

      {/* Next Unlock */}
      {nextLevelConfig && (
        <div className="px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 border"
            style={{ 
              backgroundColor: 'rgba(138, 43, 226, 0.05)',
              borderColor: 'rgba(138, 43, 226, 0.3)'
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(191, 255, 0, 0.2)' }}>
                {React.createElement(nextLevelConfig.icon, { className: 'w-6 h-6', style: { color: '#BFFF00' } })}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400">Next Unlock</p>
                <p className="text-lg font-medium" style={{ color: '#8A2BE2' }}>{nextLevelConfig.reward}</p>
                <p className="text-xs text-gray-500 mt-0.5">Level <span style={{ color: '#BFFF00' }}>{nextLevelConfig.level}</span> • {nextLevelConfig.description}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Level Roadmap */}
      <div className="px-6 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Level Roadmap</h2>
        <div className="space-y-3">
          {LEVELS_CONFIG.map((levelConfig, index) => {
            const isUnlocked = currentLevel >= levelConfig.level;
            const isCurrent = currentLevel === levelConfig.level;
            
            return (
              <motion.div
                key={levelConfig.level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl p-4 border flex items-center gap-4 ${
                  isCurrent ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: isCurrent 
                    ? 'rgba(191, 255, 0, 0.05)' 
                    : isUnlocked 
                    ? 'rgba(138, 43, 226, 0.05)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isCurrent 
                    ? '#BFFF00' 
                    : isUnlocked 
                    ? 'rgba(138, 43, 226, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  ringColor: isCurrent ? '#BFFF00' : 'transparent',
                  boxShadow: isCurrent ? '0 0 20px rgba(191, 255, 0, 0.3)' : 'none'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: isUnlocked 
                      ? 'rgba(138, 43, 226, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)' 
                  }}
                >
                  {isUnlocked ? (
                    isCurrent ? (
                      <Star className="w-6 h-6" style={{ color: '#BFFF00' }} />
                    ) : (
                      <Check className="w-6 h-6" style={{ color: '#8A2BE2' }} />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: isCurrent ? '#BFFF00' : isUnlocked ? '#8A2BE2' : '#666' }}
                    >
                      Level {levelConfig.level}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                    {levelConfig.reward}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{levelConfig.description}</p>
                </div>
                
                <div className="text-right">
                  {React.createElement(levelConfig.icon, { 
                    className: 'w-5 h-5', 
                    style: { color: isUnlocked ? '#8A2BE2' : '#444' } 
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Coin Summary */}
      <div className="px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 border text-center"
          style={{ 
            backgroundColor: 'rgba(191, 255, 0, 0.05)',
            borderColor: 'rgba(191, 255, 0, 0.3)'
          }}
        >
          <p className="text-sm text-gray-400 mb-2">Total Coins Earned</p>
          <p className="text-5xl font-light mb-1" style={{ color: '#BFFF00' }}>
            {totalCoins.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Keep running to earn more!</p>
        </motion.div>
      </div>

      {/* Fixed CTA Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 px-6 py-4 border-t"
        style={{ 
          backgroundColor: '#0A0A0A',
          borderColor: 'rgba(138, 43, 226, 0.3)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
        }}
      >
        <Button
          onClick={() => navigate(createPageUrl('ActiveRun'))}
          className="w-full h-14 text-lg font-semibold border-0 rounded-2xl"
          style={{ backgroundColor: '#BFFF00', color: '#0A0A0A' }}
        >
          <Play className="w-5 h-5 mr-2" fill="#0A0A0A" />
          Run Now
        </Button>
      </div>
    </div>
  );
}
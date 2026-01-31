import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntervalTimer({ workoutType, isRunning, onIntervalChange }) {
  const [currentPhase, setCurrentPhase] = useState('warmup'); // warmup, work, rest, cooldown
  const [phaseTime, setPhaseTime] = useState(0);
  const [intervalCount, setIntervalCount] = useState(0);
  
  // Interval configurations
  const configs = {
    interval: {
      warmup: 300, // 5 min
      work: 180,   // 3 min fast
      rest: 90,    // 1.5 min recovery
      intervals: 6,
      cooldown: 300
    },
    tempo: {
      warmup: 600,  // 10 min
      work: 1200,   // 20 min tempo
      cooldown: 600
    },
    fartlek: {
      work: 120,    // 2 min fast
      rest: 180,    // 3 min easy
      intervals: 8
    }
  };
  
  const config = configs[workoutType] || null;
  
  useEffect(() => {
    if (!isRunning || !config) return;
    
    const interval = setInterval(() => {
      setPhaseTime(prev => prev + 1);
      
      // Phase transitions
      if (workoutType === 'interval') {
        if (currentPhase === 'warmup' && phaseTime >= config.warmup) {
          setCurrentPhase('work');
          setPhaseTime(0);
          setIntervalCount(1);
        } else if (currentPhase === 'work' && phaseTime >= config.work) {
          if (intervalCount < config.intervals) {
            setCurrentPhase('rest');
            setPhaseTime(0);
          } else {
            setCurrentPhase('cooldown');
            setPhaseTime(0);
          }
        } else if (currentPhase === 'rest' && phaseTime >= config.rest) {
          setCurrentPhase('work');
          setPhaseTime(0);
          setIntervalCount(prev => prev + 1);
        }
      }
      
      if (onIntervalChange) {
        onIntervalChange({ phase: currentPhase, phaseTime, intervalCount });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, phaseTime, currentPhase, intervalCount, config, workoutType, onIntervalChange]);
  
  if (!config || !isRunning) return null;
  
  const phaseConfig = {
    warmup: { label: 'WARM UP', color: '#95E1D3', emoji: '🔥' },
    work: { label: 'WORK', color: '#FF6B6B', emoji: '⚡' },
    rest: { label: 'REST', color: '#4ECDC4', emoji: '💧' },
    cooldown: { label: 'COOL DOWN', color: '#A8E6CF', emoji: '🌿' }
  };
  
  const current = phaseConfig[currentPhase];
  const maxTime = currentPhase === 'warmup' ? config.warmup :
                  currentPhase === 'work' ? config.work :
                  currentPhase === 'rest' ? config.rest :
                  config.cooldown;
  
  const progress = (phaseTime / maxTime) * 100;
  const timeRemaining = maxTime - phaseTime;
  
  return (
    <motion.div
      className="interval-timer"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ '--phase-color': current.color }}
    >
      <style>{styles}</style>
      
      <div className="interval-phase">
        <span className="interval-emoji">{current.emoji}</span>
        <span className="interval-label">{current.label}</span>
        {workoutType === 'interval' && currentPhase !== 'warmup' && currentPhase !== 'cooldown' && (
          <span className="interval-count">{intervalCount}/{config.intervals}</span>
        )}
      </div>
      
      <div className="interval-time">
        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
      </div>
      
      <div className="interval-progress-bar">
        <motion.div 
          className="interval-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

const styles = `
  .interval-timer {
    position: fixed;
    top: 120px;
    left: 16px;
    right: 16px;
    background: rgba(10,10,10,0.90);
    border: 1px solid var(--phase-color);
    border-radius: 18px;
    padding: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 30px rgba(0,0,0,0.50), 0 0 20px var(--phase-color);
    z-index: 100;
  }
  
  .interval-phase {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .interval-emoji {
    font-size: 20px;
    filter: drop-shadow(0 0 10px var(--phase-color));
  }
  
  .interval-label {
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 0.10em;
    color: var(--phase-color);
    flex: 1;
  }
  
  .interval-count {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.60);
    background: rgba(255,255,255,0.08);
    padding: 4px 10px;
    border-radius: 999px;
  }
  
  .interval-time {
    font-size: 42px;
    font-weight: 900;
    color: var(--phase-color);
    text-shadow: 0 0 20px var(--phase-color);
    margin-bottom: 12px;
  }
  
  .interval-progress-bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.10);
    overflow: hidden;
  }
  
  .interval-progress-fill {
    height: 100%;
    background: var(--phase-color);
    border-radius: 999px;
    box-shadow: 0 0 12px var(--phase-color);
  }
`;
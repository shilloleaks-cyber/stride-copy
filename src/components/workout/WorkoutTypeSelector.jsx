import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Mountain, Repeat, Wind, TrendingUp, Play } from 'lucide-react';

const workoutTypes = [
  {
    id: 'standard',
    name: 'Standard Run',
    icon: Play,
    description: 'Regular pace running',
    color: '#BFFF00',
    emoji: '🏃'
  },
  {
    id: 'interval',
    name: 'Interval Training',
    icon: Zap,
    description: 'High intensity intervals',
    color: '#FF6B6B',
    emoji: '⚡'
  },
  {
    id: 'tempo',
    name: 'Tempo Run',
    icon: TrendingUp,
    description: 'Sustained fast pace',
    color: '#4ECDC4',
    emoji: '🎯'
  },
  {
    id: 'long_run',
    name: 'Long Run',
    icon: Clock,
    description: 'Endurance building',
    color: '#95E1D3',
    emoji: '🛤️'
  },
  {
    id: 'recovery',
    name: 'Recovery',
    icon: Wind,
    description: 'Easy pace, low effort',
    color: '#A8E6CF',
    emoji: '🌿'
  },
  {
    id: 'fartlek',
    name: 'Fartlek',
    icon: Repeat,
    description: 'Speed play variations',
    color: '#FFD93D',
    emoji: '🎲'
  },
  {
    id: 'hill_repeats',
    name: 'Hill Repeats',
    icon: Mountain,
    description: 'Uphill power training',
    color: '#FF8B94',
    emoji: '⛰️'
  }
];

export default function WorkoutTypeSelector({ selectedType, onSelect, onStart }) {
  const [expanded, setExpanded] = React.useState(false);
  
  const selectedWorkout = workoutTypes.find(w => w.id === selectedType) || workoutTypes[0];
  
  return (
    <div className="workout-selector">
      <style>{styles}</style>
      
      {!expanded ? (
        <motion.button
          className="workout-chip"
          onClick={() => setExpanded(true)}
          whileTap={{ scale: 0.95 }}
        >
          <span className="workout-emoji">{selectedWorkout.emoji}</span>
          <span className="workout-name">{selectedWorkout.name}</span>
          <span className="workout-chevron">▼</span>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="workout-grid"
        >
          <div className="workout-header">
            <span>Select Workout Type</span>
            <button onClick={() => setExpanded(false)} className="close-btn">✕</button>
          </div>
          
          <div className="workout-cards">
            {workoutTypes.map((workout) => {
              const Icon = workout.icon;
              const isSelected = selectedType === workout.id;
              
              return (
                <motion.button
                  key={workout.id}
                  className={`workout-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(workout.id);
                    setExpanded(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    '--workout-color': workout.color
                  }}
                >
                  <div className="workout-card-icon">
                    <span className="workout-card-emoji">{workout.emoji}</span>
                  </div>
                  <div className="workout-card-content">
                    <div className="workout-card-name">{workout.name}</div>
                    <div className="workout-card-desc">{workout.description}</div>
                  </div>
                  {isSelected && (
                    <div className="workout-check">✓</div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const styles = `
  .workout-selector {
    padding: 0 16px;
    margin-bottom: 16px;
  }
  
  .workout-chip {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(20px);
    color: rgba(255,255,255,0.92);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .workout-chip:hover {
    background: rgba(255,255,255,0.12);
    border-color: rgba(191,255,0,0.30);
  }
  
  .workout-emoji {
    font-size: 24px;
    filter: drop-shadow(0 0 8px rgba(191,255,0,0.3));
  }
  
  .workout-name {
    flex: 1;
    text-align: left;
    font-weight: 700;
    font-size: 15px;
  }
  
  .workout-chevron {
    font-size: 12px;
    color: rgba(255,255,255,0.50);
  }
  
  .workout-grid {
    background: rgba(10,10,10,0.95);
    border: 1px solid rgba(191,255,0,0.20);
    border-radius: 20px;
    padding: 16px;
    backdrop-filter: blur(20px);
    box-shadow: 0 0 40px rgba(191,255,0,0.15);
  }
  
  .workout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.10);
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.70);
  }
  
  .close-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.70);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.92);
  }
  
  .workout-cards {
    display: grid;
    gap: 10px;
  }
  
  .workout-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .workout-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--workout-color);
  }
  
  .workout-card.selected {
    background: rgba(255,255,255,0.12);
    border-color: var(--workout-color);
    box-shadow: 0 0 20px rgba(191,255,0,0.20);
  }
  
  .workout-card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .workout-card.selected .workout-card-icon {
    background: rgba(191,255,0,0.15);
    border-color: rgba(191,255,0,0.30);
  }
  
  .workout-card-emoji {
    font-size: 22px;
  }
  
  .workout-card-content {
    flex: 1;
  }
  
  .workout-card-name {
    font-weight: 700;
    font-size: 14px;
    color: rgba(255,255,255,0.92);
    margin-bottom: 2px;
  }
  
  .workout-card-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.50);
  }
  
  .workout-check {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #BFFF00;
    color: #0A0A0A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
  }
`;
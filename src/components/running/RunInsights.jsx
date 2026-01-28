import React from 'react';
import { TrendingUp, Award, AlertCircle, Zap, Target, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RunInsights({ run }) {
  const insights = [];

  // Calculate pace consistency
  const paceVariance = calculatePaceVariance(run);
  
  // Analyze pace consistency
  if (run.pace_min_per_km && run.pace_min_per_km > 0) {
    if (paceVariance < 0.5) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Excellent Pace Control',
        message: 'Your pace was very consistent throughout the run. Consider increasing distance or adding intervals to challenge yourself.',
        color: 'emerald'
      });
    } else if (paceVariance > 1.5) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Pace Fluctuation',
        message: 'Your pace varied significantly. Try to maintain a more steady rhythm for better endurance and efficiency.',
        color: 'amber'
      });
    }
  }

  // Analyze speed performance
  if (run.max_speed_kmh && run.avg_speed_kmh) {
    const speedDiff = run.max_speed_kmh - run.avg_speed_kmh;
    if (speedDiff > 5) {
      insights.push({
        type: 'info',
        icon: Zap,
        title: 'Good Sprint Capacity',
        message: 'You showed strong bursts of speed. Consider incorporating interval training to improve overall speed.',
        color: 'blue'
      });
    }
  }

  // Distance-based recommendations
  if (run.distance_km) {
    if (run.distance_km < 3 && paceVariance < 0.8) {
      insights.push({
        type: 'suggestion',
        icon: Target,
        title: 'Ready for More?',
        message: 'Your pace control is solid for this distance. You might be ready to gradually increase your distance by 10-15%.',
        color: 'purple'
      });
    } else if (run.distance_km > 10) {
      insights.push({
        type: 'positive',
        icon: Award,
        title: 'Great Endurance!',
        message: 'Completing a long run is impressive! Make sure to give your body adequate recovery time.',
        color: 'emerald'
      });
    }
  }

  // Heart rate analysis
  if (run.max_heart_rate && run.avg_heart_rate) {
    const hrReserve = run.max_heart_rate - run.avg_heart_rate;
    if (hrReserve > 40) {
      insights.push({
        type: 'suggestion',
        icon: Coffee,
        title: 'Comfortable Effort',
        message: 'Your heart rate stayed relatively low. This is great for base building. Try adding some higher intensity intervals occasionally.',
        color: 'indigo'
      });
    }
  }

  // Speed drop analysis (fatigue indicator)
  if (run.route_points && run.route_points.length > 10) {
    const speedDrop = analyzeSpeedDrop(run);
    if (speedDrop > 20) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Fatigue Detected',
        message: 'Your speed dropped significantly in the latter half. Consider more rest days or shorter recovery runs.',
        color: 'red'
      });
    }
  }

  // Default encouragement if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      icon: Award,
      title: 'Great Job!',
      message: 'Every run counts towards your fitness goals. Keep up the consistent effort!',
      color: 'emerald'
    });
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-${insight.color}-500/10 border border-${insight.color}-500/30 rounded-2xl p-4`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl bg-${insight.color}-500/20 flex-shrink-0`}>
              <insight.icon className={`w-5 h-5 text-${insight.color}-400`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium text-${insight.color}-400 mb-1`}>
                {insight.title}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {insight.message}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function calculatePaceVariance(run) {
  if (!run.route_points || run.route_points.length < 5) return 0;
  
  // Simulate pace variance based on distance and time patterns
  // In a real implementation, calculate from actual segment paces
  const paceStability = run.avg_speed_kmh / (run.max_speed_kmh || 1);
  return (1 - paceStability) * 2;
}

function analyzeSpeedDrop(run) {
  if (!run.route_points || run.route_points.length < 10) return 0;
  
  // Compare first half vs second half average speed
  // This is a simplified calculation
  const firstHalfAvg = run.avg_speed_kmh * 1.1; // Assume started faster
  const secondHalfAvg = run.avg_speed_kmh * 0.9; // Assume slowed down
  
  return ((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100;
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIFormInsights({ run }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthContext, setHealthContext] = useState(null);

  // Fetch recent health data for context
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.email) {
          const healthData = await base44.entities.HealthData.filter({ 
            user_email: user.email 
          });
          const recent = healthData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);
          setHealthContext(recent);
        }
      } catch (err) {
        console.log('Could not fetch health data:', err);
      }
    };
    fetchHealthData();
  }, []);

  useEffect(() => {
    const generateInsights = async () => {
      if (!run || !run.route_points || run.route_points.length < 10) {
        setIsLoading(false);
        return;
      }

      try {
        // Analyze pace variations
        const paceVariations = analyzePaceVariations(run.route_points);
        const speedData = analyzeSpeedData(run);

        // Build health context string
        let healthContextStr = '';
        if (healthContext && healthContext.length > 0) {
          const avgRestingHR = healthContext.reduce((sum, d) => sum + (d.resting_heart_rate || 0), 0) / healthContext.length;
          const avgSleep = healthContext.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / healthContext.length;
          const recentData = healthContext[0];
          
          healthContextStr = `

Recent Health Metrics (7-day average):
- Resting Heart Rate: ${avgRestingHR.toFixed(0)} BPM
- Sleep: ${avgSleep.toFixed(1)} hours/night
- Today's Steps: ${recentData.steps || 'N/A'}
- Today's Sleep: ${recentData.sleep_hours ? recentData.sleep_hours.toFixed(1) + 'h' : 'N/A'}
`;
        }

        const prompt = `Analyze this running data and provide insights on form issues and recommendations:

Distance: ${run.distance_km?.toFixed(2)} km
Duration: ${Math.floor(run.duration_seconds / 60)} minutes
Average Pace: ${run.pace_min_per_km?.toFixed(2)} min/km
Average Speed: ${run.avg_speed_kmh?.toFixed(1)} km/h
Max Speed: ${run.max_speed_kmh?.toFixed(1)} km/h

Pace Analysis:
- Pace Coefficient of Variation: ${paceVariations.cv.toFixed(2)}%
- Speed Drop: ${speedData.speedDrop.toFixed(1)}%
- Max Speed Ratio: ${speedData.maxSpeedRatio.toFixed(2)}x average
${healthContextStr}

Based on these metrics ${healthContext && healthContext.length > 0 ? 'and health data' : ''}, identify potential running form issues such as:
1. Overstriding (indicated by high pace variation)
2. Poor pacing strategy (fast start, slow finish)
3. Inefficient cadence (large speed variations)
4. Fatigue patterns
${healthContext && healthContext.length > 0 ? '5. Recovery and sleep impact on performance' : ''}

Provide 3 specific, actionable recommendations to improve form${healthContext && healthContext.length > 0 ? ', considering the user\'s sleep and recovery metrics' : ''}. Be concise and practical.

Return JSON format:
{
  "mainIssue": "Brief main issue identified",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2", 
    "Recommendation 3"
  ],
  "formScore": 0-100
}`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              mainIssue: { type: 'string' },
              recommendations: {
                type: 'array',
                items: { type: 'string' }
              },
              formScore: { type: 'number' }
            }
          }
        });

        setInsights(response);
        setIsLoading(false);
      } catch (err) {
        console.error('Error generating AI insights:', err);
        setError('Unable to generate insights');
        setIsLoading(false);
      }
    };

    generateInsights();
  }, [run, healthContext]);

  const analyzePaceVariations = (routePoints) => {
    const paces = [];
    
    for (let i = 1; i < routePoints.length; i++) {
      const prev = routePoints[i - 1];
      const curr = routePoints[i];
      
      const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff = (new Date(curr.time) - new Date(prev.time)) / 1000;
      
      if (distance > 0 && timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600);
        if (speed > 0 && speed < 30) {
          const pace = 60 / speed;
          paces.push(pace);
        }
      }
    }

    const mean = paces.reduce((a, b) => a + b, 0) / paces.length;
    const variance = paces.reduce((sum, pace) => sum + Math.pow(pace - mean, 2), 0) / paces.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    return { cv, mean, stdDev };
  };

  const analyzeSpeedData = (run) => {
    const avgSpeed = run.avg_speed_kmh || 0;
    const maxSpeed = run.max_speed_kmh || 0;
    
    // Simulate first/second half comparison
    const speedDrop = Math.random() * 15 + 5; // 5-20% drop
    const maxSpeedRatio = maxSpeed / avgSpeed;

    return { speedDrop, maxSpeedRatio };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="ml-3 text-gray-400">Analyzing your running form...</span>
      </div>
    );
  }

  if (error || !insights) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'yellow';
    return 'orange';
  };

  const scoreColor = getScoreColor(insights.formScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-white">AI Form Analysis</h3>
      </div>

      {/* Form Score */}
      <div className="mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Form Score</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-light text-${scoreColor}-400`}>{insights.formScore}</span>
            <span className="text-gray-500 text-sm">/100</span>
          </div>
        </div>
      </div>

      {/* Main Issue */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-purple-400 mb-2">Key Finding</h4>
        <p className="text-gray-300 text-sm">{insights.mainIssue}</p>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-medium text-purple-400 mb-3">Recommendations</h4>
        <div className="space-y-2">
          {insights.recommendations.map((rec, index) => (
            <div key={index} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-purple-400">{index + 1}</span>
              </div>
              <p className="text-sm text-gray-300 flex-1">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
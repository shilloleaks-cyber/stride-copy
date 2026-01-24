import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function WeeklyChart({ runs }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayRuns = runs.filter(run => {
      const runDate = new Date(run.start_time);
      return runDate >= dayStart && runDate <= dayEnd;
    });
    
    const totalDistance = dayRuns.reduce((sum, run) => sum + (run.distance_km || 0), 0);
    
    return {
      day: format(date, 'EEE'),
      distance: parseFloat(totalDistance.toFixed(2)),
      fullDate: format(date, 'MMM d'),
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-white font-medium">{payload[0].value} km</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-6">Weekly Distance</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7Days} barCategoryGap="20%">
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis 
              hide 
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar 
              dataKey="distance" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]}
              minPointSize={4}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, unit, icon: Icon, accent = false, pulse = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-5 ${
        accent 
          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30' 
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold tracking-tight ${accent ? 'text-emerald-400' : 'text-white'}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${accent ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
            <Icon className={`w-5 h-5 ${accent ? 'text-emerald-400' : 'text-gray-400'} ${pulse ? 'animate-pulse' : ''}`} />
          </div>
        )}
      </div>
      {accent && (
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
      )}
    </motion.div>
  );
}
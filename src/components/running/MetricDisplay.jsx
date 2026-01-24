import React from 'react';
import { motion } from 'framer-motion';

export default function MetricDisplay({ label, value, unit, size = 'md' }) {
  const sizes = {
    sm: { value: 'text-2xl', label: 'text-xs', unit: 'text-xs' },
    md: { value: 'text-4xl', label: 'text-xs', unit: 'text-sm' },
    lg: { value: 'text-5xl', label: 'text-sm', unit: 'text-base' },
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <p className={`${sizes[size].label} uppercase tracking-widest text-gray-500 mb-1`}>{label}</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className={`${sizes[size].value} font-light text-white tabular-nums`}>{value}</span>
        {unit && <span className={`${sizes[size].unit} text-gray-500`}>{unit}</span>}
      </div>
    </motion.div>
  );
}
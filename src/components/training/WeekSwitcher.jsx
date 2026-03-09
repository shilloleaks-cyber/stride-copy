import React from 'react';

export default function WeekSwitcher({ selectedWeek, onPrev, onNext }) {
  const label =
    selectedWeek === 0 ? 'Current' : selectedWeek > 0 ? `+${selectedWeek}w` : `${selectedWeek}w`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="px-3 py-1 rounded-lg text-sm transition-colors"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
      >
        ←
      </button>
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <button
        onClick={onNext}
        className="px-3 py-1 rounded-lg text-sm transition-colors"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
      >
        →
      </button>
    </div>
  );
}
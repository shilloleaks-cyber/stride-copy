import React from 'react';

export default function WeekSwitcher({ selectedWeek, onPrev, onNext }) {
  const label =
    selectedWeek === 0 ? 'Current' : selectedWeek > 0 ? `+${selectedWeek}w` : `${selectedWeek}w`;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:bg-white/10"
      >
        ←
      </button>
      <span className="text-sm text-gray-400">{label}</span>
      <button
        onClick={onNext}
        className="px-3 py-1 bg-white/5 rounded-lg text-sm text-gray-400 hover:bg-white/10"
      >
        →
      </button>
    </div>
  );
}
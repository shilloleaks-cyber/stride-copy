/**
 * Haptic feedback hook using Vibration API (Android) and
 * an iOS-compatible fallback pattern.
 */
export function useHaptic() {
  const trigger = (type = 'light') => {
    if (!navigator.vibrate) return;
    const patterns = {
      light:   [10],
      medium:  [20],
      heavy:   [40],
      success: [10, 50, 10],
      error:   [50, 30, 50],
    };
    navigator.vibrate(patterns[type] || patterns.light);
  };

  return { trigger };
}
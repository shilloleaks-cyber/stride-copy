// ─────────────────────────────────────────────
//  Run Calculation Helpers
// ─────────────────────────────────────────────

// 1. DISTANCE ─ Haversine + GPS noise filter
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getValidDistanceKm(prevPoint, newPoint) {
  if (!prevPoint || !newPoint) return 0;
  if (prevPoint.lat == null || prevPoint.lng == null) return 0;
  if (newPoint.lat == null || newPoint.lng == null) return 0;

  // Filter poor GPS accuracy
  if (newPoint.accuracy && newPoint.accuracy > 30) return 0;

  const distanceKm = haversineDistance(
    prevPoint.lat, prevPoint.lng,
    newPoint.lat, newPoint.lng
  );

  const timeDiffSec =
    prevPoint.timestamp && newPoint.timestamp
      ? Math.max((newPoint.timestamp - prevPoint.timestamp) / 1000, 1)
      : 1;

  const speedKmh = (distanceKm / timeDiffSec) * 3600;

  if (distanceKm < 0.003) return 0;  // ignore jitter < 3 metres
  if (speedKmh > 25) return 0;       // ignore unrealistic jumps (>25 km/h)

  return distanceKm;
}

// 2. PACE
export function calculatePace(seconds, distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 0;
  return (seconds / 60) / distanceKm;
}

export function formatPace(pace) {
  if (!pace || !isFinite(pace) || pace <= 0) return '--:--';
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  const fixedSec = sec === 60 ? 0 : sec;
  const fixedMin = sec === 60 ? min + 1 : min;
  return `${fixedMin}:${String(fixedSec).padStart(2, '0')}`;
}

// 3. AVERAGE SPEED
export function calculateAvgSpeed(seconds, distanceKm) {
  if (!seconds || seconds <= 0) return 0;
  return (distanceKm / seconds) * 3600;
}

// 4. CALORIES
export function getMETFromSpeed(avgSpeedKmh) {
  if (avgSpeedKmh < 5)  return 3.5;
  if (avgSpeedKmh < 7)  return 6.0;
  if (avgSpeedKmh < 9)  return 8.3;
  if (avgSpeedKmh < 11) return 9.8;
  if (avgSpeedKmh < 13) return 11.0;
  return 11.8;
}

export function calculateCalories(seconds, avgSpeedKmh, userWeightKg = 70) {
  if (!seconds || seconds <= 0) return 0;
  const met = getMETFromSpeed(avgSpeedKmh);
  const caloriesPerMinute = (met * userWeightKg * 3.5) / 200;
  return Math.round(caloriesPerMinute * (seconds / 60));
}

// 5. HEART RATE (simulated)
export function simulateHeartRate(prevHR, avgSpeedKmh, seconds) {
  const baseHR = 75;
  const effortBonus = Math.min(avgSpeedKmh * 8, 70);
  const durationBonus = Math.min(seconds / 60, 15);
  const variation = Math.random() * 6 - 3;
  const targetHR = baseHR + effortBonus + durationBonus + variation;
  if (!prevHR) return Math.round(Math.max(60, Math.min(200, targetHR)));
  return Math.round(Math.max(60, Math.min(200, (prevHR * 0.8) + (targetHR * 0.2))));
}

// 6. COINS  (0.1 coin per 0.1 km)
export function calculateCoins(distanceKm) {
  return Math.floor(distanceKm * 10) / 10;
}

// 7. LEVEL
export function calculateLevel(coinBalance) {
  return Math.floor(coinBalance / 100) + 1;
}
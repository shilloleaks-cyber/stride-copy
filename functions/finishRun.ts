import { base44 } from './base44Client.js';
import { format } from 'date-fns';

export default async function finishRun({ distance_km, duration_sec, avg_pace, calories_est }) {
  // Get current user
  const user = await base44.auth.me();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get user's current data
  let dailyCoin = user.daily_coin || 0;
  
  // Reset daily_coin if it's a new day
  if (user.last_run_date !== today) {
    dailyCoin = 0;
  }
  
  // Calculate earned coins
  let earned_coin = 0;
  
  // Validate run: must be at least 0.5km and 3 minutes (180 sec)
  if (distance_km >= 0.5 && duration_sec >= 180) {
    const base_coin = Math.floor(distance_km);
    const remaining = 10 - dailyCoin;
    earned_coin = Math.min(base_coin, Math.max(0, remaining));
  }
  
  // Create Runs record
  await base44.entities.Runs.create({
    user: user.email,
    distance_km,
    duration_sec,
    avg_pace,
    calories_est,
    coins_earned: earned_coin,
  });
  
  // Update User
  const newCoinBalance = (user.coin_balance || 0) + earned_coin;
  const newTotalDistance = (user.total_distance_km || 0) + distance_km;
  const newTotalRuns = (user.total_runs || 0) + 1;
  const newDailyCoin = dailyCoin + earned_coin;
  
  await base44.auth.updateMe({
    coin_balance: newCoinBalance,
    total_distance_km: newTotalDistance,
    total_runs: newTotalRuns,
    daily_coin: newDailyCoin,
    last_run_date: today,
  });
  
  // Create WalletLog
  if (earned_coin > 0) {
    await base44.entities.WalletLog.create({
      user: user.email,
      amount: earned_coin,
      type: 'mine',
      note: 'Run completed',
    });
  }
  
  // Return result
  return {
    distance_km,
    duration_sec,
    earned_coin,
    coin_balance: newCoinBalance,
  };
}
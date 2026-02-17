import { base44 } from './base44Client.js';
import { format } from 'date-fns';

export default async function finishRun({ distance_km, duration_sec, avg_pace, calories_est, run_id }) {
  // Get current user
  const user = await base44.auth.me();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Base reward: 10 coins per km
  const distanceComponent = Math.round(distance_km * 10 * 100) / 100;
  
  // Streak bonus: 10% per consecutive day (up to 7 days = 70%)
  const lastRunDate = user.last_run_date;
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  let streakDays = user.current_streak || 0;
  
  if (lastRunDate === yesterday) {
    streakDays += 1;
  } else if (lastRunDate === today) {
    // Same day run
  } else {
    streakDays = 1;
  }
  
  const streakBonus = Math.min(streakDays - 1, 7) * 0.1;
  const streakComponent = Math.round(distanceComponent * streakBonus * 100) / 100;
  
  // Daily bonus: First run of the day gets 25% extra
  const isFirstRunToday = lastRunDate !== today;
  const dailyComponent = isFirstRunToday ? Math.round(distanceComponent * 0.25 * 100) / 100 : 0;
  
  // Calculate totals
  const baseReward = Math.round((distanceComponent + streakComponent + dailyComponent) * 100) / 100;
  const multiplier = 1.0; // Future: can be from TokenConfig or user level
  const finalReward = Math.round(baseReward * multiplier * 100) / 100;
  const creditedAmount = finalReward;
  
  // Create Runs record
  await base44.entities.Runs.create({
    user: user.email,
    distance_km,
    duration_sec,
    avg_pace,
    calories_est,
    tokens_earned: creditedAmount,
  });
  
  // Update User
  const newTokenBalance = Math.round((user.token_balance || 0) + creditedAmount) * 100) / 100;
  const newTotalDistance = Math.round((user.total_distance_km || 0) + distance_km) * 100) / 100;
  const newTotalRuns = (user.total_runs || 0) + 1;
  const newTotalTokensEarned = Math.round(((user.total_tokens_earned || 0) + creditedAmount) * 100) / 100;
  
  await base44.auth.updateMe({
    token_balance: newTokenBalance,
    coin_balance: newTokenBalance, // Sync both fields
    total_distance_km: newTotalDistance,
    total_runs: newTotalRuns,
    total_tokens_earned: newTotalTokensEarned,
    last_run_date: today,
    current_streak: streakDays,
  });
  
  // Create WalletLog with detailed breakdown
  if (creditedAmount > 0) {
    const breakdown = {
      distance: distanceComponent,
      streak: streakComponent,
      daily: dailyComponent,
      bonus: 0,
      distance_km,
      rate: 10,
      formula_version: 'v2'
    };
    
    await base44.entities.WalletLog.create({
      user: user.email,
      source_type: 'run',
      run_id: run_id || null,
      amount: creditedAmount,
      base_reward: baseReward,
      multiplier_used: multiplier,
      final_reward: finalReward,
      note: JSON.stringify(breakdown),
    });
  }
  
  // Update TokenConfig distributed amount
  const configs = await base44.entities.TokenConfig.list();
  if (configs.length > 0) {
    const config = configs[0];
    await base44.entities.TokenConfig.update(config.id, {
      distributed: Math.round((config.distributed || 0) + creditedAmount) * 100) / 100,
      remaining: Math.round((config.remaining || 29000000) - creditedAmount) * 100) / 100,
    });
  }
  
  // Return result
  return {
    distance_km,
    duration_sec,
    tokens_earned: creditedAmount,
    token_balance: newTokenBalance,
    breakdown,
  };
}
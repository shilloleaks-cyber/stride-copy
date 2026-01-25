import { base44 } from './base44Client.js';
import { format } from 'date-fns';

export default async function finishRun({ distance_km, duration_sec, avg_pace, calories_est }) {
  // Get current user
  const user = await base44.auth.me();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Tokenomics: 0.1 km = 0.1 token (1:1 ratio with distance)
  // Total supply: 29,000,000 RUN tokens
  const tokens_earned = Math.round(distance_km * 10) / 10; // Round to 1 decimal
  
  // Create Runs record
  await base44.entities.Runs.create({
    user: user.email,
    distance_km,
    duration_sec,
    avg_pace,
    calories_est,
    tokens_earned,
  });
  
  // Update User
  const newTokenBalance = (user.token_balance || 0) + tokens_earned;
  const newTotalDistance = (user.total_distance_km || 0) + distance_km;
  const newTotalRuns = (user.total_runs || 0) + 1;
  const newTotalTokensEarned = (user.total_tokens_earned || 0) + tokens_earned;
  
  await base44.auth.updateMe({
    token_balance: newTokenBalance,
    total_distance_km: newTotalDistance,
    total_runs: newTotalRuns,
    total_tokens_earned: newTotalTokensEarned,
    last_run_date: today,
  });
  
  // Create WalletLog
  if (tokens_earned > 0) {
    await base44.entities.WalletLog.create({
      user: user.email,
      amount: tokens_earned,
      type: 'run',
      note: `วิ่ง ${distance_km.toFixed(2)} กม.`,
    });
  }
  
  // Update TokenConfig distributed amount
  const configs = await base44.entities.TokenConfig.list();
  if (configs.length > 0) {
    const config = configs[0];
    await base44.entities.TokenConfig.update(config.id, {
      distributed: (config.distributed || 0) + tokens_earned,
      remaining: (config.remaining || 29000000) - tokens_earned,
    });
  }
  
  // Return result
  return {
    distance_km,
    duration_sec,
    tokens_earned,
    token_balance: newTokenBalance,
  };
}
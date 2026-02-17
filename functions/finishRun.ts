import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns';

// Helpers
const round2 = (n) => Math.round(n * 100) / 100;

async function getConfig(base44) {
  const configs = await base44.entities.TokenConfig.list();
  return configs[0]; // assume single row
}

function calcReward({ distance_km, streakDays, isFirstRunToday, config }) {
  const base = round2(distance_km * (config.base_rate_per_km || 10));

  const streakFactor = Math.min(streakDays, config.streak_max_days || 7) / (config.streak_max_days || 7);
  const streakRate = (config.streak_max_bonus || 0.7) * Math.sqrt(streakFactor);
  const streakCoin = round2(base * streakRate);

  const dailyCoin = isFirstRunToday ? round2(base * (config.daily_first_bonus || 0.25)) : 0;

  const remainingRatio = ((config.remaining ?? (config.total_supply - config.distributed)) / config.total_supply);
  const emission = Math.max(
    config.emission_floor || 0.1, 
    Math.pow(remainingRatio, config.emission_k || 2)
  );

  const raw = round2(base + streakCoin + dailyCoin);
  let final = round2(raw * emission);
  final = Math.min(final, config.max_reward_per_run || 200);

  return {
    base, streakCoin, dailyCoin,
    streakRate: round2(streakRate),
    emission: round2(emission),
    raw, final,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { run_id, distance_km, duration_sec, avg_pace, calories_est } = payload;

    // 1) Get config
    const config = await getConfig(base44);
    const remaining = config.remaining ?? (config.total_supply - (config.distributed || 0));
    
    if (remaining <= 0) {
      return Response.json({ 
        tokens_earned: 0, 
        reason: "supply_exhausted" 
      });
    }

    // 2) Calculate streak
    const today = format(new Date(), "yyyy-MM-dd");
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

    const isFirstRunToday = lastRunDate !== today;

    // 3) Calculate reward
    let reward = calcReward({ distance_km, streakDays, isFirstRunToday, config });

    // 4) Clamp to remaining supply
    reward.final = Math.min(reward.final, remaining);

    // 5) Create WalletLog with detailed breakdown
    const breakdown = {
      formula_version: config.formula_version || 'v3',
      distance_km,
      distance: reward.base,
      streak: reward.streakCoin,
      daily: reward.dailyCoin,
      bonus: 0,
      streak_rate: reward.streakRate,
      emission: reward.emission,
      raw: reward.raw,
      final: reward.final,
      caps: { per_run: config.max_reward_per_run || 200 },
    };

    await base44.entities.WalletLog.create({
      user: user.email,
      source_type: "run",
      run_id: run_id || null,
      amount: reward.final,
      base_reward: reward.raw,
      multiplier_used: reward.emission,
      final_reward: reward.final,
      note: JSON.stringify(breakdown),
    });

    // 6) Update user balance
    const newBalance = round2((user.coin_balance || 0) + reward.final);
    const newTotalDistance = round2((user.total_distance_km || 0) + distance_km);
    const newTotalRuns = (user.total_runs || 0) + 1;

    await base44.auth.updateMe({
      coin_balance: newBalance,
      token_balance: newBalance,
      total_distance_km: newTotalDistance,
      total_runs: newTotalRuns,
      total_tokens_earned: round2((user.total_tokens_earned || 0) + reward.final),
      last_run_date: today,
      current_streak: streakDays,
    });

    // 7) Update TokenConfig supply
    const newDistributed = round2((config.distributed || 0) + reward.final);
    const newRemaining = round2(config.total_supply - newDistributed);

    await base44.entities.TokenConfig.update(config.id, {
      distributed: newDistributed,
      remaining: newRemaining,
    });

    // 8) Optional: Create Runs record if needed
    if (duration_sec && avg_pace) {
      await base44.entities.Runs.create({
        user: user.email,
        distance_km,
        duration_sec,
        avg_pace,
        calories_est: calories_est || 0,
        tokens_earned: reward.final,
      });
    }

    return Response.json({
      tokens_earned: reward.final,
      token_balance: newBalance,
      breakdown,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns';

// Helpers
const round2 = (n) => Math.round(n * 100) / 100;

async function getConfig(base44) {
  const configs = await base44.entities.TokenConfig.list();
  return configs[0]; // assume single row
}

function calcReward({ distance_km, streakDays, isFirstRunToday, config }) {
  const base_rate_per_km = config.base_rate_per_km ?? 1;
  const streak_max_days = config.streak_max_days ?? 30;
  const streak_max_bonus = config.streak_max_bonus ?? 0.20;
  const daily_first_bonus = config.daily_first_bonus ?? 0.10;
  const emission_floor = config.emission_floor ?? 0.35;
  const emission_k = config.emission_k ?? 2.2;
  const max_reward_per_run = config.max_reward_per_run ?? 50;

  const base = round2(distance_km * base_rate_per_km);

  const streakFactor = Math.min(streakDays, streak_max_days) / streak_max_days;
  const streakRate = streak_max_bonus * Math.sqrt(streakFactor);
  const streakCoin = round2(base * streakRate);

  const dailyCoin = isFirstRunToday ? round2(base * daily_first_bonus) : 0;

  const totalSupply = config.total_supply || 29000000;
  const remaining = config.remaining ?? (totalSupply - (config.distributed || 0));
  const remainingRatio = remaining / totalSupply;
  const emissionMultiplier = Math.max(emission_floor, Math.pow(remainingRatio, emission_k));

  const raw = round2(base + streakCoin + dailyCoin);
  let final = round2(raw * emissionMultiplier);
  final = Math.min(final, max_reward_per_run);

  return {
    base, streakCoin, dailyCoin,
    streakRate: round2(streakRate),
    emission: round2(emissionMultiplier),
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
    const { run_id, distance_km, duration_sec } = payload;

    // 1) config
    const config = await getConfig(base44);
    if (!config) {
      return Response.json({ error: 'TokenConfig not found. Please seed it first.' }, { status: 500 });
    }
    const remaining = config.remaining ?? (config.total_supply - (config.distributed || 0));
    if (remaining <= 0) {
      return Response.json({ 
        tokens_earned: 0, 
        reason: "supply_exhausted" 
      });
    }

    // 2) streakDays + isFirstRunToday
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    const isFirstRunToday = user.last_run_date !== today;
    let streakDays;
    if (user.last_run_date === today) {
      streakDays = user.current_streak || 1; // same day, no increase
    } else if (user.last_run_date === yesterday) {
      streakDays = (user.current_streak || 1) + 1; // consecutive day
    } else {
      streakDays = 1; // streak broken
    }

    // 3) calc
    let reward = calcReward({ distance_km, streakDays, isFirstRunToday, config });

    // 4a) clamp to remaining supply
    reward.final = Math.min(reward.final, remaining);

    // 4b) clamp to daily_user_cap
    const daily_user_cap = config.daily_user_cap ?? 60;
    const todayLogs = await base44.entities.WalletLog.filter({ user: user.email, source_type: "run" });
    const earnedToday = todayLogs
      .filter(l => l.source_type === 'run' && l.created_date && l.created_date.startsWith(today))
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const remainingDailyCap = Math.max(0, daily_user_cap - earnedToday);
    reward.final = round2(Math.min(reward.final, remainingDailyCap));

    // 5) write WalletLog (breakdown for modal display)
    const breakdown = {
      formula_version: config.formula_version,
      distance_km,
      distance: reward.base,
      streak: reward.streakCoin,
      daily: reward.dailyCoin,
      bonus: 0,
      streak_rate: reward.streakRate,
      emission: reward.emission,
      raw: reward.raw,
      final: reward.final,
      caps: { per_run: config.max_reward_per_run },
    };

    // Update Runs record with tokens_earned if run_id is provided
    if (run_id) {
      await base44.entities.Runs.update(run_id, {
        tokens_earned: reward.final,
        status: 'completed',
        distance_km: distance_km,
        duration_sec: duration_sec || 0,
        duration_seconds: duration_sec || 0,
      });
    }

    await base44.entities.WalletLog.create({
      user: user.email,
      source_type: "run",
      run_id,
      amount: reward.final,
      base_reward: reward.raw,
      multiplier_used: reward.emission,
      final_reward: reward.final,
      note: JSON.stringify(breakdown),
    });

    // 6) update user balance
    const newBalance = round2((user.coin_balance || 0) + reward.final);

    await base44.auth.updateMe({
      coin_balance: newBalance,
      token_balance: newBalance,
      last_run_date: today,
      current_streak: streakDays,
    });

    // 7) update supply
    const newDistributed = round2((config.distributed || 0) + reward.final);
    const newRemaining = round2(config.total_supply - newDistributed);

    await base44.entities.TokenConfig.update(config.id, {
      distributed: newDistributed,
      remaining: newRemaining,
    });

    return Response.json({ 
      tokens_earned: reward.final, 
      breakdown 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
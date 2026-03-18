import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deltaCoins, reason = 'Reward' } = body;

    if (typeof deltaCoins !== 'number' || deltaCoins <= 0) {
      return Response.json({ error: 'Invalid deltaCoins' }, { status: 400 });
    }

    // Fetch token config for coins per level and daily cap
    const tokenConfigs = await base44.entities.TokenConfig.list();
    const coinsPerLevel = tokenConfigs[0]?.coins_per_level ?? 100;
    const dailyRewardCap = tokenConfigs[0]?.daily_reward_cap ?? 200;

    // Read current user data
    const currentBalance = user.coin_balance ?? 0;
    const currentLevel = user.level ?? 1;
    const currentProgress = user.level_progress_coins ?? 0;
    const dailyRewardedCoins = user.daily_rewarded_coins ?? 0;
    const dailyResetDate = user.daily_reset_date;

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    let newDailyRewardedCoins = dailyRewardedCoins;
    
    if (dailyResetDate !== today) {
      newDailyRewardedCoins = 0;
    }

    // Apply daily cap logic with diminishing returns
    let appliedMultiplier = 1.0;
    let actualDeltaCoins = deltaCoins;
    let reducedRewards = false;
    
    if (newDailyRewardedCoins >= dailyRewardCap) {
      appliedMultiplier = 0.5;
      actualDeltaCoins = deltaCoins * appliedMultiplier;
      reducedRewards = true;
    }
    
    newDailyRewardedCoins += actualDeltaCoins;

    // Calculate new balance with actual coins after cap
    const newBalance = parseFloat((currentBalance + actualDeltaCoins).toFixed(2));

    // Compute level ups
    let totalCoinsForLeveling = currentProgress + actualDeltaCoins;
    let newLevel = currentLevel;
    let levelsGained = 0;

    while (totalCoinsForLeveling >= coinsPerLevel) {
      newLevel += 1;
      levelsGained += 1;
      totalCoinsForLeveling -= coinsPerLevel;
    }

    // Clamp progress to valid range
    const newProgress = parseFloat(
      Math.max(0, Math.min(totalCoinsForLeveling, coinsPerLevel)).toFixed(2)
    );

    // Update user
    await base44.auth.updateMe({
      coin_balance: newBalance,
      level: newLevel,
      level_progress_coins: newProgress,
      daily_rewarded_coins: newDailyRewardedCoins,
      daily_reset_date: today,
    });

    // Create wallet log entry with actual coins
    await base44.entities.WalletLog.create({
      user: user.email,
      amount: actualDeltaCoins,
      type: 'run',
      note: reducedRewards ? `${reason} (Reduced: daily cap reached)` : reason,
    });

    return Response.json({
      success: true,
      coin_balance: newBalance,
      level: newLevel,
      level_progress_coins: newProgress,
      levelsGained,
      reducedRewards,
      appliedMultiplier,
      originalAmount: deltaCoins,
      actualAmount: actualDeltaCoins,
    });
  } catch (error) {
    console.error('Error in applyCoinAndLevelUp:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
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

    // Fetch token config for coins per level
    const tokenConfigs = await base44.entities.TokenConfig.list();
    const coinsPerLevel = tokenConfigs[0]?.coins_per_level ?? 100;

    // Read current user data
    const currentBalance = user.coin_balance ?? 0;
    const currentLevel = user.level ?? 1;
    const currentProgress = user.level_progress_coins ?? 0;

    // Calculate new balance
    const newBalance = parseFloat((currentBalance + deltaCoins).toFixed(2));

    // Compute level ups
    let totalCoinsForLeveling = currentProgress + deltaCoins;
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
    });

    // Create wallet log entry
    await base44.entities.WalletLog.create({
      user: user.email,
      amount: deltaCoins,
      type: 'run',
      note: reason,
    });

    return Response.json({
      success: true,
      coin_balance: newBalance,
      level: newLevel,
      level_progress_coins: newProgress,
      levelsGained,
    });
  } catch (error) {
    console.error('Error in applyCoinAndLevelUp:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityType, metadata = {} } = await req.json();

    let coinsAwarded = 0;
    let reason = '';

    switch (activityType) {
      case 'run_completed':
        const distance = metadata.distance_km || 0;
        coinsAwarded = Math.floor(distance * 10); // 10 coins per km
        reason = `Run completed: ${distance.toFixed(1)} km`;
        break;

      case 'personal_best':
        coinsAwarded = 100;
        reason = 'New personal best!';
        break;

      case 'challenge_joined':
        coinsAwarded = 20;
        reason = 'Joined a challenge';
        break;

      case 'challenge_completed':
        coinsAwarded = metadata.reward || 200;
        reason = `Completed: ${metadata.challengeName || 'Challenge'}`;
        break;

      case 'group_joined':
        coinsAwarded = 30;
        reason = 'Joined a group';
        break;

      case 'group_post':
        coinsAwarded = 15;
        reason = 'Shared with group';
        break;

      case 'event_attended':
        coinsAwarded = 50;
        reason = 'Attended group event';
        break;

      case 'streak_milestone':
        const days = metadata.days || 0;
        coinsAwarded = days * 20;
        reason = `${days}-day streak!`;
        break;

      default:
        return Response.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    // Update user coins
    const newBalance = (user.total_coins || 0) + coinsAwarded;
    await base44.asServiceRole.auth.updateUser(user.email, {
      total_coins: newBalance,
    });

    // Create wallet log
    await base44.asServiceRole.entities.WalletLog.create({
      user: user.email,
      amount: coinsAwarded,
      type: 'bonus',
      note: reason,
    });

    return Response.json({ 
      success: true,
      coinsAwarded,
      newBalance,
      reason
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
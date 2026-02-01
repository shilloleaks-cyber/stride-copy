import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // FIXED ORDER: These 8 achievements are the ONLY source of truth
    const achievements = [
      {
        title: 'First Run',
        description: 'Complete your first run',
        badge_emoji: '🏃',
        category: 'distance',
        requirement_type: 'total_runs',
        requirement_value: 1,
        reward_coins: 15,
        rarity: 'common',
        display_order: 1
      },
      {
        title: '10km Club',
        description: 'Run a total of 10 kilometers',
        badge_emoji: '🎯',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 10,
        reward_coins: 25,
        rarity: 'common',
        display_order: 2
      },
      {
        title: '10 Runs Streak',
        description: 'Complete 10 runs',
        badge_emoji: '🔥',
        category: 'consistency',
        requirement_type: 'total_runs',
        requirement_value: 10,
        reward_coins: 30,
        rarity: 'common',
        display_order: 3
      },
      {
        title: 'Calorie Burner',
        description: 'Burn 5,000 calories',
        badge_emoji: '💪',
        category: 'special',
        requirement_type: 'total_distance',
        requirement_value: 5000,
        reward_coins: 30,
        rarity: 'common',
        display_order: 4
      },
      {
        title: '50km Star',
        description: 'Run a total of 50 kilometers',
        badge_emoji: '⭐',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 50,
        reward_coins: 40,
        rarity: 'rare',
        display_order: 5
      },
      {
        title: 'Inferno',
        description: 'Burn 20,000 calories',
        badge_emoji: '🔥',
        category: 'special',
        requirement_type: 'total_distance',
        requirement_value: 20000,
        reward_coins: 45,
        rarity: 'rare',
        display_order: 6
      },
      {
        title: '50 Runs Master',
        description: 'Complete 50 runs',
        badge_emoji: '💎',
        category: 'consistency',
        requirement_type: 'total_runs',
        requirement_value: 50,
        reward_coins: 60,
        rarity: 'rare',
        display_order: 7
      },
      {
        title: '100km Legend',
        description: 'Run a total of 100 kilometers',
        badge_emoji: '🏆',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 100,
        reward_coins: 80,
        rarity: 'epic',
        display_order: 8
      }
    ];

    // Idempotent: Clear and recreate to ensure consistency
    const existing = await base44.asServiceRole.entities.Achievement.list();
    for (const ach of existing) {
      await base44.asServiceRole.entities.Achievement.delete(ach.id);
    }

    // Create all 8 achievements in order
    for (const achievement of achievements) {
      await base44.asServiceRole.entities.Achievement.create(achievement);
    }

    return Response.json({ 
      success: true, 
      count: achievements.length,
      message: '8 achievements seeded successfully',
      achievements: achievements.map(a => ({ title: a.title, reward: a.reward_coins }))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
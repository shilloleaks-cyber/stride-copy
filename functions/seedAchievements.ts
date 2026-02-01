import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const achievements = [
      // Distance Achievements
      {
        title: 'First Steps',
        description: 'Complete your first run',
        badge_emoji: '🏃',
        category: 'distance',
        requirement_type: 'total_runs',
        requirement_value: 1,
        reward_coins: 15,
        rarity: 'common'
      },
      {
        title: '10K Club',
        description: 'Run a total of 10 kilometers',
        badge_emoji: '🎯',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 10,
        reward_coins: 25,
        rarity: 'common'
      },
      {
        title: 'Marathon Ready',
        description: 'Run a total of 42 kilometers',
        badge_emoji: '🏅',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 42,
        reward_coins: 40,
        rarity: 'rare'
      },
      {
        title: 'Century Runner',
        description: 'Run a total of 100 kilometers',
        badge_emoji: '💯',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 100,
        reward_coins: 80,
        rarity: 'epic'
      },
      {
        title: 'Ultra Legend',
        description: 'Run a total of 500 kilometers',
        badge_emoji: '👑',
        category: 'distance',
        requirement_type: 'total_distance',
        requirement_value: 500,
        reward_coins: 1000,
        rarity: 'legendary'
      },

      // Consistency Achievements
      {
        title: 'Consistent Runner',
        description: 'Complete 10 runs',
        badge_emoji: '🔥',
        category: 'consistency',
        requirement_type: 'total_runs',
        requirement_value: 10,
        reward_coins: 30,
        rarity: 'common'
      },
      {
        title: 'Dedicated Athlete',
        description: 'Complete 50 runs',
        badge_emoji: '⭐',
        category: 'consistency',
        requirement_type: 'total_runs',
        requirement_value: 50,
        reward_coins: 60,
        rarity: 'rare'
      },
      {
        title: 'Running Machine',
        description: 'Complete 100 runs',
        badge_emoji: '🚀',
        category: 'consistency',
        requirement_type: 'total_runs',
        requirement_value: 100,
        reward_coins: 500,
        rarity: 'epic'
      },

      // Quest Achievements
      {
        title: 'Quest Starter',
        description: 'Complete 5 daily quests',
        badge_emoji: '📋',
        category: 'quest',
        requirement_type: 'quest_streak',
        requirement_value: 5,
        reward_coins: 30,
        rarity: 'common'
      },
      {
        title: 'Quest Master',
        description: 'Complete 20 daily quests',
        badge_emoji: '🎖️',
        category: 'quest',
        requirement_type: 'quest_streak',
        requirement_value: 20,
        reward_coins: 100,
        rarity: 'rare'
      },
      {
        title: 'Quest Legend',
        description: 'Complete 50 daily quests',
        badge_emoji: '🏆',
        category: 'quest',
        requirement_type: 'quest_streak',
        requirement_value: 50,
        reward_coins: 300,
        rarity: 'epic'
      },

      // Social Achievements
      {
        title: 'Social Runner',
        description: 'Follow 5 runners',
        badge_emoji: '👥',
        category: 'social',
        requirement_type: 'friend_count',
        requirement_value: 5,
        reward_coins: 25,
        rarity: 'common'
      },
      {
        title: 'Community Leader',
        description: 'Follow 20 runners',
        badge_emoji: '🌟',
        category: 'social',
        requirement_type: 'friend_count',
        requirement_value: 20,
        reward_coins: 100,
        rarity: 'rare'
      }
    ];

    // Clear existing achievements
    const existing = await base44.asServiceRole.entities.Achievement.list();
    for (const ach of existing) {
      await base44.asServiceRole.entities.Achievement.delete(ach.id);
    }

    // Create new achievements
    for (const achievement of achievements) {
      await base44.asServiceRole.entities.Achievement.create(achievement);
    }

    return Response.json({ 
      success: true, 
      count: achievements.length,
      message: 'Achievements seeded successfully' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
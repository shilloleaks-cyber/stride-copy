import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all achievements
    const achievements = await base44.entities.Achievement.list();
    
    // Get user's current achievements
    const userAchievements = await base44.entities.UserAchievement.filter({ 
      user_email: user.email 
    });
    
    const unlockedIds = userAchievements.map(ua => ua.achievement_id);
    const newlyUnlocked = [];

    // Get user stats
    const runs = await base44.entities.Run.filter({ created_by: user.email, status: 'completed' });
    const totalDistance = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0);
    const totalRuns = runs.length;
    
    const questProgress = await base44.entities.QuestProgress.filter({ user_email: user.email });
    const completedQuests = questProgress.filter(q => q.completed).length;
    
    const follows = await base44.entities.Follow.filter({ follower_email: user.email });
    const friendCount = follows.length;

    // Check each achievement
    for (const achievement of achievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let qualified = false;
      let progress = 0;

      switch (achievement.requirement_type) {
        case 'total_distance':
          progress = totalDistance;
          qualified = totalDistance >= achievement.requirement_value;
          break;
        case 'total_runs':
          progress = totalRuns;
          qualified = totalRuns >= achievement.requirement_value;
          break;
        case 'quest_streak':
          progress = completedQuests;
          qualified = completedQuests >= achievement.requirement_value;
          break;
        case 'friend_count':
          progress = friendCount;
          qualified = friendCount >= achievement.requirement_value;
          break;
        default:
          break;
      }

      if (qualified) {
        // Unlock achievement
        await base44.entities.UserAchievement.create({
          user_email: user.email,
          achievement_id: achievement.id,
          unlocked_date: new Date().toISOString(),
          progress: progress
        });

        // Award coins
        if (achievement.reward_coins > 0) {
          const currentCoins = user.total_coins || 0;
          await base44.auth.updateMe({ 
            total_coins: currentCoins + achievement.reward_coins 
          });
        }

        newlyUnlocked.push(achievement);
      }
    }

    return Response.json({ 
      newlyUnlocked,
      message: newlyUnlocked.length > 0 
        ? `Unlocked ${newlyUnlocked.length} new achievement(s)!` 
        : 'No new achievements'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
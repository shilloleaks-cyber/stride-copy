import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if quests already exist for today
    const today = new Date().toISOString().split('T')[0];
    const existingQuests = await base44.asServiceRole.entities.DailyQuest.filter({ 
      quest_date: today 
    });

    if (existingQuests.length > 0) {
      return Response.json({ 
        success: true, 
        quests: existingQuests,
        message: 'Quests already generated for today' 
      });
    }

    // Generate 3 random quests
    const questTemplates = [
      { type: 'run_distance', target: 1, coins: 5, title: 'Run 1km', description: 'Complete a 1km run' },
      { type: 'run_distance', target: 3, coins: 15, title: 'Run 3km', description: 'Complete a 3km run' },
      { type: 'run_distance', target: 5, coins: 25, title: 'Run 5km', description: 'Complete a 5km run' },
      { type: 'run_time', target: 10, coins: 10, title: 'Run 10 Minutes', description: 'Run for at least 10 minutes' },
      { type: 'run_time', target: 20, coins: 20, title: 'Run 20 Minutes', description: 'Run for at least 20 minutes' },
      { type: 'complete_run', target: 1, coins: 10, title: 'Complete Any Run', description: 'Finish any run today' },
      { type: 'earn_coins', target: 3, coins: 5, title: 'Earn 3 Coins', description: 'Earn at least 3 coins today' },
      { type: 'beat_pace', target: 1, coins: 15, title: 'Beat Your Pace', description: 'Run faster than your average pace' },
    ];

    // Pick 3 random quests
    const shuffled = questTemplates.sort(() => Math.random() - 0.5);
    const selectedQuests = shuffled.slice(0, 3);

    const createdQuests = [];
    for (const quest of selectedQuests) {
      const created = await base44.asServiceRole.entities.DailyQuest.create({
        quest_date: today,
        quest_type: quest.type,
        target_value: quest.target,
        reward_coins: quest.coins,
        title: quest.title,
        description: quest.description
      });
      createdQuests.push(created);
    }

    return Response.json({ 
      success: true, 
      quests: createdQuests,
      message: 'Daily quests generated successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
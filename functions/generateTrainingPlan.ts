import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id } = await req.json();

    // Get user's goal
    const goals = await base44.entities.TrainingGoal.filter({ 
      id: goal_id,
      user_email: user.email 
    });
    
    if (goals.length === 0) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    const goal = goals[0];

    // Get user's recent runs for analysis
    const runs = await base44.entities.Run.filter({ 
      created_by: user.email,
      status: 'completed'
    });
    
    const recentRuns = runs
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 10);

    // Calculate current stats
    const avgDistance = recentRuns.length > 0 
      ? recentRuns.reduce((sum, r) => sum + r.distance_km, 0) / recentRuns.length 
      : 0;
    const avgPace = recentRuns.length > 0 
      ? recentRuns.reduce((sum, r) => sum + r.pace_min_per_km, 0) / recentRuns.length 
      : 0;

    // Generate AI training plan
    const prompt = `Generate a 4-week progressive running training plan.

User Profile:
- Current Level: ${user.current_level || 0}
- Recent Average Distance: ${avgDistance.toFixed(2)}km
- Recent Average Pace: ${avgPace.toFixed(2)} min/km
- Recent Runs: ${recentRuns.length}

Goal:
- Type: ${goal.goal_type}
- Target: ${goal.target_value || 'Improve performance'}
- Target Date: ${goal.target_date}

Requirements:
1. Create a 4-week progressive plan
2. Include variety: easy runs, tempo runs, intervals, long runs, rest days
3. Gradually increase distance and intensity
4. Balance training with recovery
5. Each day should have specific instructions

Return ONLY valid JSON (no markdown, no explanations):
{
  "week1": {
    "monday": {"type": "easy_run", "distance": 3, "pace": 6.5, "instructions": "..."},
    "tuesday": {"type": "rest", "instructions": "..."},
    ...
  },
  "week2": {...},
  "week3": {...},
  "week4": {...}
}`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          week1: { type: "object" },
          week2: { type: "object" },
          week3: { type: "object" },
          week4: { type: "object" }
        }
      }
    });

    // Store training plans in database
    const today = new Date();
    const plans = [];
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekData = aiResponse[`week${weekNum}`];
      
      const plan = await base44.asServiceRole.entities.TrainingPlan.create({
        user_email: user.email,
        goal_id: goal_id,
        week_number: weekNum,
        plan_data: weekData,
        status: weekNum === 1 ? 'active' : 'upcoming'
      });
      
      plans.push(plan);

      // Create individual workout sessions
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const workout = weekData[day];
        
        if (workout && workout.type !== 'rest') {
          const sessionDate = new Date(today);
          sessionDate.setDate(today.getDate() + ((weekNum - 1) * 7) + dayIndex);
          
          await base44.asServiceRole.entities.WorkoutSession.create({
            user_email: user.email,
            plan_id: plan.id,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            workout_type: workout.type,
            planned_distance: workout.distance || 0,
            planned_pace: workout.pace || 0,
            instructions: workout.instructions || '',
            completed: false
          });
        }
      }
    }

    return Response.json({ 
      success: true, 
      plans,
      message: 'Training plan generated successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
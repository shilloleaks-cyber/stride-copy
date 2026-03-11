import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id } = await req.json();

    if (!goal_id) {
      return Response.json({ error: 'goal_id is required' }, { status: 400 });
    }

    // Fetch all plans for this goal
    const plans = await base44.asServiceRole.entities.TrainingPlan.filter({
      goal_id,
      user_email: user.email,
    });

    // Delete all sessions and plans
    for (const plan of plans) {
      const sessions = await base44.asServiceRole.entities.WorkoutSession.filter({
        plan_id: plan.id,
        user_email: user.email,
      });
      for (const s of sessions) {
        await base44.asServiceRole.entities.WorkoutSession.delete(s.id);
      }
      await base44.asServiceRole.entities.TrainingPlan.delete(plan.id);
    }

    // Delete the goal itself
    await base44.asServiceRole.entities.TrainingGoal.delete(goal_id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
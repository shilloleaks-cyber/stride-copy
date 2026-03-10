import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDaysToDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Session builders ─────────────────────────────────────────────────────────

function easy(km, seed = 0) {
  const msgs = [
    `Run ${km}km at a relaxed, conversational pace. Keep heart rate low and effort comfortable throughout.`,
    `${km}km easy aerobic run. You should be able to hold a full conversation — back off if breathing gets hard.`,
    `Easy ${km}km. Run by feel, stay comfortable. Focus on consistency, not speed.`,
    `${km}km easy run. Keep it light and relaxed — this session builds your aerobic base.`,
  ];
  return { workout_type: 'easy_run', planned_distance: km, planned_pace: 0, instructions: msgs[seed % msgs.length] };
}

function tempo(km) {
  const warmup = Math.round(km * 0.25 * 2) / 2;
  const main   = Math.round(km * 0.55 * 2) / 2;
  const cd     = Math.round((km - warmup - main) * 2) / 2;
  return {
    workout_type: 'tempo_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up ${warmup}km easy. Run ${main}km at a comfortably hard, sustained effort. Cool down ${cd}km easy. Total ${km}km.`,
  };
}

function intervals(km) {
  const reps = 4;
  const repKm = Math.round(((km - 2) / reps) * 5) / 5;
  return {
    workout_type: 'intervals',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up 1km easy. Run ${reps} × ${repKm}km at hard effort with 90-sec easy jog recovery between each. Cool down 1km easy. Total ~${km}km.`,
  };
}

function longRun(km) {
  return {
    workout_type: 'long_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km long run at easy, relaxed effort. Build endurance — run slower than you think you need to. Walk breaks are fine.`,
  };
}

function recovery(km) {
  return {
    workout_type: 'cross_training',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km very easy recovery jog. Slower than your easy pace. This is active recovery, not training.`,
  };
}

// ─── Deterministic blueprints ─────────────────────────────────────────────────
// 5K:            3 sessions max
// 10K:           4 sessions max
// half_marathon: 6 sessions max
// pace/distance/endurance: 4-5 sessions

function buildSessions(goalType) {
  switch (goalType) {
    case '5k':
      return [
        { offset: 0, session: easy(3, 0) },
        { offset: 2, session: intervals(4) },
        { offset: 4, session: easy(4, 1) },
      ];

    case '10k':
      return [
        { offset: 0, session: easy(4, 0) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: easy(5, 1) },
        { offset: 6, session: longRun(8) },
      ];

    case 'half_marathon':
      return [
        { offset: 0,  session: easy(5, 0) },
        { offset: 2,  session: tempo(7) },
        { offset: 4,  session: easy(6, 1) },
        { offset: 6,  session: intervals(6) },
        { offset: 8,  session: easy(5, 2) },
        { offset: 10, session: longRun(12) },
      ];

    case 'pace':
      return [
        { offset: 0, session: easy(4, 0) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: easy(5, 1) },
        { offset: 6, session: easy(4, 2) },
      ];

    case 'distance':
      return [
        { offset: 0, session: easy(5, 0) },
        { offset: 2, session: easy(6, 1) },
        { offset: 4, session: tempo(7) },
        { offset: 5, session: recovery(3) },
        { offset: 7, session: longRun(10) },
      ];

    case 'endurance':
      return [
        { offset: 0, session: easy(5, 0) },
        { offset: 2, session: easy(6, 1) },
        { offset: 3, session: recovery(3) },
        { offset: 5, session: easy(6, 2) },
        { offset: 7, session: longRun(10) },
      ];

    default:
      return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { goal_id } = await req.json();

    if (!goal_id) {
      return Response.json({ success: false, error: 'goal_id is required' }, { status: 400 });
    }

    // ── Fetch goal ──────────────────────────────────────────────────────────
    const goals = await base44.asServiceRole.entities.TrainingGoal.filter({
      id: goal_id,
      user_email: user.email,
    });

    if (goals.length === 0) {
      return Response.json({ success: false, error: 'Goal not found' }, { status: 404 });
    }

    const goal = goals[0];
    const sessions = buildSessions(goal.goal_type);

    if (!sessions) {
      return Response.json({ success: false, error: `Unknown goal type: ${goal.goal_type}` }, { status: 400 });
    }

    const startDate = new Date(goal.target_date);
    startDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
      return Response.json({ success: false, error: 'Invalid start date on goal.' }, { status: 400 });
    }

    // ── IDEMPOTENT CLEANUP: delete all existing plans + sessions for this goal ──
    const existingPlans = await base44.asServiceRole.entities.TrainingPlan.filter({
      goal_id,
      user_email: user.email,
    });

    for (const plan of existingPlans) {
      // Delete all sessions for this plan
      const planSessions = await base44.asServiceRole.entities.WorkoutSession.filter({
        plan_id: plan.id,
        user_email: user.email,
      });
      for (const s of planSessions) {
        await base44.asServiceRole.entities.WorkoutSession.delete(s.id);
      }
      await base44.asServiceRole.entities.TrainingPlan.delete(plan.id);
    }

    // ── Create exactly ONE TrainingPlan for this goal ───────────────────────
    const plan = await base44.asServiceRole.entities.TrainingPlan.create({
      user_email: user.email,
      goal_id,
      week_number: 1,
      plan_data: {},
      status: 'active',
    });

    // ── Create WorkoutSession records ───────────────────────────────────────
    for (const { offset, session } of sessions) {
      await base44.asServiceRole.entities.WorkoutSession.create({
        user_email: user.email,
        plan_id: plan.id,
        scheduled_date: addDaysToDate(startDate, offset),
        workout_type: session.workout_type,
        planned_distance: session.planned_distance,
        planned_pace: session.planned_pace,
        instructions: session.instructions,
        completed: false,
      });
    }

    return Response.json({
      success: true,
      goal_id,
      plan_id: plan.id,
      sessions_created: sessions.length,
    });

  } catch (error) {
    console.error('generateTrainingPlan error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
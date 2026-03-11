import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDaysToDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Session builders ─────────────────────────────────────────────────────────

function easy(km) {
  return {
    workout_type: 'easy_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Run ${km}km at a relaxed, conversational pace. Keep your heart rate low — you should be able to hold a full conversation throughout. Focus on consistency, not speed.`,
  };
}

function tempo(km) {
  const warmup = 1;
  const main = Math.round((km - 2) * 10) / 10;
  const cd = 1;
  return {
    workout_type: 'tempo_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up ${warmup}km easy. Run ${main}km at a comfortably hard, sustained effort — you should be able to say a few words but not hold a full conversation. Cool down ${cd}km easy. Total ${km}km.`,
  };
}

function intervals(km) {
  return {
    workout_type: 'intervals',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up 1km easy. Run 4 × 400m at hard effort with 90-second easy jog recovery between each. Repeat the set twice. Cool down 1km easy. Total ~${km}km. Focus on consistent effort each rep.`,
  };
}

function recovery(km) {
  return {
    workout_type: 'cross_training',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km very easy recovery jog. Run slower than your easy pace. This is active recovery — legs should feel loose and relaxed. Walk breaks are encouraged.`,
  };
}

function longRun(km) {
  return {
    workout_type: 'long_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km long run at easy, comfortable effort. Run slower than you think you need to — the goal is time on feet, not speed. Walk breaks are completely fine.`,
  };
}

function goalRun(km, label) {
  return {
    workout_type: 'long_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `🎯 Goal Run: ${label}. This is your completion session — run the full ${km}km at your best comfortable effort. Warm up with 5 minutes of easy walking, then go for it. You've done the training. Trust yourself.`,
  };
}

function paceTest(km) {
  return {
    workout_type: 'tempo_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Pace Test Run — ${km}km. Warm up 1km easy, then run ${km - 2}km at your target goal pace. Cool down 1km. Check your splits and see how your pace has improved since training started.`,
  };
}

// ─── Deterministic blueprints (every-other-day scheduling) ───────────────────

function buildSessions(goalType, targetValue) {
  switch (goalType) {

    case '5k':
      // 3 sessions, every other day (offsets: 0, 2, 4)
      return [
        { offset: 0, session: easy(3) },
        { offset: 2, session: tempo(4) },
        { offset: 4, session: goalRun(5, '5K') },
      ];

    case '10k':
      // 4 sessions, every other day (offsets: 0, 2, 4, 6)
      return [
        { offset: 0, session: easy(4) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: easy(6) },
        { offset: 6, session: goalRun(10, '10K') },
      ];

    case 'half_marathon':
      // 6 sessions, every other day (offsets: 0, 2, 4, 6, 8, 10)
      return [
        { offset: 0,  session: easy(6) },
        { offset: 2,  session: tempo(8) },
        { offset: 4,  session: easy(10) },
        { offset: 6,  session: recovery(8) },
        { offset: 8,  session: longRun(12) },
        { offset: 10, session: goalRun(21, 'Half Marathon') },
      ];

    case 'pace':
      // 4 sessions, every other day (offsets: 0, 2, 4, 6)
      return [
        { offset: 0, session: easy(4) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: intervals(5) },
        { offset: 6, session: paceTest(6) },
      ];

    case 'distance': {
      // 5 sessions, every other day — last session = target distance
      const target = targetValue && targetValue > 0 ? targetValue : 10;
      const s1 = Math.max(3, Math.round(target * 0.35));
      const s2 = Math.round(target * 0.50);
      const s3 = Math.round(target * 0.65);
      const s4 = Math.round(target * 0.80);
      return [
        { offset: 0,  session: easy(s1) },
        { offset: 2,  session: easy(s2) },
        { offset: 4,  session: tempo(s3) },
        { offset: 6,  session: recovery(s4) },
        { offset: 8,  session: goalRun(target, `${target}km Distance`) },
      ];
    }

    case 'endurance':
      // 5 sessions, every other day
      return [
        { offset: 0,  session: easy(5) },
        { offset: 2,  session: easy(7) },
        { offset: 4,  session: recovery(5) },
        { offset: 6,  session: easy(9) },
        { offset: 8,  session: longRun(12) },
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
    const sessions = buildSessions(goal.goal_type, goal.target_value);

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

    await Promise.all(existingPlans.map(async (plan) => {
      const planSessions = await base44.asServiceRole.entities.WorkoutSession.filter({
        plan_id: plan.id,
        user_email: user.email,
      });
      await Promise.all(planSessions.map(s => base44.asServiceRole.entities.WorkoutSession.delete(s.id)));
      await base44.asServiceRole.entities.TrainingPlan.delete(plan.id);
    }));

    // ── Create exactly ONE TrainingPlan for this goal ───────────────────────
    const plan = await base44.asServiceRole.entities.TrainingPlan.create({
      user_email: user.email,
      goal_id,
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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round(val, step = 0.5) {
  return Math.round(val / step) * step;
}

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
  const warmup = round(km * 0.25, 0.5);
  const main   = round(km * 0.55, 0.5);
  const cd     = round(km - warmup - main, 0.5);
  return {
    workout_type: 'tempo_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up ${warmup}km easy. Run ${main}km at a comfortably hard, sustained effort (short phrases but not full sentences). Cool down ${cd}km easy. Total ${km}km.`,
  };
}

function intervals(km) {
  const reps = 4;
  const repKm = round((km - 2) / reps, 0.2);
  return {
    workout_type: 'intervals',
    planned_distance: km,
    planned_pace: 0,
    instructions: `Warm up 1km easy. Run ${reps} × ${repKm}km at hard (not sprint) effort with 90-sec easy jog recovery between each. Cool down 1km easy. Total ~${km}km.`,
  };
}

function longRun(km) {
  return {
    workout_type: 'long_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km long run at easy, relaxed effort. This session builds endurance — run slower than you think you need to. Walk breaks are fine if needed.`,
  };
}

function recovery(km) {
  return {
    workout_type: 'recovery_run',
    planned_distance: km,
    planned_pace: 0,
    instructions: `${km}km very easy recovery jog. Slower than your easy pace. Keep effort minimal — this is active recovery, not training.`,
  };
}

// ─── Deterministic blueprints ─────────────────────────────────────────────────
//
// Each blueprint defines the exact session list for the plan duration.
// Sessions are spread across day offsets from day 0 (start date).
// Rules enforced:
//   - no consecutive hard days (tempo/intervals offset from each other and long runs)
//   - max 1 interval session
//   - max 1 tempo session
//   - exactly 1 long run for 10k and half_marathon
//   - easy runs are majority
//   - session count caps respected
//
// 5K:  duration 3 days, max 3 sessions
// 10K: duration 5 days, max 4 sessions
// HM:  duration 7-10 days, max 6 sessions
//
// pace / distance / endurance: 7-day plans, similar structure to 10k/HM

function buildSessions(goalType) {
  switch (goalType) {
    case '5k':
      // 3 sessions over 3 days: easy → intervals → easy
      return [
        { offset: 0, session: easy(3, 0) },
        { offset: 2, session: intervals(4) },
        { offset: 4, session: easy(4, 1) },
      ];

    case '10k':
      // 4 sessions over 5 days: easy → tempo → easy → long
      return [
        { offset: 0, session: easy(4, 0) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: easy(5, 1) },
        { offset: 6, session: longRun(8) },
      ];

    case 'half_marathon':
      // 6 sessions over 10 days: easy → tempo → easy → intervals → easy → long
      return [
        { offset: 0,  session: easy(5, 0) },
        { offset: 2,  session: tempo(7) },
        { offset: 4,  session: easy(6, 1) },
        { offset: 6,  session: intervals(6) },
        { offset: 8,  session: easy(5, 2) },
        { offset: 10, session: longRun(12) },
      ];

    case 'pace':
      // 4 sessions over 7 days: easy → tempo → easy → easy
      return [
        { offset: 0, session: easy(4, 0) },
        { offset: 2, session: tempo(6) },
        { offset: 4, session: easy(5, 1) },
        { offset: 6, session: easy(4, 2) },
      ];

    case 'distance':
      // 5 sessions over 7 days: easy → easy → tempo → easy → long
      return [
        { offset: 0, session: easy(5, 0) },
        { offset: 2, session: easy(6, 1) },
        { offset: 4, session: tempo(7) },
        { offset: 5, session: recovery(3) },
        { offset: 7, session: longRun(10) },
      ];

    case 'endurance':
      // 5 sessions over 7 days: easy → easy → easy → tempo → long
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
    const goalType = goal.goal_type;

    const sessions = buildSessions(goalType);
    if (!sessions) {
      return Response.json({ success: false, error: `Unknown goal type: ${goalType}` }, { status: 400 });
    }

    // ── Resolve start date (target_date = plan start date) ─────────────────
    const startDate = new Date(goal.target_date);
    startDate.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
      return Response.json({ success: false, error: 'Invalid start date on goal.' }, { status: 400 });
    }

    // ── Delete stale plans and sessions for this goal ───────────────────────
    const existingPlans = await base44.asServiceRole.entities.TrainingPlan.filter({
      goal_id,
      user_email: user.email,
    });
    const existingPlanIds = new Set(existingPlans.map(p => p.id));

    const existingSessions = await base44.asServiceRole.entities.WorkoutSession.filter({
      user_email: user.email,
    });

    for (const s of existingSessions) {
      if (existingPlanIds.has(s.plan_id)) {
        await base44.asServiceRole.entities.WorkoutSession.delete(s.id);
      }
    }
    for (const p of existingPlans) {
      await base44.asServiceRole.entities.TrainingPlan.delete(p.id);
    }

    // ── Create a single TrainingPlan record for this goal ───────────────────
    const plan = await base44.asServiceRole.entities.TrainingPlan.create({
      user_email: user.email,
      goal_id,
      week_number: 1,
      plan_data: {},
      status: 'active',
    });

    // ── Create WorkoutSession records ───────────────────────────────────────
    for (const { offset, session } of sessions) {
      const scheduledDate = addDaysToDate(startDate, offset);
      await base44.asServiceRole.entities.WorkoutSession.create({
        user_email: user.email,
        plan_id: plan.id,
        scheduled_date: scheduledDate,
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
      sessions_created: sessions.length,
    });

  } catch (error) {
    console.error('generateTrainingPlan error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
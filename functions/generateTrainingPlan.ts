import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Day-index for scheduling (0 = Mon, 6 = Sun)
const DAY_INDEX = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };

// ─── Goal-specific blueprint config ─────────────────────────────────────────

const GOAL_BLUEPRINTS = {
  '5k': {
    sessionsPerWeek: [3, 3, 4, 3],      // per week (last week = taper)
    longRunCap: 8,                        // km
    baseEasyKm: 3,
    easyKmIncrement: 0.5,
    qualityAlternation: ['tempo_run', 'intervals'],
    taperFinalWeek: true,
    description: '5K training',
  },
  '10k': {
    sessionsPerWeek: [3, 4, 4, 3],
    longRunCap: 12,
    baseEasyKm: 4,
    easyKmIncrement: 0.5,
    qualityAlternation: ['tempo_run', 'intervals', 'tempo_run'],
    taperFinalWeek: true,
    description: '10K training',
  },
  'half_marathon': {
    sessionsPerWeek: [4, 4, 5, 4],
    longRunCap: 18,
    baseEasyKm: 5,
    easyKmIncrement: 1,
    qualityAlternation: ['tempo_run', 'tempo_run', 'intervals'],
    taperFinalWeek: true,
    description: 'Half marathon training',
  },
  'pace': {
    sessionsPerWeek: [3, 3, 4, 3],
    longRunCap: 10,
    baseEasyKm: 4,
    easyKmIncrement: 0.5,
    qualityAlternation: ['tempo_run', 'intervals', 'tempo_run'],
    taperFinalWeek: false,
    description: 'Pace improvement',
  },
  'distance': {
    sessionsPerWeek: [3, 4, 4, 4],
    longRunCap: 16,
    baseEasyKm: 5,
    easyKmIncrement: 1,
    qualityAlternation: ['tempo_run', null, 'tempo_run'],
    taperFinalWeek: false,
    description: 'Distance building',
  },
  'endurance': {
    sessionsPerWeek: [3, 4, 4, 4],
    longRunCap: 15,
    baseEasyKm: 5,
    easyKmIncrement: 1,
    qualityAlternation: [null, 'tempo_run', null],
    taperFinalWeek: false,
    description: 'Endurance building',
  },
};

// ─── Session templates ────────────────────────────────────────────────────────

function easyRunSession(km, weekNum) {
  const variations = [
    `Run ${km}km at a relaxed, conversational pace. Focus on breathing easy and keeping heart rate low.`,
    `${km}km easy aerobic run. Keep effort light — you should be able to hold a conversation throughout.`,
    `${km}km easy run. Prioritize consistency over speed. Comfortable effort only.`,
    `Easy ${km}km. Run by feel, keep it relaxed. Perfect for building your aerobic base.`,
  ];
  return {
    workout_type: 'easy_run',
    planned_distance: round(km),
    planned_pace: 0,
    instructions: variations[(weekNum + Math.floor(km)) % variations.length],
  };
}

function longRunSession(km, weekNum) {
  return {
    workout_type: 'long_run',
    planned_distance: round(km),
    planned_pace: 0,
    instructions: `${km}km long run at easy effort. Run relaxed and steady — this session builds endurance, not speed. Take walk breaks if needed on week ${weekNum} long efforts.`,
  };
}

function tempoRunSession(km, weekNum) {
  const warmup = round(km * 0.25, 0.5);
  const main = round(km * 0.55, 0.5);
  const cooldown = round(km * 0.2, 0.5);
  const variations = [
    `Warm up ${warmup}km easy, then run ${main}km at a comfortably hard pace (you can speak short phrases but not full sentences). Cool down ${cooldown}km easy.`,
    `${warmup}km easy warm-up → ${main}km at controlled tempo effort → ${cooldown}km easy cool-down. Keep the main segment at a steady, sustained effort.`,
    `Tempo run: ${warmup}km jog to warm up, ${main}km at threshold effort, ${cooldown}km easy to finish. Avoid going out too hard in the first kilometre.`,
  ];
  return {
    workout_type: 'tempo_run',
    planned_distance: round(km),
    planned_pace: 0,
    instructions: variations[weekNum % variations.length],
  };
}

function intervalSession(km, weekNum) {
  const reps = weekNum <= 2 ? 4 : 5;
  const repDist = round(km / (reps + 1), 0.2);
  return {
    workout_type: 'intervals',
    planned_distance: round(km),
    planned_pace: 0,
    instructions: `Warm up 1km easy. Then run ${reps} x ${repDist}km fast repeats (hard effort, not sprint) with 90-second easy jog recovery between each. Cool down 1km easy. Total ~${km}km.`,
  };
}

function recoveryRunSession(km) {
  return {
    workout_type: 'recovery_run',
    planned_distance: round(km),
    planned_pace: 0,
    instructions: `${km}km very easy recovery jog. Keep the effort minimal — slower than your easy pace. This run helps clear fatigue, not build fitness.`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round(val, step = 0.5) {
  return Math.round(val / step) * step;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function addDaysToDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Weekly layout builder ────────────────────────────────────────────────────

/**
 * Builds a weekly session layout. Returns array of {dayIndex, session}.
 * Ensures no hard days on consecutive days.
 */
function buildWeek(goalType, weekNum, totalWeeks, blueprint, avgRecentKm) {
  const isRaceGoal = ['5k', '10k', 'half_marathon'].includes(goalType);
  const isFinalWeek = weekNum === totalWeeks;
  const isTaperWeek = blueprint.taperFinalWeek && isFinalWeek;
  const taperFactor = isTaperWeek ? 0.75 : 1.0;
  const progressFactor = 1 + (weekNum - 1) * 0.10; // ~10% progression per week

  // Base easy run km
  const baseKm = clamp(
    blueprint.baseEasyKm + (weekNum - 1) * blueprint.easyKmIncrement,
    blueprint.baseEasyKm,
    blueprint.baseEasyKm * 1.6
  ) * taperFactor;

  const longKm = clamp(
    blueprint.baseEasyKm * 1.8 + (weekNum - 1) * blueprint.easyKmIncrement * 1.5,
    blueprint.baseEasyKm * 1.4,
    blueprint.longRunCap
  ) * taperFactor;

  const tempoKm = clamp(baseKm * 1.1, 4, 10) * taperFactor;
  const intervalKm = clamp(baseKm * 0.9, 4, 8) * taperFactor;
  const recoveryKm = clamp(baseKm * 0.65, 2.5, 5) * taperFactor;

  const sessions = blueprint.sessionsPerWeek[weekNum - 1] || 3;
  const qualityType = isTaperWeek
    ? 'tempo_run'
    : blueprint.qualityAlternation[(weekNum - 1) % blueprint.qualityAlternation.length];

  // Layout templates per session count — [dayIndex, type]
  const layouts = {
    3: [
      [1, 'easy'],         // Tue
      [3, 'quality'],      // Thu
      [5, 'long'],         // Sat
    ],
    4: [
      [1, 'easy'],         // Tue
      [3, 'quality'],      // Thu
      [5, 'long'],         // Sat
      [0, 'easy2'],        // Mon (light)
    ],
    5: [
      [0, 'easy'],         // Mon
      [1, 'quality'],      // Tue
      [3, 'easy'],         // Thu
      [4, 'easy2'],        // Fri
      [6, 'long'],         // Sun
    ],
  };

  const layout = layouts[clamp(sessions, 3, 5)];

  return layout.map(([dayIdx, type]) => {
    let session;
    switch (type) {
      case 'quality':
        if (!qualityType) {
          session = easyRunSession(round(baseKm * 1.05), weekNum);
        } else if (qualityType === 'tempo_run') {
          session = tempoRunSession(round(tempoKm), weekNum);
        } else {
          session = intervalSession(round(intervalKm), weekNum);
        }
        break;
      case 'long':
        session = longRunSession(round(longKm), weekNum);
        break;
      case 'easy':
        session = easyRunSession(round(baseKm), weekNum);
        break;
      case 'easy2':
        session = easyRunSession(round(baseKm * 0.85), weekNum);
        break;
      default:
        session = recoveryRunSession(round(recoveryKm));
    }
    return { dayIndex: dayIdx, session };
  });
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
    const blueprint = GOAL_BLUEPRINTS[goalType];

    if (!blueprint) {
      return Response.json({ success: false, error: `Unknown goal type: ${goalType}` }, { status: 400 });
    }

    // ── Compute time horizon ────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(goal.target_date);
    targetDate.setHours(0, 0, 0, 0);

    const totalDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);

    if (totalWeeks < 1) {
      return Response.json({
        success: false,
        error: 'Target date is too soon to generate a meaningful plan (minimum 7 days required).',
      }, { status: 400 });
    }

    // Cap at 12 weeks max to keep plans practical
    const planWeeks = clamp(totalWeeks, 1, 12);

    // ── Fetch recent runs for context ──────────────────────────────────────
    const runs = await base44.asServiceRole.entities.Run.filter({
      created_by: user.email,
      status: 'completed',
    });

    const recentRuns = runs
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 10);

    const avgRecentKm = recentRuns.length > 0
      ? recentRuns.reduce((s, r) => s + (r.distance_km || 0), 0) / recentRuns.length
      : 0;

    // ── Delete stale sessions for this goal (idempotent re-generation) ─────
    const existing = await base44.asServiceRole.entities.WorkoutSession.filter({
      user_email: user.email,
    });
    // Only delete sessions that belong to plans for this goal_id
    const existingPlans = await base44.asServiceRole.entities.TrainingPlan.filter({
      goal_id,
      user_email: user.email,
    });
    const existingPlanIds = new Set(existingPlans.map(p => p.id));
    for (const s of existing) {
      if (existingPlanIds.has(s.plan_id)) {
        await base44.asServiceRole.entities.WorkoutSession.delete(s.id);
      }
    }
    for (const p of existingPlans) {
      await base44.asServiceRole.entities.TrainingPlan.delete(p.id);
    }

    // ── Generate and persist plan weeks ────────────────────────────────────
    let totalSessionsCreated = 0;

    for (let weekNum = 1; weekNum <= planWeeks; weekNum++) {
      const weekSessions = buildWeek(goalType, weekNum, planWeeks, blueprint, avgRecentKm);

      // Create TrainingPlan record
      const plan = await base44.asServiceRole.entities.TrainingPlan.create({
        user_email: user.email,
        goal_id,
        week_number: weekNum,
        plan_data: {},
        status: weekNum === 1 ? 'active' : 'upcoming',
      });

      // Create WorkoutSession records, scheduled from start of that week
      const weekStartOffset = (weekNum - 1) * 7;

      for (const { dayIndex, session } of weekSessions) {
        const scheduledDate = addDaysToDate(today, weekStartOffset + dayIndex);

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

        totalSessionsCreated++;
      }
    }

    return Response.json({
      success: true,
      goal_id,
      sessions_created: totalSessionsCreated,
      weeks_generated: planWeeks,
    });

  } catch (error) {
    console.error('generateTrainingPlan error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, insightType = 'performance' } = await req.json();

    // Fetch user data
    const runs = await base44.entities.Run.filter({ 
      created_by: userEmail, 
      status: 'completed' 
    });

    const groups = await base44.entities.GroupMember.filter({ 
      user_email: userEmail 
    });

    const challenges = await base44.entities.ChallengeParticipant.filter({ 
      user_email: userEmail 
    });

    // Calculate stats
    const last30DaysRuns = runs.filter(r => {
      const runDate = new Date(r.start_time);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return runDate >= thirtyDaysAgo;
    });

    const totalDistance = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0);
    const avgPace = runs.length > 0 
      ? runs.reduce((sum, r) => sum + (r.pace_min_per_km || 0), 0) / runs.length 
      : 0;
    const totalRuns = runs.length;

    let prompt = '';
    let response_json_schema = null;

    if (insightType === 'performance') {
      prompt = `You are a running coach AI. Analyze this runner's performance and provide motivating insights.

Stats:
- Total runs: ${totalRuns}
- Total distance: ${totalDistance.toFixed(1)} km
- Average pace: ${avgPace.toFixed(2)} min/km
- Runs in last 30 days: ${last30DaysRuns.length}
- Active groups: ${groups.length}
- Active challenges: ${challenges.length}

Provide:
1. A performance summary (2-3 sentences)
2. Three specific actionable tips to improve
3. Motivational message based on their progress

Be encouraging, specific, and actionable.`;

      response_json_schema = {
        type: "object",
        properties: {
          summary: { type: "string" },
          tips: {
            type: "array",
            items: { type: "string" }
          },
          motivation: { type: "string" }
        }
      };
    } else if (insightType === 'group_trends') {
      const groupIds = groups.map(g => g.group_id);
      
      prompt = `You are a community running coach. Analyze group activity trends and provide insights.

User is member of ${groups.length} groups.
Recent activity: ${last30DaysRuns.length} runs in 30 days
Active challenges: ${challenges.length}

Generate insights about:
1. Group engagement trends
2. How user compares to group activity
3. Suggestions for group challenges or events

Be specific and actionable.`;

      response_json_schema = {
        type: "object",
        properties: {
          engagement_insight: { type: "string" },
          comparison: { type: "string" },
          suggestions: {
            type: "array",
            items: { type: "string" }
          }
        }
      };
    } else if (insightType === 'peer_match') {
      prompt = `Based on this runner's profile, suggest what type of coaching partner would be ideal:

Stats:
- Total runs: ${totalRuns}
- Total distance: ${totalDistance.toFixed(1)} km
- Average pace: ${avgPace.toFixed(2)} min/km
- Experience level: ${totalRuns < 20 ? 'Beginner' : totalRuns < 100 ? 'Intermediate' : 'Advanced'}

Suggest ideal peer coach characteristics and shared goals.`;

      response_json_schema = {
        type: "object",
        properties: {
          ideal_experience: { type: "string" },
          shared_goals: {
            type: "array",
            items: { type: "string" }
          },
          match_reason: { type: "string" }
        }
      };
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema,
    });

    return Response.json({ 
      insights: result,
      stats: {
        totalRuns,
        totalDistance,
        avgPace,
        recentActivity: last30DaysRuns.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
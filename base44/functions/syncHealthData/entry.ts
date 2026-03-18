import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync health data from connected platforms (Apple Health / Google Fit)
 * 
 * IMPLEMENTATION NOTES:
 * - For Apple Health: Requires native iOS app with HealthKit integration
 * - For Google Fit: Requires OAuth 2.0 with Google Fit API scopes
 * - Web apps cannot directly access these platforms
 * 
 * PRODUCTION SETUP:
 * 1. Apple Health: Build iOS app, integrate HealthKit, send data to this endpoint
 * 2. Google Fit: Use OAuth connector, request scopes: 
 *    - https://www.googleapis.com/auth/fitness.activity.read
 *    - https://www.googleapis.com/auth/fitness.heart_rate.read
 *    - https://www.googleapis.com/auth/fitness.body.read
 * 3. Or use third-party services like Terra API, Validic, or Apple Health Kit Cloud Sync
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, manualData } = await req.json();

    // For demo: Accept manual data or simulate platform sync
    if (manualData) {
      // Manual health data entry
      await base44.entities.HealthData.create({
        user_email: user.email,
        date: manualData.date || new Date().toISOString().split('T')[0],
        steps: manualData.steps,
        resting_heart_rate: manualData.resting_heart_rate,
        avg_heart_rate: manualData.avg_heart_rate,
        sleep_hours: manualData.sleep_hours,
        calories_burned: manualData.calories_burned,
        active_minutes: manualData.active_minutes,
        weight_kg: manualData.weight_kg,
        source: 'manual'
      });

      return Response.json({ 
        success: true, 
        message: 'Health data saved successfully',
        synced: 1
      });
    }

    // Simulate platform sync (replace with actual API calls in production)
    if (platform === 'apple_health' || platform === 'google_fit') {
      // Generate realistic health data for the last 7 days
      const syncedRecords = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Check if data already exists for this date
        const existing = await base44.entities.HealthData.filter({
          user_email: user.email,
          date: dateStr
        });

        if (existing.length === 0) {
          const healthData = {
            user_email: user.email,
            date: dateStr,
            steps: Math.floor(6000 + Math.random() * 8000), // 6k-14k steps
            resting_heart_rate: Math.floor(55 + Math.random() * 15), // 55-70 BPM
            avg_heart_rate: Math.floor(75 + Math.random() * 20), // 75-95 BPM
            sleep_hours: 6 + Math.random() * 2.5, // 6-8.5 hours
            calories_burned: Math.floor(1800 + Math.random() * 800), // 1800-2600 cal
            active_minutes: Math.floor(30 + Math.random() * 90), // 30-120 min
            weight_kg: 70 + Math.random() * 10, // 70-80 kg
            source: platform
          };

          await base44.entities.HealthData.create(healthData);
          syncedRecords.push(healthData);
        }
      }

      // Update user's last sync time
      await base44.auth.updateMe({
        last_health_sync: new Date().toISOString(),
        health_sync_enabled: true
      });

      return Response.json({ 
        success: true, 
        message: `Synced ${syncedRecords.length} days of health data from ${platform}`,
        synced: syncedRecords.length
      });
    }

    return Response.json({ error: 'Invalid platform' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
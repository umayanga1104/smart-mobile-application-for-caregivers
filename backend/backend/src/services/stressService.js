const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
import { HealthSnapshot } from '../models/HealthSnapshot.js';

const stressService = {
  /**
   * Forward health data to the FastAPI stress prediction ML service.
   * Validates input, calls /predict, and returns the result.
   */
  predictStress: async (req, res) => {
    try {
      const { heartRate, skinTemperature, steps, accelerometer } =
        req.body;

      // ── Validation ──
      if (
        !heartRate ||
        !Array.isArray(heartRate) ||
        heartRate.length < 10
      ) {
        return res.status(400).json({
          error: `At least 10 heart rate values are required. Received: ${
            heartRate ? heartRate.length : 0
          }`,
        });
      }

      // Filter physiologically valid HR values
      const validHR = heartRate.filter(
        (hr) => typeof hr === 'number' && hr >= 30 && hr <= 220
      );

      if (validHR.length < 10) {
        return res.status(400).json({
          error:
            `Not enough valid heart rate values. Received ${heartRate.length} readings, but only ${validHR.length} are within the valid range (30–220 BPM). Please ensure your watch is actively monitoring and data is synced.`,
        });
      }

      const payload = {
        heartRate: validHR,
        skinTemperature: skinTemperature || null,
        steps: typeof steps === 'number' ? steps : 0,
        accelerometer: accelerometer || null,
      };

      // ── Personal baseline HR ──
      // Query the user's last 30 days of HR snapshots to compute their
      // personal average resting HR. This compensates for individuals
      // whose natural HR (e.g. 85 BPM) is above the WESAD training
      // population mean (~72 BPM), preventing false-stress predictions.
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentSnapshots = await HealthSnapshot.find({
          firebaseUID: req.firebaseUser.uid,
          createdAt: { $gte: thirtyDaysAgo },
        })
          .select('heartRate')
          .limit(50)
          .lean();

        if (recentSnapshots.length >= 5) {
          const hrMeans = recentSnapshots
            .map((s) => s.heartRate?.mean)
            .filter((v) => v != null && v >= 40 && v <= 180);
          if (hrMeans.length >= 5) {
            // Use the 25th percentile to represent calm/resting baseline
            // (avoids inflating baseline due to genuinely-stressed windows)
            hrMeans.sort((a, b) => a - b);
            const p25Index = Math.floor(hrMeans.length * 0.25);
            payload.baselineHR = Math.round(hrMeans[p25Index]);
            console.log(
              `📊 Personal HR baseline: ${payload.baselineHR} BPM (from ${hrMeans.length} snapshots)`
            );
          }
        }
      } catch (baselineErr) {
        // Non-blocking: if baseline lookup fails, prediction continues without it
        console.warn('⚠️ Could not compute HR baseline:', baselineErr.message);
      }

      console.log(
        `🧠 Stress prediction request: ${validHR.length} HR values, ${
          payload.steps
        } steps`
      );

      // ── Forward to ML service ──
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('ML service error:', data);
        return res.status(response.status).json({
          error: data.detail || 'Stress prediction service error',
        });
      }

      console.log(
        `✅ Stress prediction: ${data.label} (score: ${data.stress_score})`
      );

      // ── Auto-save health snapshot ──
      try {
        const hrValues = validHR;
        const hrMean = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;
        const hrMin = Math.min(...hrValues);
        const hrMax = Math.max(...hrValues);

        await HealthSnapshot.create({
          firebaseUID: req.firebaseUser.uid,
          stressScore: data.stress_score,
          stressLabel: data.label,
          confidence: data.confidence,
          contextRule: data.context_rule || null,
          heartRate: {
            mean: Math.round(hrMean),
            min: hrMin,
            max: hrMax,
            count: hrValues.length,
          },
          steps: payload.steps || 0,
        });
        console.log('📊 Health snapshot saved.');
      } catch (snapErr) {
        // Non-blocking: don't fail the prediction if snapshot save fails
        console.error('⚠️ Failed to save health snapshot:', snapErr.message);
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('❌ Stress Prediction Error:', error.message);

      if (error.cause?.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error:
            'Stress prediction service is currently unavailable. Please try again later.',
        });
      }

      return res.status(500).json({
        error: 'Failed to predict stress level.',
      });
    }
  },
};

export default stressService;
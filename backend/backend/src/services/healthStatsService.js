// src/services/healthStatsService.js
import { HealthSnapshot } from '../models/HealthSnapshot.js';

const healthStatsService = {
  /**
   * Save a health snapshot after a stress prediction.
   */
  saveSnapshot: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;
      const { stressScore, stressLabel, confidence, contextRule, heartRate, steps } = req.body;

      if (stressScore == null || !stressLabel || confidence == null || !heartRate?.mean) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }

      const snapshot = await HealthSnapshot.create({
        firebaseUID: uid,
        stressScore,
        stressLabel,
        confidence,
        contextRule: contextRule || null,
        heartRate: {
          mean: heartRate.mean,
          min: heartRate.min || null,
          max: heartRate.max || null,
          count: heartRate.count || null,
        },
        steps: steps || 0,
      });

      return res.status(201).json({ id: snapshot._id, message: 'Snapshot saved.' });
    } catch (error) {
      console.error('❌ Save snapshot error:', error.message);
      return res.status(500).json({ error: 'Failed to save health snapshot.' });
    }
  },

  /**
   * Get aggregated health statistics for the user.
   */
  getStats: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;

      const now = new Date();
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      // Get all snapshots within 30 days
      const snapshots = await HealthSnapshot.find({
        firebaseUID: uid,
        createdAt: { $gte: thirtyDaysAgo },
      }).sort({ createdAt: -1 }).lean();

      const last7Days = snapshots.filter(s => new Date(s.createdAt) >= sevenDaysAgo);
      const totalPredictions = await HealthSnapshot.countDocuments({ firebaseUID: uid });

      // ─── Average Stress Score ─────────────────────
      const avg7Day = last7Days.length > 0
        ? Math.round(last7Days.reduce((sum, s) => sum + s.stressScore, 0) / last7Days.length)
        : null;
      const avg30Day = snapshots.length > 0
        ? Math.round(snapshots.reduce((sum, s) => sum + s.stressScore, 0) / snapshots.length)
        : null;

      // ─── Stress Trend (compare first half vs second half of 7-day data) ──
      // Requires at least 4 data points; fewer = 'new' (tracking started)
      let trend = last7Days.length >= 4 ? 'stable' : 'new';
      if (last7Days.length >= 4) {
        const mid = Math.floor(last7Days.length / 2);
        // last7Days is sorted newest first, so first half = recent, second half = older
        const recentAvg = last7Days.slice(0, mid).reduce((s, x) => s + x.stressScore, 0) / mid;
        const olderAvg = last7Days.slice(mid).reduce((s, x) => s + x.stressScore, 0) / (last7Days.length - mid);
        const diff = recentAvg - olderAvg;
        if (diff < -5) trend = 'improving';
        else if (diff > 5) trend = 'worsening';
      }

      // ─── Stress Distribution ──────────────────────
      const distribution = { low: 0, moderate: 0, high: 0, veryHigh: 0 };
      snapshots.forEach(s => {
        if (s.stressScore <= 25) distribution.low++;
        else if (s.stressScore <= 50) distribution.moderate++;
        else if (s.stressScore <= 75) distribution.high++;
        else distribution.veryHigh++;
      });

      // ─── Heart Rate & Steps Averages ──────────────
      const avgHeartRate = last7Days.length > 0
        ? Math.round(last7Days.reduce((sum, s) => sum + s.heartRate.mean, 0) / last7Days.length)
        : null;
      const avgSteps = last7Days.length > 0
        ? Math.round(last7Days.reduce((sum, s) => sum + (s.steps || 0), 0) / last7Days.length)
        : null;

      // ─── Recent History (last 10 entries for chart) ──
      const recentHistory = snapshots.slice(0, 20).map(s => ({
        date: s.createdAt,
        stressScore: s.stressScore,
        stressLabel: s.stressLabel,
        heartRate: s.heartRate.mean,
        steps: s.steps,
        confidence: s.confidence,
      }));

      // ─── Streak (unique days with predictions in last 30 days) ──
      const uniqueDays = new Set(
        snapshots.map(s => new Date(s.createdAt).toISOString().split('T')[0])
      );
      const streakDays = uniqueDays.size;

      // ─── Health Insights ──────────────────────────
      const insights = [];
      if (avg7Day !== null) {
        if (avg7Day <= 25) {
          insights.push({ type: 'positive', text: 'Your stress levels have been low this week. Great job managing your wellbeing!' });
        } else if (avg7Day <= 50) {
          insights.push({ type: 'neutral', text: 'Your stress is moderate this week. Consider taking short breaks throughout the day.' });
        } else {
          insights.push({ type: 'warning', text: 'Your stress has been elevated this week. Try to prioritize self-care and rest.' });
        }
      }
      if (trend === 'improving') {
        insights.push({ type: 'positive', text: 'Your stress trend is improving — keep up the good work!' });
      } else if (trend === 'worsening') {
        insights.push({ type: 'warning', text: 'Your stress levels are trending upward. Consider talking to someone or adjusting your routine.' });
      } else if (trend === 'new') {
        insights.push({ type: 'neutral', text: 'Keep checking in to build your stress history — trend analysis will appear after 4+ readings.' });
      }
      if (avgHeartRate !== null) {
        if (avgHeartRate > 100) {
          insights.push({ type: 'warning', text: `Your average resting heart rate (${avgHeartRate} BPM) is elevated. Monitor and consult a doctor if persistent.` });
        } else if (avgHeartRate >= 60 && avgHeartRate <= 100) {
          insights.push({ type: 'positive', text: `Your average heart rate (${avgHeartRate} BPM) is in the normal range.` });
        }
      }
      if (avgSteps !== null) {
        if (avgSteps < 3000) {
          insights.push({ type: 'neutral', text: `You're averaging ${avgSteps.toLocaleString()} steps/day. Try to increase daily movement when possible.` });
        } else if (avgSteps >= 8000) {
          insights.push({ type: 'positive', text: `Great activity! You're averaging ${avgSteps.toLocaleString()} steps/day.` });
        }
      }

      return res.status(200).json({
        totalPredictions,
        averageStress: { last7Days: avg7Day, last30Days: avg30Day },
        stressTrend: trend,
        stressDistribution: distribution,
        averageHeartRate: avgHeartRate,
        averageSteps: avgSteps,
        recentHistory,
        streakDays,
        insights,
        dataPoints: { last7Days: last7Days.length, last30Days: snapshots.length },
      });
    } catch (error) {
      console.error('❌ Get stats error:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve health statistics.' });
    }
  },

  /**
   * Get user health profile summary (for AI personalization context).
   */
  getProfileContext: async (req, res) => {
    try {
      const uid = req.firebaseUser.uid;
      const context = await buildUserContext(uid);
      return res.status(200).json({ context });
    } catch (error) {
      console.error('❌ Get profile context error:', error.message);
      return res.status(500).json({ error: 'Failed to build profile context.' });
    }
  },
};

/**
 * Build a natural language summary of the user's health profile
 * for injecting into AI prompts.
 */
export async function buildUserContext(firebaseUID) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snapshots = await HealthSnapshot.find({
      firebaseUID,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 }).lean();

    if (snapshots.length === 0) return null;

    const avgStress = Math.round(snapshots.reduce((s, x) => s + x.stressScore, 0) / snapshots.length);
    const avgHR = Math.round(snapshots.reduce((s, x) => s + x.heartRate.mean, 0) / snapshots.length);
    const avgSteps = Math.round(snapshots.reduce((s, x) => s + (x.steps || 0), 0) / snapshots.length);
    const latest = snapshots[0];

    // Determine trend (requires >= 4 check-ins)
    let trend = snapshots.length >= 4 ? 'stable' : 'new';
    if (snapshots.length >= 4) {
      const mid = Math.floor(snapshots.length / 2);
      const recentAvg = snapshots.slice(0, mid).reduce((s, x) => s + x.stressScore, 0) / mid;
      const olderAvg = snapshots.slice(mid).reduce((s, x) => s + x.stressScore, 0) / (snapshots.length - mid);
      if (recentAvg - olderAvg < -5) trend = 'improving';
      else if (recentAvg - olderAvg > 5) trend = 'worsening';
    }

    const stressLevel = avgStress <= 25 ? 'low' : avgStress <= 50 ? 'moderate' : avgStress <= 75 ? 'high' : 'very high';
    const trendLabel = trend === 'new' ? 'tracking started (not enough data for trend)' : trend;

    let context = `User health profile (last 7 days, ${snapshots.length} check-ins):\n`;
    context += `- Average stress: ${avgStress}/100 (${stressLevel}), trend: ${trendLabel}\n`;
    context += `- Latest stress: ${latest.stressScore}/100 (${latest.stressLabel})\n`;
    context += `- Average heart rate: ${avgHR} BPM\n`;
    context += `- Average steps: ${avgSteps}/day\n`;

    if (latest.contextRule) {
      context += `- Latest context: ${latest.contextRule}\n`;
    }

    return context;
  } catch (error) {
    console.error('❌ buildUserContext error:', error.message);
    return null;
  }
}

export default healthStatsService;

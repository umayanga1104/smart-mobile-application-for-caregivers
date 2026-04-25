import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HealthTipCard from '../../components/home/HealthTipCard';
import SmartwatchCard from '../../components/home/SmartwatchCard';
import StressPredictionCard from '../../components/home/StressPredictionCard';
import { getIconAndColor, getMockTip } from '../../constants/healthTips';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthProvider';
import assistantService from '../../services/assistant.service';
import healthConnectService from '../../services/healthConnect.service';
import healthStatsService from '../../services/healthStats.service';
import stressPredictionService from '../../services/stressPrediction.service';

const theme = Colors.dark;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getCategoriesForStress = (stressScore) => {
  if (stressScore == null) {
    return assistantService.getAvailableCategories().sort(() => 0.5 - Math.random()).slice(0, 4);
  }
  if (stressScore <= 25) return ['nutrition', 'exercise', 'sleep', 'daily_routine'];
  if (stressScore <= 50) return ['stress_management', 'self_care', 'sleep', 'emotional_wellbeing'];
  return ['stress_management', 'emotional_wellbeing', 'self_care', 'communication'];
};

export default function HomeScreen() {
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [healthTips, setHealthTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [tipsError, setTipsError] = useState(null);

  const [hcConnected, setHcConnected] = useState(false);
  const [hcConnecting, setHcConnecting] = useState(false);
  const [hcError, setHcError] = useState(null);
  const [currentHR, setCurrentHR] = useState(null);
  const [currentSteps, setCurrentSteps] = useState(null);

  const [stressResult, setStressResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  const [lastStats, setLastStats] = useState(null);

  const refreshInterval = useRef(null);

  const loadHealthTips = async (stressScore = null) => {
    try {
      setTipsLoading(true);
      setTipsError(null);
      const selectedCategories = getCategoriesForStress(stressScore);
      const allTips = [];

      for (const category of selectedCategories) {
        try {
          const response = await assistantService.generateTips(category, { count: 1 });
          if (response && (response.tips || response.data)) {
            const tipsArray = response.tips || response.data;
            const categoryTips = tipsArray.map((tip, index) => {
              const { icon, color } = getIconAndColor(category, index);
              return {
                id: `${category}-${index}-${Date.now()}`,
                category,
                icon,
                iconColor: color,
                title: tip.title || tip,
                body: tip.description || tip.body || '',
              };
            });
            allTips.push(...categoryTips);
          }
        } catch {
          const mockTip = getMockTip(category);
          const { icon, color } = getIconAndColor(category, 0);
          allTips.push({
            id: `${category}-mock-${Date.now()}`,
            category,
            icon,
            iconColor: color,
            title: mockTip.title,
            body: mockTip.description,
          });
        }
      }

      if (allTips.length === 0) setTipsError('Unable to load health tips. Please try again later.');
      setHealthTips(allTips);
    } catch (error) {
      console.error('Error loading health tips:', error);
      setTipsError('Failed to load health tips');
      setHealthTips([]);
    } finally {
      setTipsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const stats = await healthStatsService.getStats();
      setLastStats(stats);
      loadHealthTips(stats?.recentHistory?.[0]?.stressScore ?? null);
    } catch {
      loadHealthTips(null);
    }
  };

  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshHealthData = async () => {
    try {
      const [hr, steps] = await Promise.all([
        healthConnectService.getLatestHeartRate(),
        healthConnectService.getSteps(1440),
      ]);
      if (hr != null) setCurrentHR(hr);
      setCurrentSteps(steps);
    } catch (error) {
      console.error('Refresh health data error:', error);
    }
  };

  const handleVerifyPermissions = async () => {
    setHcConnecting(true);
    setHcError(null);
    try {
      const verification = await healthConnectService.verifyPermissions();
      if (verification.verified) {
        setHcConnected(true);
        await refreshHealthData();
        setHcError(null);
      } else {
        setHcError(
          `Permissions not yet granted.\n\nWhat to do:\n` +
          `1. Open Health Connect app\n` +
          `2. Find your app and toggle ON Heart Rate & Steps\n` +
          `3. Return here and tap "Verify Permissions" again\n\n` +
          `Heart Rate: ${verification.heartRateGranted ? 'Granted' : 'Denied'}\n` +
          `Steps: ${verification.stepsGranted ? 'Granted' : 'Denied'}`
        );
      }
    } catch (error) {
      setHcError('Verification failed: ' + error.message);
    } finally {
      setHcConnecting(false);
    }
  };

  const handleConnect = async () => {
    setHcConnecting(true);
    setHcError(null);
    try {
      const availability = await healthConnectService.checkAvailability();
      if (!availability.available) {
        const msg =
          availability.status === 'UPDATE_REQUIRED'
            ? 'Please update Health Connect from the Play Store.'
            : availability.status === 'NOT_ANDROID'
            ? 'Health Connect is only available on Android.'
            : 'Health Connect is not available. Make sure the app is installed.';
        setHcError(msg);
        return;
      }

      const initialized = await healthConnectService.initialize();
      if (!initialized) {
        setHcError('Failed to initialize Health Connect.');
        return;
      }

      await healthConnectService.runDiagnostics();
      await healthConnectService.requestPermissions();

      try {
        const verification = await healthConnectService.verifyPermissions();
        if (verification.verified) {
          setHcConnected(true);
          setHcError(null);
          setHcConnecting(false);
          await refreshHealthData();
          return;
        }
      } catch {
        // auto-verify failed, show manual instructions
      }

      setHcError(
        `Permission setup required:\n\n` +
        `1. Open Health Connect from your app drawer\n` +
        `2. Find this app and toggle ON Heart Rate & Steps\n` +
        `3. Return here and tap "Verify Permissions"`
      );
    } catch (error) {
      setHcConnected(false);
      setHcError('Connection failed: ' + (error.message || error));
    } finally {
      setHcConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setHcConnected(false);
    setCurrentHR(null);
    setCurrentSteps(null);
    setStressResult(null);
    setHcError(null);
    setPredictionError(null);
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  };

  useEffect(() => {
    if (hcConnected) return;
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && !hcConnected && hcError?.toLowerCase().includes('permission')) {
        try {
          const verification = await healthConnectService.verifyPermissions();
          if (verification.verified) {
            setHcConnected(true);
            setHcError(null);
            setHcConnecting(false);
            await refreshHealthData();
          }
        } catch {
          // silently ignore
        }
      }
    });
    return () => subscription.remove();
  }, [hcConnected, hcError]);

  useEffect(() => {
    if (!hcConnected) return;
    refreshHealthData();
    refreshInterval.current = setInterval(refreshHealthData, 30000);
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, [hcConnected]);

  const handleCheckStress = async () => {
    setPredicting(true);
    setPredictionError(null);
    try {
      const data = await healthConnectService.collectForStressPrediction();
      if (!data.heartRate || data.heartRate.length < 10) {
        setPredictionError(
          `Not enough heart rate data (${data.heartRate.length} readings). ` +
          'Ensure your watch is actively monitoring heart rate.'
        );
        return;
      }
      const result = await stressPredictionService.predict(data);
      setStressResult(result);
      try {
        const stats = await healthStatsService.getStats();
        setLastStats(stats);
      } catch {
        // non-blocking
      }
      loadHealthTips(result.stress_score);
      await refreshHealthData();
    } catch (error) {
      setPredictionError(
        error.response?.data?.error || error.message || 'Failed to predict stress level.'
      );
    } finally {
      setPredicting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const promises = [loadHealthTips(stressResult?.stress_score ?? null)];
    if (hcConnected) promises.push(refreshHealthData());
    try {
      const stats = await healthStatsService.getStats();
      setLastStats(stats);
    } catch {
      // non-blocking
    }
    await Promise.all(promises);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {tipsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>Loading personalized tips…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
          </View>

          <SmartwatchCard
            connected={hcConnected}
            connecting={hcConnecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onVerify={hcError?.toLowerCase().includes('permission') ? handleVerifyPermissions : null}
            heartRate={currentHR}
            steps={currentSteps}
            error={hcError}
            historicalHR={lastStats?.averageHeartRate ?? null}
            historicalSteps={lastStats?.averageSteps ?? null}
          />

          <StressPredictionCard
            connected={hcConnected}
            onCheckStress={handleCheckStress}
            predicting={predicting}
            result={stressResult}
            lastResult={
              !stressResult && lastStats?.recentHistory?.[0]
                ? {
                    stress_score: lastStats.recentHistory[0].stressScore,
                    confidence: lastStats.recentHistory[0].confidence,
                  }
                : null
            }
            error={predictionError}
          />

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Health Tips</Text>
            <Text style={styles.sectionSubtitle}>Personalized insights for your wellness</Text>

            {tipsError && healthTips.length === 0 && (
              <Text style={[styles.tipBody, { color: theme.error || '#FF3B30', marginVertical: 16 }]}>
                {tipsError}
              </Text>
            )}

            {!tipsLoading && healthTips.length > 0
              ? healthTips.map((tip) => <HealthTipCard key={tip.id} tip={tip} />)
              : !tipsLoading && healthTips.length === 0 && !tipsError && (
                  <Text style={[styles.tipBody, { marginVertical: 16 }]}>
                    No tips available right now. Pull down to refresh.
                  </Text>
                )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.secondaryText },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },
  greetingContainer: { marginTop: 8, marginBottom: 24 },
  greeting: { fontSize: 34, fontWeight: '700', color: theme.text },
  username: { fontSize: 34, fontWeight: '700', color: theme.secondaryText },
  sectionContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 15, color: theme.secondaryText, marginBottom: 16 },
  tipBody: { fontSize: 14, color: theme.secondaryText, lineHeight: 20 },
});

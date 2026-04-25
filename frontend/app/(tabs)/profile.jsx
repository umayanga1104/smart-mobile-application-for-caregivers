import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  ChevronRight,
  Equal,
  Footprints,
  Heart,
  Info,
  LogOut,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { guidelinesContent, privacyContent } from '../../constants/profileContent';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthProvider';
import healthStatsService from '../../services/healthStats.service';
import userService from '../../services/user.service';

const theme = Colors.dark;

// ─── Settings Row ─────────────────────────────────────
const SettingsRow = ({
  icon: Icon,
  iconColor,
  label,
  onPress,
  showChevron = true,
  destructive = false,
  value,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.settingsRow,
      pressed && { backgroundColor: theme.elevatedBackground },
    ]}
    onPress={onPress}
  >
    <View
      style={[
        styles.rowIconContainer,
        { backgroundColor: (iconColor || theme.accent) + '20' },
      ]}
    >
      <Icon size={18} color={iconColor || theme.accent} />
    </View>
    <Text
      style={[
        styles.rowLabel,
        destructive && { color: theme.destructive },
      ]}
    >
      {label}
    </Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {showChevron && (
      <ChevronRight size={18} color={theme.tertiaryText} />
    )}
  </Pressable>
);

// ─── Section ──────────────────────────────────────────
const SettingsSection = ({ title, children }) => (
  <View style={styles.section}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

// ─── Separator ────────────────────────────────────────
const Separator = () => <View style={styles.separator} />;

// ─── Info Modal ───────────────────────────────────────
const InfoModal = ({ visible, onClose, title, content }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color={theme.secondaryText} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalText}>{content}</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Stat Metric Card ─────────────────────────────────
const MetricCard = ({ icon: Icon, iconColor, label, value, subValue }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIconWrap, { backgroundColor: iconColor + '18' }]}>
      <Icon size={18} color={iconColor} />
    </View>
    <Text style={styles.metricValue}>{value ?? '--'}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    {subValue ? <Text style={styles.metricSub}>{subValue}</Text> : null}
  </View>
);

// ─── Stress Mini Bar Chart ────────────────────────────
const StressMiniChart = ({ history }) => {
  if (!history || history.length === 0) return null;

  // Show up to last 10 entries, oldest → newest (left → right)
  const data = [...history].reverse().slice(-10);
  const maxScore = 100;

  const getBarColor = (score) => {
    if (score <= 25) return '#30D158';
    if (score <= 50) return '#FFD60A';
    if (score <= 75) return '#FF9F0A';
    return '#FF453A';
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Recent Stress Scores</Text>
      <View style={styles.chartBars}>
        {data.map((entry, i) => {
          const height = Math.max((entry.stressScore / maxScore) * 80, 4);
          const date = new Date(entry.date);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <View key={i} style={styles.chartBarWrapper}>
              <View style={styles.chartBarColumn}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height,
                      backgroundColor: getBarColor(entry.stressScore),
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartBarLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#30D158' }]} />
          <Text style={styles.legendText}>Low</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD60A' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9F0A' }]} />
          <Text style={styles.legendText}>High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF453A' }]} />
          <Text style={styles.legendText}>V.High</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Stress Distribution Ring ─────────────────────────
const StressDistribution = ({ distribution, total }) => {
  if (!distribution || total === 0) return null;

  const items = [
    { key: 'low', label: 'Low', color: '#30D158', count: distribution.low },
    { key: 'moderate', label: 'Moderate', color: '#FFD60A', count: distribution.moderate },
    { key: 'high', label: 'High', color: '#FF9F0A', count: distribution.high },
    { key: 'veryHigh', label: 'Very High', color: '#FF453A', count: distribution.veryHigh },
  ];

  return (
    <View style={styles.distContainer}>
      <Text style={styles.chartTitle}>Stress Distribution (30d)</Text>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <View key={item.key} style={styles.distRow}>
            <View style={[styles.distDot, { backgroundColor: item.color }]} />
            <Text style={styles.distLabel}>{item.label}</Text>
            <View style={styles.distBarTrack}>
              <View
                style={[
                  styles.distBarFill,
                  { width: `${pct}%`, backgroundColor: item.color },
                ]}
              />
            </View>
            <Text style={styles.distPct}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Insight Card ─────────────────────────────────────
const InsightCard = ({ insight }) => {
  const config = {
    positive: { color: '#30D158', icon: TrendingUp },
    neutral: { color: '#FFD60A', icon: Equal },
    warning: { color: '#FF9F0A', icon: TrendingDown },
  };
  const { color, icon: InsightIcon } = config[insight.type] || config.neutral;

  return (
    <View style={[styles.insightCard, { borderLeftColor: color }]}>
      <InsightIcon size={16} color={color} style={{ marginRight: 10, marginTop: 2 }} />
      <Text style={styles.insightText}>{insight.text}</Text>
    </View>
  );
};

// ─── Profile Screen ───────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Health stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await healthStatsService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Could not load health stats:', err.message);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  // ─── Profile picture handlers ──────────────────
  const handleProfilePicture = () => {
    const options = [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
    ];
    if (user?.profilePicture) {
      options.push({ text: 'Remove Photo', onPress: removePhoto, style: 'destructive' });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile Picture', 'Choose an option', options);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await uploadProfilePicture(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await uploadProfilePicture(result.assets[0].base64);
    }
  };

  const uploadProfilePicture = async (base64) => {
    try {
      setUploadingPicture(true);
      await userService.updateProfilePicture(base64);
      updateUser({ profilePicture: base64 });
    } catch (err) {
      console.error('Upload profile picture error:', err);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const removePhoto = async () => {
    try {
      setUploadingPicture(true);
      await userService.removeProfilePicture();
      updateUser({ profilePicture: null });
    } catch (err) {
      console.error('Remove profile picture error:', err);
      Alert.alert('Error', 'Failed to remove profile picture.');
    } finally {
      setUploadingPicture(false);
    }
  };

  // ─── Trend helper ──────────────────────────────
  const getTrendInfo = (trend) => {
    switch (trend) {
      case 'improving':
        return { icon: ArrowDown, color: '#30D158', label: 'Improving' };
      case 'worsening':
        return { icon: ArrowUp, color: '#FF453A', label: 'Worsening' };
      case 'new':
        return { icon: Info, color: '#5AC8FA', label: 'Tracking — need more data' };
      default:
        return { icon: Equal, color: '#8E8E93', label: 'Stable' };
    }
  };



  const trendInfo = stats ? getTrendInfo(stats.stressTrend) : null;
  const TrendIcon = trendInfo?.icon;
  const totalDistPoints = stats
    ? (stats.stressDistribution.low + stats.stressDistribution.moderate + stats.stressDistribution.high + stats.stressDistribution.veryHigh)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── Profile Section ── */}
        <SettingsSection>
          <View style={styles.profileContainer}>
            <Pressable onPress={handleProfilePicture} style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${user.profilePicture}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Camera size={12} color="#FFFFFF" />
              </View>
              {uploadingPicture && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.username || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || user?.firebaseUser?.email || 'No email'}
              </Text>
            </View>
          </View>
        </SettingsSection>

        {/* ── Health Statistics ── */}
        <SettingsSection title="HEALTH OVERVIEW">
          {statsLoading ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <Text style={styles.statsLoadingText}>Loading your health data...</Text>
            </View>
          ) : stats && stats.totalPredictions > 0 ? (
            <View style={styles.statsContent}>
              {/* Quick Metrics Row */}
              <View style={styles.metricsRow}>
                <MetricCard
                  icon={Brain}
                  iconColor="#0A84FF"
                  label="Avg Stress"
                  value={stats.averageStress.last7Days != null ? `${stats.averageStress.last7Days}` : '--'}
                  subValue="7-day"
                />
                <MetricCard
                  icon={Heart}
                  iconColor="#FF453A"
                  label="Heart Rate"
                  value={stats.averageHeartRate != null ? `${stats.averageHeartRate}` : '--'}
                  subValue="avg BPM"
                />
                <MetricCard
                  icon={Footprints}
                  iconColor="#30D158"
                  label="Steps"
                  value={stats.averageSteps != null ? stats.averageSteps.toLocaleString() : '--'}
                  subValue="avg/day"
                />
              </View>

              {/* Stress Trend Badge */}
              {trendInfo && (
                <View style={styles.trendRow}>
                  <View style={[styles.trendBadge, { backgroundColor: trendInfo.color + '18' }]}>
                    <TrendIcon size={14} color={trendInfo.color} />
                    <Text style={[styles.trendText, { color: trendInfo.color }]}>
                      Stress trend: {trendInfo.label}
                    </Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <CalendarDays size={14} color={theme.accent} />
                    <Text style={styles.streakText}>
                      {stats.streakDays} active day{stats.streakDays !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* 30-day vs 7-day comparison */}
              {stats.averageStress.last30Days != null && stats.averageStress.last7Days != null && (
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonValue}>{stats.averageStress.last7Days}</Text>
                    <Text style={styles.comparisonLabel}>7-day avg</Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonValue}>{stats.averageStress.last30Days}</Text>
                    <Text style={styles.comparisonLabel}>30-day avg</Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonValue}>{stats.totalPredictions}</Text>
                    <Text style={styles.comparisonLabel}>Total checks</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyStats}>
              <BarChart3 size={32} color={theme.tertiaryText} />
              <Text style={styles.emptyStatsTitle}>No Health Data Yet</Text>
              <Text style={styles.emptyStatsText}>
                Connect your smartwatch and check your stress level from the Home tab to start tracking your health trends.
              </Text>
            </View>
          )}
        </SettingsSection>

        {/* ── Stress Chart ── */}
        {stats && stats.recentHistory?.length > 0 && (
          <SettingsSection title="STRESS HISTORY">
            <View style={styles.statsContent}>
              <StressMiniChart history={stats.recentHistory} />
            </View>
          </SettingsSection>
        )}

        {/* ── Distribution ── */}
        {stats && totalDistPoints > 0 && (
          <SettingsSection title="BREAKDOWN">
            <View style={styles.statsContent}>
              <StressDistribution distribution={stats.stressDistribution} total={totalDistPoints} />
            </View>
          </SettingsSection>
        )}

        {/* ── Health Insights ── */}
        {stats && stats.insights?.length > 0 && (
          <SettingsSection title="INSIGHTS">
            <View style={styles.insightsContainer}>
              {stats.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </View>
          </SettingsSection>
        )}

        {/* ── Support Section ── */}
        <SettingsSection title="SUPPORT">
          <SettingsRow
            icon={BookOpen}
            iconColor="#0A84FF"
            label="Guidelines"
            onPress={() => setShowGuidelines(true)}
          />
          <Separator />
          <SettingsRow
            icon={Shield}
            iconColor="#30D158"
            label="Privacy & Security"
            onPress={() => setShowPrivacy(true)}
          />
        </SettingsSection>

        {/* ── About Section ── */}
        <SettingsSection title="ABOUT">
          <SettingsRow
            icon={Info}
            iconColor="#8E8E93"
            label="Version"
            value="1.0.0"
            showChevron={false}
            onPress={() => {}}
          />
        </SettingsSection>

        {/* ── Sign Out ── */}
        <SettingsSection>
          <SettingsRow
            icon={LogOut}
            iconColor={theme.destructive}
            label="Sign Out"
            showChevron={false}
            destructive
            onPress={handleSignOut}
          />
        </SettingsSection>
      </ScrollView>

      {/* Guidelines Modal */}
      <InfoModal
        visible={showGuidelines}
        onClose={() => setShowGuidelines(false)}
        title="Guidelines"
        content={guidelinesContent}
      />

      {/* Privacy Modal */}
      <InfoModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy & Security"
        content={privacyContent}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.secondaryText,
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: theme.secondaryBackground,
    borderRadius: 14,
    overflow: 'hidden',
  },

  // Profile
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.secondaryBackground,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.secondaryText,
  },

  // Row
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  rowValue: {
    fontSize: 16,
    color: theme.secondaryText,
    marginRight: 8,
  },

  // Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.separator,
    marginLeft: 60,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.secondaryBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: theme.tertiaryText,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 15,
    color: theme.secondaryText,
    lineHeight: 24,
  },

  // ─── Health Stats Styles ──────────────────────────

  statsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  statsLoadingText: {
    color: theme.secondaryText,
    fontSize: 14,
  },
  statsContent: {
    padding: 16,
  },

  // Metric Cards
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricSub: {
    fontSize: 10,
    color: theme.tertiaryText,
    marginTop: 2,
  },

  // Trend
  trendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.accent + '18',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.accent,
    flexShrink: 1,
  },

  // Comparison
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.separator,
  },
  comparisonItem: {
    alignItems: 'center',
    flex: 1,
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  comparisonLabel: {
    fontSize: 11,
    color: theme.secondaryText,
    marginTop: 2,
  },
  comparisonDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: theme.separator,
  },

  // Chart
  chartContainer: {
    paddingBottom: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 14,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    gap: 4,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarColumn: {
    height: 80,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    borderRadius: 4,
    minWidth: 8,
  },
  chartBarLabel: {
    fontSize: 9,
    color: theme.tertiaryText,
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: theme.secondaryText,
  },

  // Distribution
  distContainer: {},
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  distDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  distLabel: {
    width: 65,
    fontSize: 13,
    color: theme.secondaryText,
  },
  distBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distPct: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'right',
  },

  // Insights
  insightsContainer: {
    padding: 12,
    gap: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: theme.secondaryText,
    lineHeight: 19,
  },

  // Empty state
  emptyStats: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStatsText: {
    fontSize: 13,
    color: theme.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
  },
});

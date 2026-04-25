import { Bluetooth, BluetoothOff, Footprints, Heart, Watch } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

const theme = Colors.dark;

export default function SmartwatchCard({
  connected,
  connecting,
  onConnect,
  onDisconnect,
  onVerify,
  heartRate,
  steps,
  error,
  historicalHR,
  historicalSteps,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Watch size={24} color={theme.accent} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Smartwatch</Text>
          <View style={styles.statusRow}>
            {connected ? (
              <Bluetooth size={14} color={theme.success} />
            ) : (
              <BluetoothOff size={14} color={theme.secondaryText} />
            )}
            <Text style={[styles.statusText, { color: connected ? theme.success : theme.secondaryText }]}>
              {connecting ? 'Connecting…' : connected ? 'Health Connect' : 'Not Connected'}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.connectButton,
            connected && styles.disconnectButton,
            pressed && { opacity: 0.7 },
            connecting && { opacity: 0.5 },
          ]}
          onPress={connected ? onDisconnect : onConnect}
          disabled={connecting}
        >
          <Text style={[styles.connectButtonText, connected && styles.disconnectButtonText]}>
            {connecting ? 'Connecting…' : connected ? 'Disconnect' : 'Connect'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View>
          <Text style={styles.errorText}>{error}</Text>
          {onVerify && (
            <Pressable
              style={({ pressed }) => [
                styles.connectButton,
                { marginTop: 12, backgroundColor: theme.accent },
                pressed && { opacity: 0.7 },
                connecting && { opacity: 0.5 },
              ]}
              onPress={onVerify}
              disabled={connecting}
            >
              <Text style={styles.connectButtonText}>
                {connecting ? 'Verifying…' : 'Verify Permissions'}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {connected && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Heart size={18} color="#FF453A" />
            <Text style={styles.metricValue}>{heartRate != null ? heartRate : '--'}</Text>
            <Text style={styles.metricLabel}>BPM</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Footprints size={18} color="#30D158" />
            <Text style={styles.metricValue}>{steps != null ? steps.toLocaleString() : '--'}</Text>
            <Text style={styles.metricLabel}>Steps</Text>
          </View>
        </View>
      )}

      {!connected && (historicalHR != null || historicalSteps != null) && (
        <View>
          <Text style={[styles.metricLabel, { marginBottom: 8, color: theme.tertiaryText }]}>
            7-day average
          </Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Heart size={18} color="#FF453A" />
              <Text style={styles.metricValue}>{historicalHR != null ? historicalHR : '--'}</Text>
              <Text style={styles.metricLabel}>BPM avg</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Footprints size={18} color="#30D158" />
              <Text style={styles.metricValue}>
                {historicalSteps != null ? historicalSteps.toLocaleString() : '--'}
              </Text>
              <Text style={styles.metricLabel}>Steps avg</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: { fontSize: 13 },
  connectButton: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disconnectButton: {
    backgroundColor: theme.tertiaryBackground,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButtonText: { color: theme.secondaryText },
  errorText: {
    color: theme.destructive,
    fontSize: 13,
    marginTop: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.separator,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.separator,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.secondaryText,
  },
});

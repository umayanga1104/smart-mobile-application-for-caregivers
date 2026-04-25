import { Brain } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

const theme = Colors.dark;

const getStressColor = (score) => {
  if (score <= 25) return '#30D158';
  if (score <= 50) return '#FFD60A';
  if (score <= 75) return '#FF9F0A';
  return '#FF453A';
};

const getStressLabel = (score) => {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Moderate';
  if (score <= 75) return 'High';
  return 'Very High';
};

const ScoreDisplay = ({ result, label }) => (
  <View style={styles.resultContainer}>
    <View style={[styles.scoreCircle, { borderColor: getStressColor(result.stress_score) }]}>
      <Text style={[styles.scoreText, { color: getStressColor(result.stress_score) }]}>
        {Math.round(result.stress_score)}
      </Text>
      <Text style={styles.scoreUnit}>/100</Text>
    </View>
    <View style={styles.detailsContainer}>
      <Text style={[styles.levelText, { color: getStressColor(result.stress_score) }]}>
        {getStressLabel(result.stress_score)} Stress
      </Text>
      <Text style={styles.confidenceText}>
        Confidence: {(result.confidence * 100).toFixed(0)}%
      </Text>
      {label ? (
        <Text style={[styles.noteText, { color: theme.tertiaryText }]}>{label}</Text>
      ) : result.note ? (
        <Text style={styles.noteText} numberOfLines={2}>{result.note}</Text>
      ) : null}
    </View>
  </View>
);

export default function StressPredictionCard({ connected, onCheckStress, predicting, result, lastResult, error }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
          <Brain size={22} color={theme.accent} />
        </View>
        <Text style={styles.title}>Stress Level</Text>
      </View>

      {result ? (
        <ScoreDisplay result={result} />
      ) : lastResult ? (
        <ScoreDisplay result={lastResult} label="Last reading" />
      ) : !connected ? (
        <Text style={styles.subtext}>Connect your smartwatch to check stress level</Text>
      ) : (
        <Text style={styles.subtext}>Tap below to analyze your current stress level</Text>
      )}

      {error ? <Text style={[styles.subtext, { color: theme.destructive }]}>{error}</Text> : null}

      {connected && (
        <Pressable
          style={({ pressed }) => [
            styles.checkButton,
            pressed && { opacity: 0.7 },
            predicting && { opacity: 0.5 },
          ]}
          onPress={onCheckStress}
          disabled={predicting}
        >
          {predicting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Brain size={18} color="#FFFFFF" />
          )}
          <Text style={styles.checkButtonText}>
            {predicting ? 'Analyzing…' : result ? 'Check Again' : 'Check Stress Level'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.secondaryBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  subtext: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
  },
  scoreUnit: {
    fontSize: 12,
    color: theme.tertiaryText,
    marginTop: -2,
  },
  detailsContainer: { flex: 1 },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 13,
    color: theme.secondaryText,
  },
  noteText: {
    fontSize: 12,
    color: theme.tertiaryText,
    marginTop: 4,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

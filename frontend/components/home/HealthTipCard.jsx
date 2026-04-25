import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

const theme = Colors.dark;

export default function HealthTipCard({ tip }) {
  const IconComponent = tip.icon;
  const categoryLabel = tip.category
    ? tip.category.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: tip.iconColor + '20' }]}>
        <IconComponent size={22} color={tip.iconColor} />
      </View>
      <View style={styles.content}>
        {categoryLabel ? (
          <Text style={[styles.category, { color: tip.iconColor }]}>{categoryLabel}</Text>
        ) : null}
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={styles.body}>{tip.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.secondaryBackground,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: { flex: 1 },
  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },
});

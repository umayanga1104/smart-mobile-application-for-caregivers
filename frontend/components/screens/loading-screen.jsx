import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/theme';

const theme = Colors.dark;

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
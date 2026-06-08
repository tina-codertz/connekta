import { StyleSheet, View } from 'react-native';
import { Colors } from '@/lib/theme';

/** Tab bar + home-indicator safe area share this color. */
export const TAB_BAR_BACKGROUND = Colors.neutral[950];

export function TabBarBackground() {
  return <View style={styles.background} />;
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TAB_BAR_BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[800],
  },
});

import { StyleSheet } from 'react-native';
import { Colors } from '@/lib/theme';

export const listCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  avatar: {
    marginRight: 16,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  subtitle: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  badge: {
    backgroundColor: Colors.neutral[800],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

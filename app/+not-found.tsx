import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MapPin size={48} color={Colors.primary[400]} />
        </View>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.text}>
          Sorry, we couldn't find the page you're looking for.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go Back Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[950],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral[900],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.neutral[0],
    marginBottom: Spacing.sm,
  },
  text: {
    ...Typography.body,
    color: Colors.neutral[400],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  link: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  linkText: {
    ...Typography.button,
    color: Colors.neutral[0],
  },
});

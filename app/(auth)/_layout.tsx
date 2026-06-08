import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}

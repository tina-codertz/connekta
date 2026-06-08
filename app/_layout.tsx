import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { Host } from '@/components/ExpoUI';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initNativeMapbox } from '@/lib/mapbox-native';
import { setupAuthSessionRefresh } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { loading, user, profile } = useAuth();
  const locationSharingEnabled = profile?.is_location_enabled ?? true;

  usePushNotifications(user?.id, locationSharingEnabled);

  useEffect(() => {
    if (Platform.OS === 'web' || Constants.appOwnership === 'expo' || !user) {
      return;
    }

    import('@/lib/background-location-task').catch((error) => {
      console.warn('Background location task unavailable:', error);
    });
  }, [user?.id]);

  if (loading) {
    return (
      <Host style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="invite" />
        <Stack.Screen
          name="sos"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </Host>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setupAuthSessionRefresh();
    if (Platform.OS === 'ios') {
      initNativeMapbox().catch((error) => {
        console.warn('Mapbox native init failed:', error);
      });
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <RootLayoutNav />
            <StatusBar style="light" />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});

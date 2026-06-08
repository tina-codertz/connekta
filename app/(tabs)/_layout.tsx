import { Redirect, Tabs } from 'expo-router';
import { MapPin, Users, User, Settings } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: bottomInset,
          backgroundColor: Colors.neutral[900],
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Colors.neutral[700],
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarActiveTintColor: Colors.primary[400],
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <MapPin size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Users size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <User size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Settings size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
    borderRadius: 14,
  },
  iconContainerActive: {
    backgroundColor: Colors.primary[900],
  },
});

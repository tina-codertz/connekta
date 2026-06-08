import { Redirect, Tabs } from 'expo-router';
import { MapPin, Users, User, Settings } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const { user, loading } = useAuth();

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
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[500],
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <MapPin size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Users size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <User size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Settings size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral[900],
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

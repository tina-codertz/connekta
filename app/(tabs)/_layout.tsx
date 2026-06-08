import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { MapPin, Users, User, Settings } from 'lucide-react-native';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { Colors } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { TAB_BAR_CONTENT_HEIGHT } from '@/hooks/useTabBarInsets';
import {
  TabBarBackground,
  TAB_BAR_BACKGROUND,
} from '@/components/ui/TabBarBackground';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(TAB_BAR_BACKGROUND);
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: styles.scene,
          tabBarBackground: () => <TabBarBackground />,
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: bottomInset,
            backgroundColor: TAB_BAR_BACKGROUND,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Colors.neutral[800],
            elevation: 0,
            shadowOpacity: 0,
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
            tabBarIcon: (props) => <TabBarIcon {...props} Icon={MapPin} />,
          }}
        />
        <Tabs.Screen
          name="circles"
          options={{
            title: 'Circles',
            tabBarIcon: (props) => <TabBarIcon {...props} Icon={Users} />,
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            tabBarIcon: (props) => <TabBarIcon {...props} Icon={User} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: (props) => <TabBarIcon {...props} Icon={Settings} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TAB_BAR_BACKGROUND,
  },
  scene: {
    backgroundColor: Colors.neutral[950],
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 2,
  },
  iconPressable: {
    alignItems: 'center',
    justifyContent: 'center',
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

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
  Icon: LucideIcon;
};

function TabBarIcon({ focused, color, size, Icon }: TabBarIconProps) {
  return (
    <Pressable style={styles.iconPressable}>
      {({ pressed, hovered }) => {
        const highlighted =
          focused || pressed || (Platform.OS === 'web' && hovered);

        return (
          <View style={[styles.iconContainer, highlighted && styles.iconContainerActive]}>
            <Icon
              size={size}
              color={highlighted ? Colors.primary[400] : color}
              strokeWidth={highlighted ? 2.5 : 2}
            />
          </View>
        );
      }}
    </Pressable>
  );
}

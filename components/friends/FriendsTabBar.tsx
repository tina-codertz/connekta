import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Mail } from 'lucide-react-native';
import { Row, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface FriendsTabBarProps {
  activeTab: 'friends' | 'requests';
  friendsCount: number;
  requestsCount: number;
  onTabChange: (tab: 'friends' | 'requests') => void;
}

export function FriendsTabBar({
  activeTab,
  friendsCount,
  requestsCount,
  onTabChange,
}: FriendsTabBarProps) {
  return (
    <Row spacing={8} style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => onTabChange('friends')}
      >
        <Users
          size={18}
          color={activeTab === 'friends' ? Colors.primary[400] : Colors.neutral[500]}
        />
        <Text textStyle={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
          Friends ({friendsCount})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
        onPress={() => onTabChange('requests')}
      >
        <Mail
          size={18}
          color={activeTab === 'requests' ? Colors.primary[400] : Colors.neutral[500]}
        />
        <Text textStyle={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
          Requests ({requestsCount})
        </Text>
      </TouchableOpacity>
    </Row>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.neutral[900],
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 14,
    color: Colors.neutral[500],
    fontWeight: '400',
  },
  activeTabText: {
    color: Colors.primary[400],
    fontWeight: '600',
  },
});

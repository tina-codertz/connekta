import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SegmentedTab {
  id: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SegmentedTabs({ tabs, activeTab, onTabChange }: SegmentedTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && styles.activeTab]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              textStyle={[styles.tabText, active && styles.activeTabText]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  activeTab: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.neutral[800],
  },
  tabText: {
    fontSize: 13,
    color: Colors.neutral[500],
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.primary[400],
    fontWeight: '600',
  },
});

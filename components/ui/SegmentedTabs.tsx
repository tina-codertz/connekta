import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Row, Text } from '@/components/ExpoUI';
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
    <Row spacing={8} style={styles.container}>
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
    </Row>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
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
    fontSize: 14,
    color: Colors.neutral[500],
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary[400],
    fontWeight: '600',
  },
});

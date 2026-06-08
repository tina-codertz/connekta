import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { Circle } from '@/types/database';
import { Colors } from '@/lib/theme';

interface CircleSelectorProps {
  circles: Circle[];
  selectedCircleId?: string;
  onSelect: (circle: Circle) => void;
  onAddPress?: () => void;
}

export function CircleSelector({
  circles,
  selectedCircleId,
  onSelect,
  onAddPress,
}: CircleSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {circles.map((circle) => {
        const isActive = selectedCircleId === circle.id;
        return (
          <TouchableOpacity
            key={circle.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(circle)}
          >
            <View style={[styles.dot, { backgroundColor: circle.color }]} />
            <Text textStyle={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {circle.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      {onAddPress ? (
        <TouchableOpacity
          style={styles.addChip}
          onPress={onAddPress}
          accessibilityLabel="Add or join a circle"
        >
          <Plus size={18} color={Colors.primary[400]} />
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 16,
    maxHeight: 44,
  },
  content: {
    gap: 8,
    alignItems: 'center',
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 180,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    gap: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary[900],
    borderColor: Colors.primary[500],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral[300],
    flexShrink: 1,
  },
  labelActive: {
    color: Colors.neutral[0],
    fontWeight: '600',
  },
  addChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
});

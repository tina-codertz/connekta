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
}

export function CircleSelector({ circles, selectedCircleId, onSelect }: CircleSelectorProps) {
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
            <Text textStyle={[styles.label, isActive && styles.labelActive]}>
              {circle.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.addChip}>
        <Plus size={16} color={Colors.neutral[400]} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  content: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
  label: {
    fontSize: 14,
    color: Colors.neutral[300],
  },
  labelActive: {
    color: Colors.neutral[0],
  },
  addChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    borderStyle: 'dashed',
  },
});

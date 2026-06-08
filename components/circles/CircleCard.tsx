import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';
import { CircleWithDetails } from './types';

interface CircleCardProps {
  circle: CircleWithDetails;
  onPress: () => void;
}

export function CircleCard({ circle, onPress }: CircleCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: circle.color }]}>
        <Users size={24} color={Colors.neutral[0]} />
      </View>
      <View style={styles.info}>
        <Text textStyle={styles.name}>{circle.name}</Text>
        <Text textStyle={styles.meta}>
          {circle.members.length} member{circle.members.length !== 1 ? 's' : ''} ·{' '}
          {circle.places_count} place{circle.places_count !== 1 ? 's' : ''}
        </Text>
      </View>
      <ChevronRight size={20} color={Colors.neutral[500]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  meta: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
});

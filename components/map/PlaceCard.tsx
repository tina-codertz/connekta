import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.icon, { backgroundColor: place.color }]}>
        <MapPin size={16} color={Colors.neutral[0]} />
      </View>
      <Column spacing={2} style={styles.info}>
        <Text textStyle={styles.name}>{place.name}</Text>
        <Text textStyle={styles.address}>{place.address}</Text>
      </Column>
      <Text textStyle={styles.radius}>{place.radius}m</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  address: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  radius: {
    fontSize: 14,
    color: Colors.neutral[400],
  },
});

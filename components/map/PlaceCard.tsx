import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <TouchableOpacity style={listCardStyles.card}>
      <View style={[styles.icon, { backgroundColor: place.color }]}>
        <MapPin size={16} color={Colors.neutral[0]} />
      </View>
      <Column spacing={2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
          {place.address || 'No address'}
        </Text>
      </Column>
      <Text textStyle={styles.radius}>{place.radius}m</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  radius: {
    fontSize: 14,
    color: Colors.neutral[400],
    flexShrink: 0,
  },
});

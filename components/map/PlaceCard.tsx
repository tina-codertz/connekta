import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Bell, BellOff, Eye, EyeOff, MapPin, Trash2 } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { isPlaceVisibleOnMap } from '@/lib/places';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface PlaceCardProps {
  place: Place;
  onToggleVisible?: (place: Place) => void;
  onToggleNotify?: (place: Place) => void;
  onDelete?: (place: Place) => void;
}

export function PlaceCard({
  place,
  onToggleVisible,
  onToggleNotify,
  onDelete,
}: PlaceCardProps) {
  const visibleOnMap = isPlaceVisibleOnMap(place);

  function handleDelete() {
    Alert.alert(
      'Remove place',
      `Remove "${place.name}" from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDelete?.(place),
        },
      ]
    );
  }

  return (
    <View style={[listCardStyles.card, !visibleOnMap && styles.cardHidden]}>
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
        <Row spacing={8}>
          <Text textStyle={styles.meta}>{place.radius}m radius</Text>
          {!visibleOnMap ? <Text textStyle={styles.metaHidden}>Hidden on map</Text> : null}
          {!place.notifications_enabled ? (
            <Text textStyle={styles.metaHidden}>Alerts off</Text>
          ) : null}
        </Row>
      </Column>

      <Row spacing={6}>
        {onToggleVisible ? (
          <IconActionButton variant="default" onPress={() => onToggleVisible(place)}>
            {visibleOnMap ? (
              <Eye size={16} color={Colors.primary[400]} />
            ) : (
              <EyeOff size={16} color={Colors.neutral[500]} />
            )}
          </IconActionButton>
        ) : null}

        {onToggleNotify ? (
          <IconActionButton variant="default" onPress={() => onToggleNotify(place)}>
            {place.notifications_enabled ? (
              <Bell size={16} color={Colors.secondary[500]} />
            ) : (
              <BellOff size={16} color={Colors.neutral[500]} />
            )}
          </IconActionButton>
        ) : null}

        {onDelete ? (
          <IconActionButton variant="default" onPress={handleDelete}>
            <Trash2 size={16} color={Colors.error} />
          </IconActionButton>
        ) : null}
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHidden: {
    opacity: 0.72,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  meta: {
    fontSize: 11,
    color: Colors.neutral[600],
  },
  metaHidden: {
    fontSize: 11,
    color: Colors.neutral[500],
    fontStyle: 'italic',
  },
});

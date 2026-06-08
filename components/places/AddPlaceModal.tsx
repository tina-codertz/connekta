import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { PlacePickerMap } from '@/components/places/PlacePickerMap';
import { createPlace, formatCoordinates, reverseGeocodeLabel } from '@/lib/places';
import { Colors } from '@/lib/theme';

const RADIUS_OPTIONS = [100, 200, 500];

interface AddPlaceModalProps {
  visible: boolean;
  circleId: string | null;
  circleName?: string | null;
  userId: string;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onPlaceCreated: () => void;
}

export function AddPlaceModal({
  visible,
  circleId,
  circleName,
  userId,
  initialLatitude,
  initialLongitude,
  onClose,
  onPlaceCreated,
}: AddPlaceModalProps) {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(100);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude ?? null);
  const [address, setAddress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setRadius(100);
      setAddress(null);
      setLatitude(initialLatitude ?? null);
      setLongitude(initialLongitude ?? null);
      return;
    }

    setLatitude(initialLatitude ?? null);
    setLongitude(initialLongitude ?? null);
  }, [visible, initialLatitude, initialLongitude]);

  useEffect(() => {
    if (!visible || latitude === null || longitude === null) {
      return;
    }

    let cancelled = false;
    reverseGeocodeLabel(latitude, longitude).then((label) => {
      if (!cancelled) {
        setAddress(label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visible, latitude, longitude]);

  function handleClose() {
    onClose();
  }

  async function handleSave() {
    if (!circleId) {
      Alert.alert('No circle', 'Join or select a circle before saving a place.');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('Location required', 'Move the map to choose where this place is.');
      return;
    }

    setSaving(true);
    const { data, error } = await createPlace({
      circleId,
      name,
      latitude,
      longitude,
      radius,
      address,
      createdBy: userId,
    });
    setSaving(false);

    if (error || !data) {
      Alert.alert('Could not save place', error?.message || 'Try again.');
      return;
    }

    Alert.alert(
      'Place saved',
      `${data.name} was added to ${circleName || 'your circle'}. Circle members will be notified when you arrive or leave.`
    );
    onPlaceCreated();
    handleClose();
  }

  return (
    <ModalSheet visible={visible} title="Add Place" onClose={handleClose}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Column spacing={8}>
          <Text textStyle={styles.label}>Place name</Text>
          <TextInput
            style={styles.input}
            placeholder="Home, School, Gym..."
            placeholderTextColor={Colors.neutral[500]}
            value={name}
            onChangeText={setName}
          />
        </Column>

        <Column spacing={8}>
          <Text textStyle={styles.label}>Location on map</Text>
          <PlacePickerMap
            initialLatitude={latitude ?? initialLatitude}
            initialLongitude={longitude ?? initialLongitude}
            onCenterChange={(nextLat, nextLng) => {
              setLatitude(nextLat);
              setLongitude(nextLng);
            }}
          />
          {address ? <Text textStyle={styles.address}>{address}</Text> : null}
          {latitude !== null && longitude !== null ? (
            <Text textStyle={styles.coords}>
              {formatCoordinates(latitude, longitude)}
            </Text>
          ) : null}
        </Column>

        <Column spacing={8}>
          <Text textStyle={styles.label}>Notify radius</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((option) => {
              const active = radius === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.radiusChip, active && styles.radiusChipActive]}
                  onPress={() => setRadius(option)}
                >
                  <Text textStyle={[styles.radiusText, active && styles.radiusTextActive]}>
                    {option}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text textStyle={styles.hint}>
            Your circle will be notified when you enter or leave this area.
          </Text>
        </Column>

        <GradientSubmitButton
          label={saving ? 'Saving...' : 'Save place'}
          onPress={handleSave}
          disabled={saving || !name.trim() || !circleId}
          icon={
            saving ? (
              <ActivityIndicator color={Colors.neutral[0]} size="small" />
            ) : (
              <MapPin size={18} color={Colors.neutral[0]} />
            )
          }
        />
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[300],
  },
  input: {
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.neutral[0],
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  address: {
    fontSize: 13,
    color: Colors.neutral[400],
    lineHeight: 18,
  },
  coords: {
    fontSize: 12,
    color: Colors.neutral[600],
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  radiusChipActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[900],
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral[500],
  },
  radiusTextActive: {
    color: Colors.primary[400],
  },
  hint: {
    fontSize: 13,
    color: Colors.neutral[500],
    lineHeight: 18,
  },
});

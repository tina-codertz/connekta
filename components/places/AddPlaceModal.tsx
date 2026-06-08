import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Switch,
} from 'react-native';
import { MapPin, Search, ChevronLeft, Crosshair } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { PlacePickerMap } from '@/components/places/PlacePickerMap';
import { createPlace, reverseGeocodeLabel } from '@/lib/places';
import { searchPlaces, PlaceSearchResult } from '@/lib/place-search';
import { getDefaultMapCenter, TANZANIA_REGION } from '@/lib/region-config';
import { Colors } from '@/lib/theme';

const RADIUS_OPTIONS = [100, 200, 500];

type AddPlaceStep = 'search' | 'locate' | 'details';

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
  const [step, setStep] = useState<AddPlaceStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PlaceSearchResult | null>(null);
  const [locatingAddress, setLocatingAddress] = useState(false);

  const [name, setName] = useState('');
  const [radius, setRadius] = useState(100);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [visibleOnMap, setVisibleOnMap] = useState(true);
  const [notifyCircle, setNotifyCircle] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultCenter = getDefaultMapCenter(initialLatitude, initialLongitude);

  useEffect(() => {
    if (!visible) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLocation(null);
      setName('');
      setRadius(100);
      setVisibleOnMap(true);
      setNotifyCircle(true);
      setAddress(null);
      setLatitude(null);
      setLongitude(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 'search') {
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchPlaces(trimmed, defaultCenter);
      setSearchResults(results);
      setSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, visible, step, defaultCenter.latitude, defaultCenter.longitude]);

  function handleClose() {
    onClose();
  }

  function goToDetails(result: PlaceSearchResult) {
    setSelectedLocation(result);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    setAddress(result.address);
    setName('');
    setStep('details');
  }

  function handleSelectResult(result: PlaceSearchResult) {
    goToDetails(result);
  }

  function handleLocateOnMap() {
    const center = getDefaultMapCenter(initialLatitude, initialLongitude);
    setLatitude(center.latitude);
    setLongitude(center.longitude);
    setSelectedLocation(null);
    setAddress(null);
    setStep('locate');
  }

  async function handleConfirmMapLocation() {
    if (latitude === null || longitude === null) {
      Alert.alert('Location required', 'Move the map to place the marker.');
      return;
    }

    setLocatingAddress(true);
    const label = await reverseGeocodeLabel(latitude, longitude);
    setLocatingAddress(false);

    goToDetails({
      id: `map-${latitude}-${longitude}`,
      name: label?.split(',')[0]?.trim() || 'Selected location',
      address: label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
    });
  }

  function handleBackFromDetails() {
    setStep('search');
    setSelectedLocation(null);
  }

  function handleBackFromLocate() {
    setStep('search');
  }

  async function handleSave() {
    if (!circleId) {
      Alert.alert('No circle', 'Join or select a circle before saving a place.');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('Location required', 'Search or locate a place on the map first.');
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
      visibleOnMap,
      notificationsEnabled: notifyCircle,
    });
    setSaving(false);

    if (error || !data) {
      Alert.alert('Could not save place', error?.message || 'Try again.');
      return;
    }

    Alert.alert(
      'Place saved',
      `${data.name} was added to ${circleName || 'your circle'}.`
    );
    onPlaceCreated();
    handleClose();
  }

  const modalTitle =
    step === 'search' ? 'Add a place' : step === 'locate' ? 'Locate on map' : 'Name this place';

  return (
    <ModalSheet visible={visible} title={modalTitle} onClose={handleClose}>
      {step === 'search' ? (
        <View style={styles.searchStep}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.neutral[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in Tanzania"
              placeholderTextColor={Colors.neutral[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <View style={styles.locateButtonWrap}>
            <SecondaryButton
              label="Locate on map"
              onPress={handleLocateOnMap}
              icon={<Crosshair size={18} color={Colors.neutral[0]} />}
            />
          </View>

          {searching ? (
            <ActivityIndicator color={Colors.primary[500]} style={styles.loader} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => handleSelectResult(item)}
                >
                  <View style={styles.resultIcon}>
                    <MapPin size={18} color={Colors.primary[400]} />
                  </View>
                  <Column spacing={2} style={styles.resultInfo}>
                    <Text textStyle={styles.resultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text textStyle={styles.resultAddress} numberOfLines={2}>
                      {item.address}
                    </Text>
                  </Column>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.trim().length >= 2 ? (
                  <Text textStyle={styles.emptyText}>No places found for "{searchQuery}"</Text>
                ) : (
                  <Column spacing={8} alignment="center" style={styles.hintPanel}>
                    <Search size={36} color={Colors.neutral[700]} />
                    <Text textStyle={styles.hintTitle}>Search</Text>
                    <Text textStyle={styles.hintText}>
                      Search for a place in {TANZANIA_REGION.name}, or tap Locate on map to drop a
                      pin yourself.
                    </Text>
                  </Column>
                )
              }
            />
          )}
        </View>
      ) : null}

      {step === 'locate' && latitude !== null && longitude !== null ? (
        <View style={styles.locateStep}>
          <Text textStyle={styles.locateHint}>
            Move the map so the red marker sits on your place, then tap Use this location.
          </Text>

          <PlacePickerMap
            latitude={latitude}
            longitude={longitude}
            height={320}
            onCenterChange={(nextLat, nextLng) => {
              setLatitude(nextLat);
              setLongitude(nextLng);
            }}
          />

          <View style={styles.locateActions}>
            <TouchableOpacity style={styles.backLink} onPress={handleBackFromLocate}>
              <ChevronLeft size={18} color={Colors.primary[400]} />
              <Text textStyle={styles.backLinkText}>Back to search</Text>
            </TouchableOpacity>

            <GradientSubmitButton
              label={locatingAddress ? 'Loading address...' : 'Use this location'}
              onPress={handleConfirmMapLocation}
              disabled={locatingAddress}
              icon={
                locatingAddress ? (
                  <ActivityIndicator color={Colors.neutral[0]} size="small" />
                ) : (
                  <MapPin size={18} color={Colors.neutral[0]} />
                )
              }
            />
          </View>
        </View>
      ) : null}

      {step === 'details' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backLink} onPress={handleBackFromDetails}>
            <ChevronLeft size={18} color={Colors.primary[400]} />
            <Text textStyle={styles.backLinkText}>Change location</Text>
          </TouchableOpacity>

          {selectedLocation ? (
            <View style={styles.selectedCard}>
              <Text textStyle={styles.selectedName}>{selectedLocation.name}</Text>
              <Text textStyle={styles.selectedAddress} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
            </View>
          ) : null}

          <Column spacing={8}>
            <Text textStyle={styles.label}>Your label</Text>
            <TextInput
              style={styles.input}
              placeholder="Home, Work, Gym..."
              placeholderTextColor={Colors.neutral[500]}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </Column>

          {latitude !== null && longitude !== null ? (
            <Column spacing={8}>
              <Text textStyle={styles.label}>Location on map</Text>
              <PlacePickerMap latitude={latitude} longitude={longitude} previewOnly />
            </Column>
          ) : null}

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
          </Column>

          <View style={styles.toggleRow}>
            <Column spacing={2} style={styles.toggleInfo}>
              <Text textStyle={styles.toggleTitle}>Show on map</Text>
              <Text textStyle={styles.toggleHint}>Display this place as a pin on your map</Text>
            </Column>
            <Switch
              value={visibleOnMap}
              onValueChange={setVisibleOnMap}
              trackColor={{ false: Colors.neutral[700], true: Colors.primary[700] }}
              thumbColor={visibleOnMap ? Colors.primary[400] : Colors.neutral[400]}
            />
          </View>

          <View style={styles.toggleRow}>
            <Column spacing={2} style={styles.toggleInfo}>
              <Text textStyle={styles.toggleTitle}>Notify circle</Text>
              <Text textStyle={styles.toggleHint}>
                Alert circle members when you arrive or leave
              </Text>
            </Column>
            <Switch
              value={notifyCircle}
              onValueChange={setNotifyCircle}
              trackColor={{ false: Colors.neutral[700], true: Colors.primary[700] }}
              thumbColor={notifyCircle ? Colors.primary[400] : Colors.neutral[400]}
            />
          </View>

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
      ) : null}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  searchStep: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.neutral[800],
    borderWidth: 1,
    borderColor: Colors.neutral[700],
  },
  searchInput: {
    flex: 1,
    color: Colors.neutral[0],
    fontSize: 16,
    paddingVertical: 14,
    fontFamily: 'Inter-Regular',
  },
  locateButtonWrap: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
  resultsContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[800],
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  resultAddress: {
    fontSize: 13,
    color: Colors.neutral[500],
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingTop: 32,
  },
  hintPanel: {
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  hintText: {
    fontSize: 15,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  locateStep: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  locateHint: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
  },
  locateActions: {
    gap: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  selectedCard: {
    backgroundColor: Colors.neutral[900],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
    gap: 4,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  selectedAddress: {
    fontSize: 13,
    color: Colors.neutral[500],
    lineHeight: 18,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.neutral[900],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  toggleInfo: {
    flex: 1,
    minWidth: 0,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  toggleHint: {
    fontSize: 12,
    color: Colors.neutral[500],
    lineHeight: 16,
  },
});

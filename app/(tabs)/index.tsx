import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useCircleLocationRealtime } from '@/hooks/useCircleLocationRealtime';
import { usePlaceGeofencing } from '@/hooks/usePlaceGeofencing';
import { AddPlaceModal } from '@/components/places/AddPlaceModal';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';
import { Colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Alert as SosAlert, Circle, Place } from '@/types/database';
import { MapHeader } from '@/components/map/MapHeader';
import { CircleSelector } from '@/components/map/CircleSelector';
import { MapPanel } from '@/components/map/MapPanel';
import { MapSearchModal } from '@/components/map/MapSearchModal';
import { MapNotificationsModal } from '@/components/map/MapNotificationsModal';
import { MembersAndPlacesList } from '@/components/map/MembersAndPlacesList';
import { SosAlertBanner } from '@/components/sos/SosAlertBanner';
import { FriendMarker } from '@/components/map/types';
import { getUnreadAlertCount } from '@/lib/alerts';
import {
  deletePlace,
  getMapVisiblePlaces,
  isPlaceVisibleOnMap,
  updatePlaceSettings,
} from '@/lib/places';
import { fetchCircleMemberMarkers } from '@/lib/circle-locations';
import { getDisplayName } from '@/lib/profile';

export default function MapScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const locationSharingEnabled = profile?.is_location_enabled ?? true;
  const { location } = useLocationTracking(user?.id, locationSharingEnabled);

  const [friends, setFriends] = useState<FriendMarker[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  usePlaceGeofencing(
    user?.id,
    profile,
    location,
    locationSharingEnabled,
    places.length
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [activeSosAlert, setActiveSosAlert] = useState<{
    senderName: string;
    message: string;
  } | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadAlertCount(0);
      return;
    }

    const count = await getUnreadAlertCount(user.id);
    setUnreadAlertCount(count);
  }, [user?.id]);

  useEffect(() => {
    loadInitialData();
    refreshUnreadCount();
  }, [user?.id, refreshUnreadCount]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, circles.length]);

  useEffect(() => {
    if (selectedCircle) {
      loadPlaces(selectedCircle.id);
    }
  }, [selectedCircle?.id]);

  const handleMarkersLoaded = useCallback((markers: FriendMarker[]) => {
    setFriends(markers);
  }, []);

  const handleMemberUpdated = useCallback((marker: FriendMarker) => {
    setFriends((prev) => {
      const index = prev.findIndex((friend) => friend.id === marker.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = marker;
        return next;
      }
      return [...prev, marker];
    });
  }, []);

  useCircleLocationRealtime({
    circleId: selectedCircle?.id,
    currentUserId: user?.id,
    enabled: Boolean(selectedCircle && user?.id),
    onMarkersLoaded: handleMarkersLoaded,
    onMemberUpdated: handleMemberUpdated,
  });

  useEffect(() => {
    if (!user?.id || circles.length === 0) return;

    const circleIds = circles.map((circle) => circle.id);

    const channel = supabase
      .channel(`sos-alerts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        async (payload) => {
          const alert = payload.new as SosAlert;
          if (alert.user_id === user.id) return;
          if (!circleIds.includes(alert.circle_id)) return;

          refreshUnreadCount();

          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', alert.user_id)
            .maybeSingle();

          const senderName = getDisplayName(senderProfile);

          if (alert.type === 'sos') {
            setActiveSosAlert({
              senderName,
              message: alert.message || 'Sent an SOS alert',
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, circles, refreshUnreadCount]);

  async function loadInitialData() {
    if (!user?.id) return;

    const { data: circlesData } = await supabase
      .from('circles')
      .select('*, circle_members!inner(user_id)')
      .eq('circle_members.user_id', user.id);

    if (circlesData && circlesData.length > 0) {
      setCircles(circlesData);
      setSelectedCircle(circlesData[0]);
    } else {
      setCircles([]);
      setSelectedCircle(null);
      setFriends([]);
      setPlaces([]);
    }
  }

  async function loadFriendsLocations(circleId: string) {
    if (!user?.id) return;

    const markers = await fetchCircleMemberMarkers(circleId, user.id);
    setFriends(markers);
  }

  async function loadPlaces(circleId: string) {
    const { data } = await supabase.from('places').select('*').eq('circle_id', circleId);
    setPlaces(data || []);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedCircle) {
      await loadFriendsLocations(selectedCircle.id);
    }
    setRefreshing(false);
  }, [selectedCircle, user?.id]);

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle);
    setSelectedFriendId(null);
  };

  const handleSelectFriend = (friend: FriendMarker) => {
    setSelectedFriendId((prev) => (prev === friend.id ? null : friend.id));
  };

  const mapPlaces = useMemo(() => getMapVisiblePlaces(places), [places]);

  async function handleTogglePlaceVisible(place: Place) {
    const { data, error } = await updatePlaceSettings(place.id, {
      visible_on_map: !isPlaceVisibleOnMap(place),
    });

    if (error || !data) {
      Alert.alert('Error', error?.message || 'Could not update place.');
      return;
    }

    if (selectedCircle) {
      await loadPlaces(selectedCircle.id);
    }
  }

  async function handleTogglePlaceNotify(place: Place) {
    const { data, error } = await updatePlaceSettings(place.id, {
      notifications_enabled: !place.notifications_enabled,
    });

    if (error || !data) {
      Alert.alert('Error', error?.message || 'Could not update place.');
      return;
    }

    if (selectedCircle) {
      await loadPlaces(selectedCircle.id);
    }
  }

  async function handleDeletePlace(place: Place) {
    const { error } = await deletePlace(place.id);

    if (error) {
      Alert.alert('Error', error?.message || 'Could not remove place.');
      return;
    }

    if (selectedCircle) {
      await loadPlaces(selectedCircle.id);
    }
  }

  const handleAddPlace = () => {
    if (!selectedCircle) {
      Alert.alert('No circle', 'Create or join a circle before adding a place.');
      return;
    }

    setShowAddPlaceModal(true);
  };

  const handleAddCircle = () => {
    Alert.alert('Circles', 'Create a new circle or join one with an invite code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Join Circle',
        onPress: () => router.push('/circles?action=join'),
      },
      {
        text: 'Create Circle',
        onPress: () => router.push('/circles?action=create'),
      },
    ]);
  };

  return (
    <SafeAreaScreen edges={['top']} style={styles.container}>
      <MapHeader
        profile={profile}
        user={user}
        compactTop
        unreadCount={unreadAlertCount}
        onSearchPress={() => setShowSearchModal(true)}
        onNotificationsPress={() => setShowNotificationsModal(true)}
      />

      <CircleSelector
        circles={circles}
        selectedCircleId={selectedCircle?.id}
        onSelect={handleSelectCircle}
        onAddPress={handleAddCircle}
      />

      {circles.length === 0 ? (
        <RNText style={styles.noCirclesHint}>
          No circles yet. Tap + to create or join one.
        </RNText>
      ) : null}

      {activeSosAlert ? (
        <SosAlertBanner
          senderName={activeSosAlert.senderName}
          message={activeSosAlert.message}
          onDismiss={() => setActiveSosAlert(null)}
        />
      ) : null}

      <MapPanel
        location={location}
        friends={friends}
        places={mapPlaces}
        selectedFriendId={selectedFriendId}
      />

      <MembersAndPlacesList
        friends={friends}
        places={places}
        selectedFriendId={selectedFriendId}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSelectFriend={handleSelectFriend}
        onAddPlace={handleAddPlace}
        onTogglePlaceVisible={handleTogglePlaceVisible}
        onTogglePlaceNotify={handleTogglePlaceNotify}
        onDeletePlace={handleDeletePlace}
      />

      <MapSearchModal
        visible={showSearchModal}
        circleName={selectedCircle?.name}
        friends={friends}
        places={places}
        selectedFriendId={selectedFriendId}
        onClose={() => setShowSearchModal(false)}
        onSelectFriend={handleSelectFriend}
      />

      <MapNotificationsModal
        visible={showNotificationsModal}
        userId={user?.id || ''}
        onClose={() => setShowNotificationsModal(false)}
        onAlertsChanged={refreshUnreadCount}
      />

      <AddPlaceModal
        visible={showAddPlaceModal}
        circleId={selectedCircle?.id ?? null}
        circleName={selectedCircle?.name}
        userId={user?.id || ''}
        initialLatitude={location?.coords.latitude ?? null}
        initialLongitude={location?.coords.longitude ?? null}
        onClose={() => setShowAddPlaceModal(false)}
        onPlaceCreated={() => {
          if (selectedCircle) {
            loadPlaces(selectedCircle.id);
          }
        }}
      />
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noCirclesHint: {
    marginHorizontal: 24,
    marginBottom: 12,
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});

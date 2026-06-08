import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { Colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Circle, Place } from '@/types/database';
import { MapHeader } from '@/components/map/MapHeader';
import { CircleSelector } from '@/components/map/CircleSelector';
import { MapPanel } from '@/components/map/MapPanel';
import { MembersAndPlacesList } from '@/components/map/MembersAndPlacesList';
import { FriendMarker } from '@/components/map/types';
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedCircle) {
      loadPlaces(selectedCircle.id);
      loadFriendsLocations(selectedCircle.id);
    }
  }, [selectedCircle?.id, user?.id]);

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

    const { data: members } = await supabase
      .from('circle_members')
      .select('*, profiles!inner(*)')
      .eq('circle_id', circleId);

    if (!members) return;

    const friendMarkers: FriendMarker[] = [];

    for (const member of members) {
      if (member.user_id === user.id) continue;

      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', member.user_id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const memberProfile = member.profiles;
      const latestLocation = locations?.[0];

      if (latestLocation && memberProfile) {
        friendMarkers.push({
          id: member.user_id,
          name: getDisplayName(memberProfile),
          latitude: Number(latestLocation.latitude),
          longitude: Number(latestLocation.longitude),
          battery: latestLocation.battery_level,
          isCharging: latestLocation.is_charging,
          lastSeen: latestLocation.recorded_at,
          avatar: memberProfile.avatar_url,
        });
      }
    }

    setFriends(friendMarkers);
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
    <View style={styles.container}>
      <MapHeader profile={profile} user={user} />

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

      <MapPanel
        location={location}
        friends={friends}
        places={places}
        selectedFriendId={selectedFriendId}
      />

      <MembersAndPlacesList
        friends={friends}
        places={places}
        selectedFriendId={selectedFriendId}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSelectFriend={handleSelectFriend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  noCirclesHint: {
    marginHorizontal: 24,
    marginBottom: 12,
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});

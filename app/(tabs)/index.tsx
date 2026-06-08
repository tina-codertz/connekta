import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { Location, type LocationObject } from '@/lib/location';
import { Circle, Place } from '@/types/database';
import { MapHeader } from '@/components/map/MapHeader';
import { CircleSelector } from '@/components/map/CircleSelector';
import { MapPlaceholder } from '@/components/map/MapPlaceholder';
import { MembersAndPlacesList } from '@/components/map/MembersAndPlacesList';
import { FriendMarker } from '@/components/map/types';

export default function MapScreen() {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [friends, setFriends] = useState<FriendMarker[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (selectedCircle) {
      loadPlaces(selectedCircle.id);
    }
  }, [selectedCircle]);

  async function requestLocationPermission() {
    if (Platform.OS === 'web') {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                heading: position.coords.heading,
                altitudeAccuracy: null,
              },
              timestamp: position.timestamp,
            } as LocationObject);
          },
          (error) => {
            console.log('Web geolocation error:', error);
          }
        );
      }
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const currentLocation = await Location.getCurrentPositionAsync();
      setLocation(currentLocation);

      Location.watchPositionAsync({
        timeInterval: 10000,
        distanceInterval: 50,
      }).catch((error) => {
        console.warn('Error watching position:', error);
      });
    } catch (error) {
      console.log('Location permission error:', error);
    }
  }

  async function loadInitialData() {
    setLoading(true);
    const { data: circlesData } = await supabase
      .from('circles')
      .select('*, circle_members!inner(user_id)')
      .eq('circle_members.user_id', user?.id);

    if (circlesData && circlesData.length > 0) {
      setCircles(circlesData);
      setSelectedCircle(circlesData[0]);
      await loadFriendsLocations(circlesData[0].id);
      await loadPlaces(circlesData[0].id);
    }
    setLoading(false);
  }

  async function loadFriendsLocations(circleId: string) {
    const { data: members } = await supabase
      .from('circle_members')
      .select('*, profiles!inner(*)')
      .eq('circle_id', circleId);

    if (!members) return;

    const friendMarkers: FriendMarker[] = [];

    for (const member of members) {
      if (member.user_id === user?.id) continue;

      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', member.user_id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const memberProfile = member.profiles;
      const latestLocation = locations?.[0];

      if (latestLocation) {
        friendMarkers.push({
          id: member.user_id,
          name: memberProfile.full_name || 'Unknown',
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
  }, [selectedCircle]);

  const handleSelectCircle = (circle: Circle) => {
    setSelectedCircle(circle);
  };

  const handleSelectFriend = (friend: FriendMarker) => {
    setSelectedFriendId((prev) => (prev === friend.id ? null : friend.id));
  };

  return (
    <View style={styles.container}>
      <MapHeader userName={profile?.full_name} />

      <CircleSelector
        circles={circles}
        selectedCircleId={selectedCircle?.id}
        onSelect={handleSelectCircle}
      />

      <MapPlaceholder location={location} />

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
});

import React from 'react';
import { ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MapPin, Plus } from 'lucide-react-native';
import { Row, Text } from '@/components/ExpoUI';
import { FriendLocationCard } from './FriendLocationCard';
import { PlaceCard } from './PlaceCard';
import { useTabBarInsets } from '@/hooks/useTabBarInsets';
import { CircleMemberLocation } from './types';
import { Place } from '@/types/database';
import { Colors } from '@/lib/theme';

interface MembersAndPlacesListProps {
  members: CircleMemberLocation[];
  selfMember: CircleMemberLocation | null;
  places: Place[];
  selectedFriendId: string | null;
  locationSharingEnabled: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onSelectMember: (member: CircleMemberLocation) => void;
  onAddPlace?: () => void;
  onTogglePlaceVisible?: (place: Place) => void;
  onTogglePlaceNotify?: (place: Place) => void;
  onDeletePlace?: (place: Place) => void;
}

export function MembersAndPlacesList({
  members,
  selfMember,
  places,
  selectedFriendId,
  locationSharingEnabled,
  refreshing,
  onRefresh,
  onSelectMember,
  onAddPlace,
  onTogglePlaceVisible,
  onTogglePlaceNotify,
  onDeletePlace,
}: MembersAndPlacesListProps) {
  const { contentPaddingBottom } = useTabBarInsets();
  const memberCount = members.length + (selfMember ? 1 : 0);

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary[500]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {!locationSharingEnabled ? (
        <Text textStyle={styles.sharingHint}>
          Location sharing is off. Turn it on in Settings so your circle can see you.
        </Text>
      ) : null}

      <Row spacing={8} alignment="center" style={styles.header}>
        <Text textStyle={styles.sectionTitle}>Circle Members</Text>
        <Text textStyle={styles.count}>{memberCount} people</Text>
      </Row>

      {selfMember ? (
        <FriendLocationCard member={selfMember} selected={false} isSelf />
      ) : null}

      {members.map((member) => (
        <FriendLocationCard
          key={member.id}
          member={member}
          selected={selectedFriendId === member.id}
          onPress={
            member.canViewLocation ? () => onSelectMember(member) : undefined
          }
        />
      ))}

      {members.length === 0 ? (
        <Text textStyle={styles.emptyMembers}>
          Invite friends to your circle to share locations with each other.
        </Text>
      ) : null}

      <Row spacing={8} alignment="center" style={styles.placesHeader}>
        <Text textStyle={styles.placesTitle}>Places</Text>
        {onAddPlace ? (
          <TouchableOpacity style={styles.addPlaceButton} onPress={onAddPlace}>
            <Plus size={16} color={Colors.primary[400]} />
            <Text textStyle={styles.addPlaceText}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </Row>

      {places.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyPlacesCard}
          onPress={onAddPlace}
          disabled={!onAddPlace}
        >
          <MapPin size={24} color={Colors.neutral[600]} />
          <Text textStyle={styles.emptyPlacesTitle}>No saved places yet</Text>
          <Text textStyle={styles.emptyPlacesText}>
            Add places like home or work. Your circle gets notified when you arrive or leave.
          </Text>
        </TouchableOpacity>
      ) : (
        places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onToggleVisible={onTogglePlaceVisible}
            onToggleNotify={onTogglePlaceNotify}
            onDelete={onDeletePlace}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: 24,
  },
  sharingHint: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.primary[300],
    backgroundColor: Colors.primary[900],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  header: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  count: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  emptyMembers: {
    fontSize: 14,
    color: Colors.neutral[500],
    marginBottom: 8,
    lineHeight: 20,
  },
  placesHeader: {
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 16,
  },
  placesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  addPlaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  addPlaceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  emptyPlacesCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  emptyPlacesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  emptyPlacesText: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

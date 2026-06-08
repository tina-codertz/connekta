import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { FriendRequestWithProfile } from './types';
import { Colors } from '@/lib/theme';

interface FriendRequestCardProps {
  request: FriendRequestWithProfile;
  variant: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function FriendRequestCard({
  request,
  variant,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestCardProps) {
  const profile =
    variant === 'sent' ? (request.receiver ?? request.sender) : request.sender;

  return (
    <View style={styles.card}>
      <Avatar name={profile.full_name} imageUrl={profile.avatar_url} style={styles.avatar} />
      <Column spacing={variant === 'sent' ? 4 : 2} style={styles.info}>
        <Text textStyle={styles.name}>{profile.full_name || 'Unknown'}</Text>
        {variant === 'received' ? (
          <Text textStyle={styles.email}>{profile.email}</Text>
        ) : (
          <Row spacing={4} alignment="center">
            <Clock size={12} color={Colors.warning} />
            <Text textStyle={styles.pending}>Pending</Text>
          </Row>
        )}
      </Column>
      {variant === 'received' ? (
        <Row spacing={8}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept?.(request.id)}>
            <Check size={18} color={Colors.neutral[0]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={() => onReject?.(request.id)}>
            <X size={18} color={Colors.neutral[0]} />
          </TouchableOpacity>
        </Row>
      ) : (
        <TouchableOpacity style={styles.cancelButton} onPress={() => onCancel?.(request.id)}>
          <X size={18} color={Colors.neutral[500]} />
        </TouchableOpacity>
      )}
    </View>
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
  avatar: { marginRight: 16 },
  info: { flex: 1 },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  email: {
    fontSize: 12,
    color: Colors.neutral[500],
  },
  pending: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

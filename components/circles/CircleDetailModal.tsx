import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Trash2 } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { CircleMemberRow } from './CircleMemberRow';
import { CircleWithDetails } from './types';
import { Colors } from '@/lib/theme';

interface CircleDetailModalProps {
  visible: boolean;
  circle: CircleWithDetails | null;
  onClose: () => void;
  onInvite: () => void;
  onDelete: (circleId: string) => void;
}

export function CircleDetailModal({
  visible,
  circle,
  onClose,
  onInvite,
  onDelete,
}: CircleDetailModalProps) {
  if (!circle) return null;

  return (
    <ModalSheet visible={visible} title={circle.name} onClose={onClose}>
      <Column spacing={24} style={styles.content}>
        <Row spacing={8} alignment="center" style={styles.membersHeader}>
          <Text textStyle={styles.sectionTitle}>Members</Text>
          <TouchableOpacity style={styles.inviteButton} onPress={onInvite}>
            <UserPlus size={18} color={Colors.primary[400]} />
            <Text textStyle={styles.inviteText}>Add Members</Text>
          </TouchableOpacity>
        </Row>

        {circle.members.map((member) => (
          <CircleMemberRow
            key={member.id}
            profile={member.profile}
            role={member.role}
          />
        ))}

        {circle.description ? (
          <Column spacing={8}>
            <Text textStyle={styles.sectionTitle}>About</Text>
            <Text textStyle={styles.description}>{circle.description}</Text>
          </Column>
        ) : null}

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() => onDelete(circle.id)}
        >
          <Trash2 size={18} color={Colors.error} />
          <Text textStyle={styles.dangerText}>Delete Circle</Text>
        </TouchableOpacity>
      </Column>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    flex: 1,
  },
  membersHeader: {
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inviteText: {
    fontSize: 14,
    color: Colors.primary[400],
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: Colors.neutral[300],
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
});

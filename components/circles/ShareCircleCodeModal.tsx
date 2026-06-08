import React from 'react';
import { StyleSheet } from 'react-native';
import { Column } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { CircleInviteCodeCard } from './CircleInviteCodeCard';

interface ShareCircleCodeModalProps {
  visible: boolean;
  circleName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareCircleCodeModal({
  visible,
  circleName,
  inviteCode,
  onClose,
}: ShareCircleCodeModalProps) {
  return (
    <ModalSheet visible={visible} title="Invite People" onClose={onClose}>
      <Column spacing={16} style={styles.content}>
        <CircleInviteCodeCard code={inviteCode} circleName={circleName} />
      </Column>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    flex: 1,
  },
});

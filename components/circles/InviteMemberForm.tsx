import React from 'react';
import { StyleSheet } from 'react-native';
import { Mail } from 'lucide-react-native';
import { Column } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { EmailFormField } from '@/components/ui/FormField';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';

interface InviteMemberFormProps {
  visible: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function InviteMemberForm({
  visible,
  email,
  onEmailChange,
  onClose,
  onSubmit,
}: InviteMemberFormProps) {
  return (
    <ModalSheet visible={visible} title="Invite Member" onClose={onClose}>
      <Column spacing={16} style={styles.content}>
        <EmailFormField
          label="Email Address"
          value={email}
          onChangeText={onEmailChange}
        />
        <GradientSubmitButton
          label="Send Invitation"
          onPress={onSubmit}
          icon={<Mail size={20} color="#FFFFFF" />}
        />
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

import React from 'react';
import { StyleSheet } from 'react-native';
import { Hash } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FormField } from '@/components/ui/FormField';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { Colors } from '@/lib/theme';

interface JoinCircleFormProps {
  visible: boolean;
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function JoinCircleForm({
  visible,
  code,
  onCodeChange,
  onClose,
  onSubmit,
  loading,
}: JoinCircleFormProps) {
  return (
    <ModalSheet visible={visible} title="Join Circle" onClose={onClose}>
      <Column spacing={16} style={styles.content}>
        <Text textStyle={styles.hint}>
          Enter the 6-character invite code shared by a circle member.
        </Text>
        <FormField
          label="Invite Code"
          placeholder="e.g. A3F9K2"
          value={code}
          onChangeText={(value) => onCodeChange(value.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
        />
        <GradientSubmitButton
          label={loading ? 'Joining...' : 'Join Circle'}
          onPress={onSubmit}
          icon={<Hash size={20} color="#FFFFFF" />}
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
  hint: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
  },
});

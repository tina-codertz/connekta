import React from 'react';
import { StyleSheet } from 'react-native';
import { Column } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FormField } from '@/components/ui/FormField';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';

interface CreateCircleFormProps {
  visible: boolean;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateCircleForm({
  visible,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: CreateCircleFormProps) {
  return (
    <ModalSheet visible={visible} title="Create New Circle" onClose={onClose}>
      <Column spacing={16} style={styles.content}>
        <FormField
          label="Circle Name"
          placeholder="e.g., Family, Friends, Roommates"
          value={name}
          onChangeText={onNameChange}
        />
        <FormField
          label="Description (optional)"
          placeholder="What is this circle for?"
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={3}
        />
        <GradientSubmitButton label="Create Circle" onPress={onSubmit} />
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

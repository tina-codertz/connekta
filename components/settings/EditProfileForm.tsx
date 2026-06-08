import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Column, Text } from '@/components/ExpoUI';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FormField } from '@/components/ui/FormField';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { Avatar } from '@/components/ui/Avatar';
import { Profile } from '@/types/database';
import { Colors } from '@/lib/theme';

interface EditProfileFormProps {
  visible: boolean;
  profile: Profile | null;
  name: string;
  phone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditProfileForm({
  visible,
  profile,
  name,
  phone,
  onNameChange,
  onPhoneChange,
  onClose,
  onSave,
}: EditProfileFormProps) {
  return (
    <ModalSheet visible={visible} title="Edit Profile" onClose={onClose}>
      <Column spacing={24} style={styles.content}>
        <Column spacing={16} alignment="center">
          <Avatar name={profile?.full_name} imageUrl={profile?.avatar_url} size={100} />
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text textStyle={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </Column>

        <FormField
          label="Full Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={onNameChange}
        />

        <FormField
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
        />

        <GradientSubmitButton label="Save Changes" onPress={onSave} />
      </Column>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    flex: 1,
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.neutral[800],
  },
  changePhotoText: {
    fontSize: 14,
    color: Colors.primary[400],
    fontWeight: '600',
  },
});

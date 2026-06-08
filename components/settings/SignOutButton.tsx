import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SignOutButtonProps {
  onPress: () => void;
}

export function SignOutButton({ onPress }: SignOutButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <LogOut size={22} color={Colors.error} />
      <Text textStyle={styles.label}>Sign Out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  label: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
});

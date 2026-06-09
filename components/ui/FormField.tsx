import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { Column, RNHostView, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
  multiline?: boolean;
}

export function FormField({ label, containerStyle, style, ...inputProps }: FormFieldProps) {
  return (
    <Column spacing={8} style={containerStyle}>
      <Text textStyle={styles.label}>{label}</Text>
      <RNHostView matchContents>
        <TextInput
          style={[styles.input, inputProps.multiline && styles.textArea, style]}
          placeholderTextColor={Colors.neutral[500]}
          {...inputProps}
        />
      </RNHostView>
    </Column>
  );
}

interface EmailFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function EmailFormField({
  label,
  value,
  onChangeText,
  placeholder = 'friend@example.com',
}: EmailFormFieldProps) {
  return (
    <Column spacing={8}>
      <Text textStyle={styles.label}>{label}</Text>
      <RNHostView matchContents>
        <View style={styles.emailRow}>
          <Mail size={20} color={Colors.neutral[500]} style={styles.emailIcon} />
          <TextInput
            style={styles.emailInput}
            placeholder={placeholder}
            placeholderTextColor={Colors.neutral[500]}
            value={value}
            onChangeText={onChangeText}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </RNHostView>
    </Column>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: Colors.neutral[400],
  },
  input: {
    backgroundColor: Colors.neutral[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Colors.neutral[0],
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[800],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    paddingHorizontal: 16,
  },
  emailIcon: { marginRight: 8 },
  emailInput: {
    flex: 1,
    color: Colors.neutral[0],
    fontSize: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface SosAlertBannerProps {
  senderName: string;
  message: string;
  onDismiss: () => void;
}

export function SosAlertBanner({ senderName, message, onDismiss }: SosAlertBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <AlertTriangle size={22} color="#FECACA" />
      </View>
      <Column spacing={4} style={styles.content}>
        <Text textStyle={styles.title}>SOS from {senderName}</Text>
        <Text textStyle={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </Column>
      <TouchableOpacity style={styles.dismiss} onPress={onDismiss}>
        <X size={18} color={Colors.neutral[300]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  iconWrap: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FECACA',
  },
  message: {
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  dismiss: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

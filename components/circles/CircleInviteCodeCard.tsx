import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Share2 } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface CircleInviteCodeCardProps {
  code: string;
  circleName?: string;
}

export function CircleInviteCodeCard({ code, circleName }: CircleInviteCodeCardProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Invite code copied to clipboard');
  };

  const handleShare = async () => {
    const message = circleName
      ? `Join my "${circleName}" circle on LocateMate! Use invite code: ${code}`
      : `Join my circle on LocateMate! Use invite code: ${code}`;

    await Share.share({ message });
  };

  return (
    <Column spacing={8}>
      <Text textStyle={styles.label}>Invite code</Text>
      <Text textStyle={styles.hint}>Share this code so anyone can join your circle</Text>
      <View style={styles.codeBox}>
        <Text textStyle={styles.code}>{code}</Text>
      </View>
      <Row spacing={8}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
          <Copy size={18} color={Colors.primary[400]} />
          <Text textStyle={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={18} color={Colors.primary[400]} />
          <Text textStyle={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </Row>
    </Column>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  hint: {
    fontSize: 14,
    color: Colors.neutral[500],
  },
  codeBox: {
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    paddingVertical: 20,
    alignItems: 'center',
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 6,
    color: Colors.neutral[0],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.neutral[900],
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  actionText: {
    fontSize: 14,
    color: Colors.primary[400],
    fontWeight: '600',
  },
});

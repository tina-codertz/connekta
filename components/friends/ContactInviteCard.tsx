import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { listCardStyles } from '@/components/ui/listCardStyles';
import {
  pickContactPhone,
  sendFriendInviteViaSms,
  sendFriendInviteViaWhatsApp,
} from '@/lib/app-invite';
import { DeviceContact } from '@/lib/contacts';
import { Colors } from '@/lib/theme';

interface ContactInviteCardProps {
  contact: DeviceContact;
  inviterUserId: string;
  inviterName: string;
}

export function ContactInviteCard({
  contact,
  inviterUserId,
  inviterName,
}: ContactInviteCardProps) {
  const primaryPhone = contact.phones[0];
  const subtitle = primaryPhone || contact.emails[0] || 'No phone number';
  const canInvite = contact.phones.length > 0;

  function inviteViaWhatsApp(phone: string) {
    sendFriendInviteViaWhatsApp({
      phone,
      inviterUserId,
      inviterName,
      recipientName: contact.name,
    });
  }

  function inviteViaSms(phone: string) {
    sendFriendInviteViaSms({
      phone,
      inviterUserId,
      inviterName,
      recipientName: contact.name,
    });
  }

  function handleWhatsAppPress() {
    pickContactPhone(contact.name, contact.phones, inviteViaWhatsApp);
  }

  function handleMessagePress() {
    pickContactPhone(contact.name, contact.phones, inviteViaSms);
  }

  return (
    <View style={listCardStyles.card}>
      <Column spacing={2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </Column>

      {canInvite ? (
        <Row spacing={8}>
          <TouchableOpacity style={styles.channelButton} onPress={handleWhatsAppPress}>
            <Text textStyle={styles.channelLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.channelButton} onPress={handleMessagePress}>
            <MessageCircle size={16} color={Colors.primary[400]} />
            <Text textStyle={styles.channelLabel}>Message</Text>
          </TouchableOpacity>
        </Row>
      ) : (
        <Text textStyle={styles.noPhone}>No number</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary[900],
    borderWidth: 1,
    borderColor: Colors.primary[700],
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[400],
  },
  noPhone: {
    fontSize: 12,
    color: Colors.neutral[600],
    flexShrink: 0,
  },
});

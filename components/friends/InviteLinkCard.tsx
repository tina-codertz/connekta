import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Share2, Link } from 'lucide-react-native';
import { Column, Text } from '@/components/ExpoUI';
import { buildFriendInviteLink, shareFriendInviteLink } from '@/lib/app-invite';
import { Colors } from '@/lib/theme';

interface InviteLinkCardProps {
  inviterUserId: string;
  inviterName: string;
}

export function InviteLinkCard({ inviterUserId, inviterName }: InviteLinkCardProps) {
  const inviteLink = buildFriendInviteLink(inviterUserId);

  return (
    <View style={styles.card}>
      <Column spacing={12}>
        <Text textStyle={styles.title}>Invite someone new</Text>
        <Text textStyle={styles.hint}>
          Share a one-time link with friends who do not have LocateMate yet. When they sign up,
          they will send you a friend request.
        </Text>
        <View style={styles.linkBox}>
          <Link size={16} color={Colors.primary[400]} style={styles.linkIcon} />
          <Text textStyle={styles.link} numberOfLines={3}>
            {inviteLink}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            shareFriendInviteLink({
              inviterUserId,
              inviterName,
            })
          }
        >
          <Share2 size={18} color={Colors.neutral[0]} />
          <Text textStyle={styles.shareText}>Share invite link</Text>
        </TouchableOpacity>
      </Column>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[900],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
  hint: {
    fontSize: 14,
    color: Colors.neutral[400],
    lineHeight: 20,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral[950],
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  linkIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  link: {
    flex: 1,
    fontSize: 12,
    color: Colors.neutral[300],
    lineHeight: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[0],
  },
});

import React from 'react';
import { View } from 'react-native';
import { Check, X, Clock } from 'lucide-react-native';
import { Column, Row, Text } from '@/components/ExpoUI';
import { Avatar } from '@/components/ui/Avatar';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { listCardStyles } from '@/components/ui/listCardStyles';
import { getDisplayName } from '@/lib/profile';
import { FriendRequestWithProfile } from './types';
import { Colors } from '@/lib/theme';

interface FriendRequestCardProps {
  request: FriendRequestWithProfile;
  variant: 'received' | 'sent';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function FriendRequestCard({
  request,
  variant,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestCardProps) {
  const profile =
    variant === 'sent' ? (request.receiver ?? request.sender) : request.sender;
  const displayName = getDisplayName(profile);

  return (
    <View style={listCardStyles.card}>
      <Avatar
        name={displayName}
        imageUrl={profile?.avatar_url}
        size={44}
        style={listCardStyles.avatar}
      />
      <Column spacing={variant === 'sent' ? 4 : 2} style={listCardStyles.info}>
        <Text textStyle={listCardStyles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {variant === 'received' ? (
          <Text textStyle={listCardStyles.subtitle} numberOfLines={1}>
            {profile?.email}
          </Text>
        ) : (
          <Row spacing={4} alignment="center">
            <Clock size={12} color={Colors.warning} />
            <Text textStyle={[listCardStyles.badgeText, { color: Colors.warning }]}>Pending</Text>
          </Row>
        )}
      </Column>
      {variant === 'received' ? (
        <Row spacing={8}>
          <IconActionButton variant="success" onPress={() => onAccept?.(request.id)}>
            <Check size={18} color={Colors.neutral[0]} />
          </IconActionButton>
          <IconActionButton variant="muted" onPress={() => onReject?.(request.id)}>
            <X size={18} color={Colors.neutral[0]} />
          </IconActionButton>
        </Row>
      ) : (
        <IconActionButton onPress={() => onCancel?.(request.id)}>
          <X size={18} color={Colors.neutral[500]} />
        </IconActionButton>
      )}
    </View>
  );
}

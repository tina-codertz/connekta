import React from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import { Text } from '@/components/ExpoUI';
import { Colors } from '@/lib/theme';

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, imageUrl, size = 48, style }: AvatarProps) {
  const fontSize = Math.round(size * 0.375);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <Text textStyle={{ fontSize, fontWeight: '600', color: Colors.neutral[0] }}>
          {(name || 'U')[0].toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

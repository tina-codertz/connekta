import React from 'react';
import { View, Text as RNText, TouchableOpacity, ViewProps, TextProps } from 'react-native';

interface ColumnProps extends ViewProps {
  spacing?: number;
  alignment?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

interface RowProps extends ViewProps {
  spacing?: number;
  alignment?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

interface TextProps extends React.ComponentProps<typeof RNText> {
  textStyle?: any;
}

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}

export const Host: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[{ flex: 1 }, style]} {...props} />
);

export const Column: React.FC<ColumnProps> = ({
  spacing = 0,
  alignment = 'flex-start',
  style,
  children,
  ...props
}) => (
  <View
    style={[
      {
        flexDirection: 'column',
        alignItems: alignment,
        gap: spacing,
      },
      style,
    ]}
    {...props}
  >
    {children}
  </View>
);

export const Row: React.FC<RowProps> = ({
  spacing = 0,
  alignment = 'flex-start',
  style,
  children,
  ...props
}) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: alignment,
        gap: spacing,
      },
      style,
    ]}
    {...props}
  >
    {children}
  </View>
);

export const Text: React.FC<TextProps> = ({ textStyle, style, ...props }) => (
  <RNText style={[textStyle, style]} {...props} />
);

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  style,
  ...props
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
      },
      style,
    ]}
    {...props}
  >
    {typeof children === 'string' ? (
      <RNText style={{ color: '#FFFFFF', fontWeight: '600' }}>{children}</RNText>
    ) : (
      children
    )}
  </TouchableOpacity>
);

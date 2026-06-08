import React from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  ScrollView as RNScrollView,
  Switch as RNSwitch,
  TextInput as RNTextInput,
  ViewProps,
} from 'react-native';

type UniversalAlignment = 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | 'stretch';

type UniversalTextStyle = {
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'right' | 'center';
};

type UniversalStyle = ViewProps['style'];

interface ColumnProps extends ViewProps {
  spacing?: number;
  alignment?: UniversalAlignment;
}

interface RowProps extends ViewProps {
  spacing?: number;
  alignment?: UniversalAlignment;
}

interface TextProps extends React.ComponentProps<typeof RNText> {
  textStyle?: UniversalTextStyle | Array<UniversalTextStyle | false | null | undefined>;
}

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  label?: string;
  variant?: 'filled' | 'outlined' | 'text' | 'primary' | 'secondary';
  children?: React.ReactNode;
}

function mapAlignment(alignment: UniversalAlignment = 'start') {
  if (alignment === 'start' || alignment === 'flex-start') return 'flex-start';
  if (alignment === 'end' || alignment === 'flex-end') return 'flex-end';
  if (alignment === 'stretch') return 'stretch';
  return 'center';
}

function mergeTextStyle(
  textStyle?: UniversalTextStyle | Array<UniversalTextStyle | false | null | undefined>
) {
  if (!textStyle) return undefined;
  if (!Array.isArray(textStyle)) return textStyle;
  return Object.assign({}, ...textStyle.filter(Boolean));
}

export const Host: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[{ flex: 1 }, style]} {...props} />
);

export const Column: React.FC<ColumnProps> = ({
  spacing = 0,
  alignment = 'start',
  style,
  children,
  ...props
}) => (
  <View
    style={[
      {
        flexDirection: 'column',
        alignItems: mapAlignment(alignment),
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
  alignment = 'start',
  style,
  children,
  ...props
}) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: mapAlignment(alignment),
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
  <RNText style={[mergeTextStyle(textStyle), style]} {...props} />
);

export const Button: React.FC<ButtonProps> = ({
  children,
  label,
  onPress,
  style,
  variant = 'filled',
  ...props
}) => {
  const isOutlined = variant === 'outlined';
  const isText = variant === 'text' || variant === 'secondary';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: isText || isOutlined ? 'transparent' : '#3B82F6',
          borderWidth: isOutlined ? 1 : 0,
          borderColor: isOutlined ? '#3B82F6' : 'transparent',
        },
        style,
      ]}
      {...props}
    >
      {children ??
        (label ? (
          <RNText
            style={{
              color: isText || isOutlined ? '#3B82F6' : '#FFFFFF',
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {label}
          </RNText>
        ) : null)}
    </TouchableOpacity>
  );
};

export const ScrollView = RNScrollView;
export const Switch = RNSwitch;
export const TextInput = RNTextInput;

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}

export function Slider() {
  return null;
}

export function Checkbox() {
  return null;
}

export function BottomSheet({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function Collapsible({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function FieldGroup({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export function Icon() {
  return null;
}

export function List({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export function ListItem({ children }: { children?: React.ReactNode }) {
  return <View>{children}</View>;
}

export function Picker() {
  return null;
}

export type { UniversalTextStyle, UniversalAlignment, UniversalStyle };

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export {
  BottomSheet,
  Button,
  Checkbox,
  Collapsible,
  FieldGroup,
  Host as NativeHost,
  Icon,
  List,
  ListItem,
  Picker,
  RNHostView,
  ScrollView,
  Slider,
  Spacer,
  Switch,
  TextInput,
} from '@expo/ui';

export type {
  UniversalAlignment,
  UniversalBaseProps,
  UniversalStyle,
} from '@expo/ui';

type Alignment = 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | 'stretch';

const columnStyles = StyleSheet.create({
  base: { flexDirection: 'column', alignSelf: 'stretch' },
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  flexStart: { alignItems: 'flex-start' },
  flexEnd: { alignItems: 'flex-end' },
  stretch: { alignItems: 'stretch' },
});

const rowStyles = StyleSheet.create({
  base: { flexDirection: 'row', alignSelf: 'stretch' },
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  flexStart: { alignItems: 'flex-start' },
  flexEnd: { alignItems: 'flex-end' },
  stretch: { alignItems: 'stretch' },
});

function alignmentStyle(
  map: Record<string, ViewStyle>,
  alignment: Alignment | undefined
): ViewStyle | undefined {
  switch (alignment) {
    case 'center':
      return map.center;
    case 'end':
    case 'flex-end':
      return map.end;
    case 'stretch':
      return map.stretch;
    case 'flex-start':
    case 'start':
    default:
      return map.start;
  }
}

type LayoutComponentProps = ViewProps & {
  spacing?: number;
  alignment?: Alignment;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  hidden?: boolean;
};

export function Host({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View style={style} {...props}>
      {children}
    </View>
  );
}

export function Column({
  style,
  alignment = 'start',
  spacing,
  children,
  onPress,
  disabled,
  hidden,
  ...props
}: LayoutComponentProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      style={[
        columnStyles.base,
        alignmentStyle(columnStyles, alignment),
        spacing != null && { gap: spacing },
        style,
        hidden && { display: 'none' },
        disabled && { opacity: 0.5 },
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}

export function Row({
  style,
  alignment = 'start',
  spacing,
  children,
  onPress,
  disabled,
  hidden,
  ...props
}: LayoutComponentProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      style={[
        rowStyles.base,
        alignmentStyle(rowStyles, alignment),
        spacing != null && { gap: spacing },
        style,
        hidden && { display: 'none' },
        disabled && { opacity: 0.5 },
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}

type AppTextProps = {
  children?: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPress?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  testID?: string;
};

export function Text({
  textStyle,
  style,
  children,
  numberOfLines,
  onPress,
  disabled,
  hidden,
  testID,
}: AppTextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[textStyle, style, hidden && { display: 'none' }, disabled && { opacity: 0.5 }]}
    >
      {children}
    </RNText>
  );
}

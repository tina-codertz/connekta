import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import {
  Host as UIHost,
  Column as UIColumn,
  Row as UIRow,
  Text as UIText,
  type UniversalStyle,
} from '@expo/ui';

export {
  BottomSheet,
  Button,
  Checkbox,
  Collapsible,
  FieldGroup,
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

const UNIVERSAL_STYLE_KEYS = new Set<string>([
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'backgroundColor',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'opacity',
  'width',
  'height',
]);

const TEXT_STYLE_KEYS = new Set<string>([
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'textAlign',
]);

function partitionViewStyle(style?: StyleProp<ViewStyle>) {
  const flat = StyleSheet.flatten(style);
  if (!flat) {
    return { universal: undefined, layout: undefined };
  }

  const universal: UniversalStyle = {};
  const layout: ViewStyle = {};

  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;
    if (UNIVERSAL_STYLE_KEYS.has(key)) {
      (universal as Record<string, unknown>)[key] = value;
    } else {
      (layout as Record<string, unknown>)[key] = value;
    }
  }

  return {
    universal: Object.keys(universal).length > 0 ? universal : undefined,
    layout: Object.keys(layout).length > 0 ? layout : undefined,
  };
}

function partitionTextStyle(style?: StyleProp<TextStyle>) {
  const flat = StyleSheet.flatten(style);
  if (!flat) {
    return { textStyle: undefined, layout: undefined };
  }

  const textStyle: Record<string, unknown> = {};
  const layout: ViewStyle = {};

  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;
    if (TEXT_STYLE_KEYS.has(key)) {
      textStyle[key] = value;
    } else {
      (layout as Record<string, unknown>)[key] = value;
    }
  }

  return {
    textStyle: Object.keys(textStyle).length > 0 ? textStyle : undefined,
    layout: Object.keys(layout).length > 0 ? layout : undefined,
  };
}

function withWebLayoutWrapper(node: React.ReactElement, layout: ViewStyle | undefined) {
  if (Platform.OS !== 'web' || !layout) return node;
  return <View style={layout}>{node}</View>;
}

function withNativeHost(
  node: React.ReactElement,
  matchContents: boolean | { vertical?: boolean; horizontal?: boolean } = true
) {
  if (Platform.OS === 'web') return node;
  return <UIHost matchContents={matchContents}>{node}</UIHost>;
}

type LayoutComponentProps = ViewProps & {
  spacing?: number;
  alignment?: 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | 'stretch';
  children?: React.ReactNode;
};

function normalizeAlignment(
  alignment: LayoutComponentProps['alignment']
): 'start' | 'center' | 'end' | undefined {
  if (!alignment || alignment === 'stretch') return undefined;
  if (alignment === 'flex-start') return 'start';
  if (alignment === 'flex-end') return 'end';
  return alignment;
}

export function Host({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) {
  const { universal, layout } = partitionViewStyle(style);
  return withWebLayoutWrapper(
    <UIHost style={universal} {...props}>
      {children}
    </UIHost>,
    layout
  );
}

export function Column({ style, alignment, children, ...props }: LayoutComponentProps) {
  const { universal, layout } = partitionViewStyle(style);
  return withWebLayoutWrapper(
    withNativeHost(
      <UIColumn style={universal} alignment={normalizeAlignment(alignment)} {...props}>
        {children}
      </UIColumn>,
      { vertical: true }
    ),
    layout
  );
}

export function Row({ style, alignment, children, ...props }: LayoutComponentProps) {
  const { universal, layout } = partitionViewStyle(style);
  return withWebLayoutWrapper(
    withNativeHost(
      <UIRow style={universal} alignment={normalizeAlignment(alignment)} {...props}>
        {children}
      </UIRow>,
      { vertical: true }
    ),
    layout
  );
}

type AppTextProps = Omit<React.ComponentProps<typeof UIText>, 'children' | 'textStyle'> & {
  children?: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
};

function textChildrenToString(children: React.ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textChildrenToString).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return textChildrenToString(children.props.children);
  }
  return '';
}

export function Text({ textStyle, style, children, ...props }: AppTextProps) {
  const fromStyle = partitionTextStyle(style);
  const mergedTextStyle = StyleSheet.flatten([textStyle, fromStyle.textStyle]) as
    | React.ComponentProps<typeof UIText>['textStyle']
    | undefined;

  return withWebLayoutWrapper(
    withNativeHost(
      <UIText textStyle={mergedTextStyle} {...props}>
        {textChildrenToString(children)}
      </UIText>
    ),
    fromStyle.layout
  );
}

import React from 'react';
import { View, ViewProps, Platform } from 'react-native';

export interface LinearGradientProps extends ViewProps {
  colors?: (string | number)[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
}

let NativeLinearGradient: any = null;

// Try to load native expo-linear-gradient if available
if (Platform.OS !== 'web') {
  try {
    NativeLinearGradient = require('expo-linear-gradient').LinearGradient;
  } catch (e) {
    console.warn('expo-linear-gradient not available, using fallback:', e);
    NativeLinearGradient = null;
  }
}

const FallbackLinearGradient = React.forwardRef<any, LinearGradientProps>(
  ({ colors = ['#000000', '#ffffff'], start, end, locations, style, children, ...props }, ref) => {
    const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#000000', '#ffffff'];
    
    // For React Native, use backgroundColor as a simple fallback
    const backgroundColor = typeof safeColors[safeColors.length - 1] === 'string' 
      ? safeColors[safeColors.length - 1] as string
      : '#000000';

    return (
      <View
        ref={ref}
        style={[
          { backgroundColor },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);

FallbackLinearGradient.displayName = 'LinearGradient';

export const LinearGradient = React.forwardRef<any, LinearGradientProps>((props, ref) => {
  const safeColors =
    Array.isArray(props.colors) && props.colors.length > 0
      ? props.colors
      : ['#000000', '#ffffff'];
  const safeProps = { ...props, colors: safeColors };

  // Use native component if available, otherwise use fallback
  if (NativeLinearGradient) {
    return <NativeLinearGradient ref={ref} {...safeProps} />;
  }
  return <FallbackLinearGradient ref={ref} {...safeProps} />;
});

LinearGradient.displayName = 'LinearGradient';

export default LinearGradient;

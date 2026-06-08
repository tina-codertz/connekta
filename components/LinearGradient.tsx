import React from 'react';
import { Platform } from 'react-native';
import NativeLinearGradient, { type LinearGradientProps } from '@/lib/linear-gradient';

// Web-specific gradient component using CSS
const WebLinearGradient = React.forwardRef<any, LinearGradientProps>(
  ({ colors = ['#000000', '#ffffff'], start, end, locations, style, children, ...props }, ref) => {
    const safeColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#000000', '#ffffff'];
    const gradientString = (safeColors as string[])
      .map((color, index) => {
        if (locations && locations[index] !== undefined) {
          return `${color} ${locations[index] * 100}%`;
        }
        return color;
      })
      .join(', ');

    const gradientDirection = start && end ? 'to right' : 'to bottom';
    const backgroundImage = `linear-gradient(${gradientDirection}, ${gradientString})`;

    return (
      <div
        ref={ref as any}
        style={{
          backgroundImage,
          display: 'flex',
          flexDirection: 'column',
          ...(style as any),
        }}
        {...(props as any)}
      >
        {children}
      </div>
    );
  }
);

WebLinearGradient.displayName = 'LinearGradient';

export const LinearGradient = React.forwardRef<any, LinearGradientProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <WebLinearGradient ref={ref} {...props} />;
  }
  return <NativeLinearGradient ref={ref} {...props} />;
});

LinearGradient.displayName = 'LinearGradient';

export default LinearGradient;

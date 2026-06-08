// Mock expo-linear-gradient for web environments
import React from 'react';
import { View, ViewProps } from 'react-native';

interface LinearGradientProps extends ViewProps {
  colors?: (string | number)[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors = ['#000', '#fff'],
  start,
  end,
  style,
  children,
  ...props
}) => {
  const gradientDirection = start && end
    ? `to right`
    : 'to bottom';
  
  const gradientString = colors
    .map((color, index) => {
      const gradientColor = typeof color === 'number' ? `#${color.toString(16)}` : color;
      return gradientColor;
    })
    .join(', ');

  const backgroundImage = `linear-gradient(${gradientDirection}, ${gradientString})`;

  return React.createElement(
    View,
    {
      ...props,
      style: [style, { backgroundImage } as ViewProps['style']],
    },
    children
  );
};

export default LinearGradient;

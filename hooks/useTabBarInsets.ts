import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_CONTENT_HEIGHT = 56;

export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 8);
  const height = TAB_BAR_CONTENT_HEIGHT + bottomInset;
  const contentPaddingBottom = height + 16;

  return {
    bottomInset,
    height,
    contentPaddingBottom,
  };
}

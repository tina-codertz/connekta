// SDK 54 @expo/ui has no universal entry (`import from '@expo/ui'`).
// Use swift-ui in a dev/production build: npx expo prebuild && npx expo run:ios
export * from './ExpoUI.fallback';

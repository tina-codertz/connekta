// SDK 54 @expo/ui has no universal entry (`import from '@expo/ui'`).
// Use jetpack-compose in a dev/production build: npx expo prebuild && npx expo run:android
export * from './ExpoUI.fallback';

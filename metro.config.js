const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const keepAwakeDevShim = path.resolve(__dirname, 'lib/expo-keep-awake-dev.ts');
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Expo's dev wrapper calls keep-awake before Android Activity is ready.
  if (context.dev && moduleName === 'expo-keep-awake') {
    return { type: 'sourceFile', filePath: keepAwakeDevShim };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

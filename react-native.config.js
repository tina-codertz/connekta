/**
 * Disable native Mapbox autolinking on Android.
 * The app uses a WebView map on Android; the native SDK can crash on launch in release APKs.
 */
const disableAndroidMapbox =
  process.env.EAS_BUILD_PLATFORM === 'android' ||
  process.env.EXPO_ANDROID_NO_NATIVE_MAPBOX === '1';

module.exports = {
  dependencies: disableAndroidMapbox
    ? {
        '@rnmapbox/maps': {
          platforms: {
            android: null,
          },
        },
      }
    : {},
};

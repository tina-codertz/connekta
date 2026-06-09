/**
 * Native module overrides for Android release builds.
 * Mapbox is iOS-only; Android uses a WebView map.
 */
module.exports = {
  dependencies: {
    '@rnmapbox/maps': {
      platforms: {
        android: null,
      },
    },
  },
};

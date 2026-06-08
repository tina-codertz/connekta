import { getMapboxGlStyleUrl } from './map-config';
import { TANZANIA_REGION } from './region-config';

export function buildPlacePickerHtml(
  accessToken: string,
  initial?: { latitude: number; longitude: number } | null,
  previewOnly = false
): string {
  const styleUrl = getMapboxGlStyleUrl();
  const initialPayload = initial ?? null;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet" />
    <style>
      html, body, #map { margin: 0; width: 100%; height: 100%; background: #e5e7eb; }
      #crosshair {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 28px;
        height: 28px;
        margin: -14px 0 0 -14px;
        border: 3px solid #EF4444;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
        pointer-events: none;
        z-index: 3;
      }
      #marker {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 18px;
        height: 18px;
        margin: -18px 0 0 -9px;
        background: #EF4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
        z-index: 3;
      }
      #hint {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 2;
        color: #0f172a;
        background: rgba(255,255,255,0.92);
        border-radius: 12px;
        padding: 10px 12px;
        font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
        text-align: center;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div id="${previewOnly ? 'marker' : 'crosshair'}"></div>
    <div id="hint">${previewOnly ? 'Selected location' : 'Move the map to position the pin'}</div>
    <div id="map"></div>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
    <script>
      const initialPayload = ${JSON.stringify(initialPayload)};
      const styleUrl = ${JSON.stringify(styleUrl)};
      const accessToken = ${JSON.stringify(accessToken)};
      const previewOnly = ${JSON.stringify(previewOnly)};

      let map = null;

      function postHostMessage(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function postCenter() {
        if (!map || previewOnly) return;
        const center = map.getCenter();
        postHostMessage({
          type: 'center',
          latitude: center.lat,
          longitude: center.lng,
        });
      }

      function flyToLocation(payload) {
        if (!map || !payload) return;
        map.flyTo({
          center: [payload.longitude, payload.latitude],
          zoom: 16,
          duration: 600,
        });
      }

      window.setPickerLocation = function setPickerLocation(payload) {
        if (!map) {
          window.__pendingLocation = payload;
          return;
        }
        flyToLocation(payload);
      };

      function bootMap(attempts) {
        if (!accessToken) {
          postHostMessage({ type: 'error', message: 'Missing Mapbox access token. Add EXPO_PUBLIC_MAPBOX_TOKEN to .env and restart Expo.' });
          return;
        }

        if (!window.mapboxgl) {
          if (attempts > 100) {
            postHostMessage({ type: 'error', message: 'mapbox-gl failed to load' });
            return;
          }
          setTimeout(function () { bootMap(attempts + 1); }, 50);
          return;
        }

        try {
          mapboxgl.accessToken = accessToken;
          const fallback = ${JSON.stringify(TANZANIA_REGION.center)};
          const start = initialPayload
            ? [initialPayload.longitude, initialPayload.latitude]
            : [fallback.longitude, fallback.latitude];

          map = new mapboxgl.Map({
            container: 'map',
            style: styleUrl,
            center: start,
            zoom: initialPayload ? 16 : 6,
            attributionControl: true,
            interactive: !previewOnly,
          });

          if (previewOnly) {
            map.dragPan.disable();
            map.scrollZoom.disable();
            map.boxZoom.disable();
            map.doubleClickZoom.disable();
            map.touchZoomRotate.disable();
          }

          map.on('load', function () {
            if (!previewOnly) {
              postCenter();
            }
            if (window.__pendingLocation) {
              flyToLocation(window.__pendingLocation);
              window.__pendingLocation = null;
            }
            postHostMessage({ type: 'ready' });
          });

          if (!previewOnly) {
            map.on('moveend', postCenter);
          }

          map.on('error', function (event) {
            const message = (event && event.error && event.error.message) || 'Map failed to load';
            postHostMessage({ type: 'error', message });
          });
        } catch (error) {
          const message = (error && error.message) || 'Map failed to initialize';
          postHostMessage({ type: 'error', message });
        }
      }

      bootMap(0);
    </script>
  </body>
</html>`;
}

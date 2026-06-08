import { getMapboxGlStyleUrl } from './map-config';

export function buildPlacePickerHtml(
  accessToken: string,
  initial?: { latitude: number; longitude: number } | null
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
    <div id="crosshair"></div>
    <div id="hint">Move the map to position the pin</div>
    <div id="map"></div>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
    <script>
      const initialPayload = ${JSON.stringify(initialPayload)};
      const styleUrl = ${JSON.stringify(styleUrl)};
      const accessToken = ${JSON.stringify(accessToken)};

      let map = null;

      function postHostMessage(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function postCenter() {
        if (!map) return;
        const center = map.getCenter();
        postHostMessage({
          type: 'center',
          latitude: center.lat,
          longitude: center.lng,
        });
      }

      function bootMap(attempts) {
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
          const start = initialPayload
            ? [initialPayload.longitude, initialPayload.latitude]
            : [0, 20];

          map = new mapboxgl.Map({
            container: 'map',
            style: styleUrl,
            center: start,
            zoom: initialPayload ? 15 : 2,
            attributionControl: true,
          });

          map.on('load', function () {
            postCenter();
            postHostMessage({ type: 'ready' });
          });

          map.on('moveend', postCenter);

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

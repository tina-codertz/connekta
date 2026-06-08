import { getMapboxGlStyleUrl } from './map-config';

export interface MapWebViewPayload {
  latitude: number;
  longitude: number;
  friends: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    selected: boolean;
  }>;
  places: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    color: string;
  }>;
}

export function buildMapboxWebViewHtml(
  accessToken: string,
  initial?: MapWebViewPayload | null
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
      #status {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 2;
        color: #94a3b8;
        font: 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
        text-align: center;
        pointer-events: none;
      }
      .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { opacity: 0.6; }
    </style>
  </head>
  <body>
    <div id="status">Loading map...</div>
    <div id="map"></div>
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
    <script>
      const initialPayload = ${JSON.stringify(initialPayload)};
      const styleUrl = ${JSON.stringify(styleUrl)};
      const accessToken = ${JSON.stringify(accessToken)};

      let map = null;
      let markers = [];
      let currentZoom = 13;
      const statusEl = document.getElementById('status');

      function setStatus(text) {
        if (statusEl) statusEl.textContent = text || '';
      }

      function postHostMessage(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function clearMarkers() {
        markers.forEach((marker) => marker.remove());
        markers = [];
      }

      function addMarker(lng, lat, color, label) {
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.background = color;
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setText(label || ''))
          .addTo(map);

        markers.push(marker);
      }

      window.updateMap = function updateMap(payload) {
        if (!map || !payload) return;

        window.__lastPayload = payload;
        const center = [payload.longitude, payload.latitude];
        map.jumpTo({ center, zoom: currentZoom });

        clearMarkers();
        addMarker(payload.longitude, payload.latitude, '#3B82F6', 'You');

        (payload.friends || []).forEach((friend) => {
          addMarker(
            friend.longitude,
            friend.latitude,
            friend.selected ? '#22C55E' : '#F59E0B',
            friend.name
          );
        });

        (payload.places || []).forEach((place) => {
          addMarker(place.longitude, place.latitude, place.color || '#8B5CF6', place.name);
        });

        setStatus('');
      };

      window.mapCommand = function mapCommand(command) {
        if (!map) return;

        if (command === 'zoomIn') {
          currentZoom = Math.min((map.getZoom() || currentZoom) + 1, 20);
          map.zoomTo(currentZoom, { duration: 250 });
        }

        if (command === 'zoomOut') {
          currentZoom = Math.max((map.getZoom() || currentZoom) - 1, 2);
          map.zoomTo(currentZoom, { duration: 250 });
        }

        if (command === 'recenter' && window.__lastPayload) {
          map.flyTo({
            center: [window.__lastPayload.longitude, window.__lastPayload.latitude],
            zoom: 14,
            duration: 500,
          });
          currentZoom = 14;
        }
      };

      function handleHostMessage(raw) {
        try {
          const data = typeof raw === 'string' ? raw : raw.data;
          const message = JSON.parse(data);
          if (message.type === 'update' && message.payload) {
            window.updateMap(message.payload);
          }
          if (message.type === 'command') {
            window.mapCommand(message.command);
          }
        } catch (error) {}
      }

      document.addEventListener('message', function (event) {
        handleHostMessage(event);
      });
      window.addEventListener('message', function (event) {
        handleHostMessage(event);
      });

      function bootMap(attempts) {
        if (!accessToken) {
          setStatus('Missing Mapbox access token.');
          postHostMessage({ type: 'error', message: 'Missing Mapbox access token. Add EXPO_PUBLIC_MAPBOX_TOKEN to .env and restart Expo.' });
          return;
        }

        if (!window.mapboxgl) {
          if (attempts > 100) {
            setStatus('Could not load Mapbox. Check your internet connection.');
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
            zoom: initialPayload ? 13 : 2,
            attributionControl: true,
          });

          map.on('load', function () {
            if (initialPayload) {
              window.updateMap(initialPayload);
            }
            postHostMessage({ type: 'ready' });
          });

          map.on('error', function (event) {
            const message = (event && event.error && event.error.message) || 'Map failed to load';
            setStatus(message);
            postHostMessage({ type: 'error', message });
          });
        } catch (error) {
          const message = (error && error.message) || 'Map failed to initialize';
          setStatus(message);
          postHostMessage({ type: 'error', message });
        }
      }

      bootMap(0);
    </script>
  </body>
</html>`;
}

export function toMapWebViewPayload(
  latitude: number,
  longitude: number,
  friends: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }>,
  places: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    color: string | null;
  }>,
  selectedFriendId: string | null
): MapWebViewPayload {
  return {
    latitude,
    longitude,
    friends: friends.map((friend) => ({
      ...friend,
      selected: friend.id === selectedFriendId,
    })),
    places: places.map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      color: place.color || '#8B5CF6',
    })),
  };
}

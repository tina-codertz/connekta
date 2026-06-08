interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
}

interface MapboxWebViewOptions {
  accessToken: string;
  styleUrl: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markers: MapMarker[];
}

export function buildMapboxMapHtml({
  accessToken,
  styleUrl,
  center,
  zoom = 13,
  markers,
}: MapboxWebViewOptions): string {
  const markersJson = JSON.stringify(markers);
  const centerLng = center.lng;
  const centerLat = center.lat;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0f172a; }
    .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left { opacity: 0.7; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = ${JSON.stringify(accessToken)};
    const map = new mapboxgl.Map({
      container: 'map',
      style: ${JSON.stringify(styleUrl)},
      center: [${centerLng}, ${centerLat}],
      zoom: ${zoom},
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const markers = ${markersJson};
    markers.forEach(function(m) {
      new mapboxgl.Marker({ color: m.color })
        .setLngLat([m.lng, m.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(m.label))
        .addTo(map);
    });

    window.zoomIn = function() { map.zoomIn({ duration: 250 }); };
    window.zoomOut = function() { map.zoomOut({ duration: 250 }); };
    window.recenter = function() {
      map.flyTo({ center: [${centerLng}, ${centerLat}], zoom: 14, duration: 500 });
    };
  </script>
</body>
</html>`;
}

export function buildMapMarkers(
  location: { coords: { latitude: number; longitude: number } } | null,
  friends: Array<{ id: string; name: string; latitude: number; longitude: number }>,
  places: Array<{ id: string; name: string; latitude: number; longitude: number; color: string }>,
  selectedFriendId: string | null
): MapMarker[] {
  const markers: MapMarker[] = [];

  if (location) {
    markers.push({
      id: 'you',
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      color: '#3B82F6',
      label: 'You',
    });
  }

  friends.forEach((friend) => {
    markers.push({
      id: friend.id,
      lat: friend.latitude,
      lng: friend.longitude,
      color: selectedFriendId === friend.id ? '#22C55E' : '#F59E0B',
      label: friend.name,
    });
  });

  places.forEach((place) => {
    markers.push({
      id: place.id,
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      color: place.color || '#8B5CF6',
      label: place.name,
    });
  });

  return markers;
}

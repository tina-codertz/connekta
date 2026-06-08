import { mapConfig, isMapboxConfigured } from '@/lib/map-config';
import { TANZANIA_REGION } from '@/lib/region-config';

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

export async function searchPlaces(
  query: string,
  proximity?: { latitude: number; longitude: number }
): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const searchProximity = proximity ?? TANZANIA_REGION.center;

  if (isMapboxConfigured()) {
    return searchWithMapbox(trimmed, searchProximity);
  }

  return searchWithNominatim(trimmed, searchProximity);
}

async function searchWithMapbox(
  query: string,
  proximity: { latitude: number; longitude: number }
): Promise<PlaceSearchResult[]> {
  const { bbox } = TANZANIA_REGION;
  const params = new URLSearchParams({
    access_token: mapConfig.accessToken,
    limit: '10',
    types: 'address,poi,place,locality,neighborhood',
    country: 'tz',
    proximity: `${proximity.longitude},${proximity.latitude}`,
    bbox: `${bbox.minLongitude},${bbox.minLatitude},${bbox.maxLongitude},${bbox.maxLatitude}`,
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { features?: MapboxFeature[] };
    return (data.features ?? []).map((feature) => ({
      id: feature.id,
      name: feature.text,
      address: feature.place_name,
      latitude: feature.center[1],
      longitude: feature.center[0],
    }));
  } catch {
    return [];
  }
}

async function searchWithNominatim(
  query: string,
  proximity: { latitude: number; longitude: number }
): Promise<PlaceSearchResult[]> {
  const { bbox } = TANZANIA_REGION;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '10',
    countrycodes: 'tz',
    viewbox: [
      bbox.minLongitude,
      bbox.maxLatitude,
      bbox.maxLongitude,
      bbox.minLatitude,
    ].join(','),
    bounded: '1',
  });

  const url = `https://nominatim.openstreetmap.org/search?${params}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LocateMate/1.0' },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as Array<{
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return data.map((item) => {
      const parts = item.display_name.split(',');
      return {
        id: String(item.place_id),
        name: parts[0]?.trim() || item.display_name,
        address: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      };
    });
  } catch {
    return [];
  }
}

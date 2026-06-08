import React, { createElement, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxStyleUrl, isMapboxConfigured, mapConfig } from '@/lib/map-config';
import type { LocationObject } from '@/lib/location';
import { FriendMarker } from './types';
import { Place } from '@/types/database';
import { MapFallback } from './MapFallback';
import type { LocateMapHandle } from './locate-map.types';

export type { LocateMapHandle };

interface LocateMapProps {
  location: LocationObject | null;
  friends: FriendMarker[];
  places: Place[];
  selectedFriendId: string | null;
}

export const LocateMap = forwardRef<LocateMapHandle, LocateMapProps>(function LocateMap(
  { location, friends, places, selectedFriendId },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn({ duration: 250 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 250 }),
    recenter: () => {
      if (!mapRef.current || !location) return;
      mapRef.current.flyTo({
        center: [location.coords.longitude, location.coords.latitude],
        zoom: 14,
        duration: 500,
      });
    },
  }));

  useEffect(() => {
    if (!isMapboxConfigured() || !containerRef.current || !location) return;

    mapboxgl.accessToken = mapConfig.accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getMapboxStyleUrl(),
      center: [location.coords.longitude, location.coords.latitude],
      zoom: 13,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const youMarker = new mapboxgl.Marker({ color: '#3B82F6' })
      .setLngLat([location.coords.longitude, location.coords.latitude])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText('You'))
      .addTo(map);
    markersRef.current.push(youMarker);

    friends.forEach((friend) => {
      const marker = new mapboxgl.Marker({
        color: selectedFriendId === friend.id ? '#22C55E' : '#F59E0B',
      })
        .setLngLat([friend.longitude, friend.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(friend.name))
        .addTo(map);
      markersRef.current.push(marker);
    });

    places.forEach((place) => {
      const marker = new mapboxgl.Marker({ color: place.color || '#8B5CF6' })
        .setLngLat([Number(place.longitude), Number(place.latitude)])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong>${place.name}</strong>${place.address ? `<br/>${place.address}` : ''}`
          )
        )
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [location, friends, places, selectedFriendId]);

  useEffect(() => {
    if (!mapRef.current || !location) return;
    mapRef.current.flyTo({
      center: [location.coords.longitude, location.coords.latitude],
      duration: 800,
    });
  }, [location?.coords.latitude, location?.coords.longitude]);

  if (!isMapboxConfigured()) {
    return <MapFallback location={location} message="Add EXPO_PUBLIC_MAPBOX_TOKEN to your .env file" />;
  }

  if (!location) {
    return <MapFallback location={null} message="Waiting for location..." />;
  }

  return createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      overflow: 'hidden',
    },
  });
});

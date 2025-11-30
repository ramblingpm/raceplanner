'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RaceMapProps {
  routeCoordinates?: number[][];
  className?: string;
}

export default function RaceMap({
  routeCoordinates,
  className = '',
}: RaceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [52.3676, 4.9041],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    // Draw route if coordinates are provided
    if (routeCoordinates && routeCoordinates.length > 0) {
      // Convert [lng, lat] to [lat, lng] for Leaflet
      const latLngs: L.LatLngExpression[] = routeCoordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      // Add route polyline
      const polyline = L.polyline(latLngs, {
        color: '#0ea5e9',
        weight: 4,
        opacity: 0.7,
      }).addTo(mapRef.current);

      // Add start marker
      L.marker(latLngs[0] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Start');

      // Add finish marker
      L.marker(latLngs[latLngs.length - 1] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Finish');

      // Fit map to route bounds
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routeCoordinates]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height: '400px', width: '100%' }}
    />
  );
}

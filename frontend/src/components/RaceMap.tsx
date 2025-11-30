'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface FeedZoneMarker {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance_from_start_km: number;
}

interface RaceMapProps {
  routeCoordinates?: number[][];
  selectedFeedZones?: FeedZoneMarker[];
  className?: string;
}

export default function RaceMap({
  routeCoordinates,
  selectedFeedZones = [],
  className = '',
}: RaceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

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

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

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
      const startMarker = L.marker(latLngs[0] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Start');
      markersRef.current.push(startMarker);

      // Add finish marker
      const finishMarker = L.marker(latLngs[latLngs.length - 1] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Finish');
      markersRef.current.push(finishMarker);

      // Add feed zone markers
      if (selectedFeedZones.length > 0) {
        selectedFeedZones.forEach((feedZone) => {
          const feedZoneMarker = L.marker(
            [feedZone.coordinates.lat, feedZone.coordinates.lng],
            {
              icon: L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    background-color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 2px solid #f59e0b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                  ">🍔</div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              }),
            }
          )
            .addTo(mapRef.current!)
            .bindPopup(`
              <strong>${feedZone.name}</strong><br/>
              ${feedZone.distance_from_start_km} km from start
            `);
          markersRef.current.push(feedZoneMarker);
        });
      }

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
  }, [routeCoordinates, selectedFeedZones]);

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height: '400px', width: '100%' }}
    />
  );
}

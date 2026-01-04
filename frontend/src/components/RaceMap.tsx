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
  isStop?: boolean;
}

interface RaceMapProps {
  routeCoordinates?: number[][];
  selectedFeedZones?: FeedZoneMarker[];
  className?: string;
  interactive?: boolean;
}

export default function RaceMap({
  routeCoordinates,
  selectedFeedZones = [],
  className = '',
  interactive = true,
}: RaceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        scrollWheelZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        zoomControl: interactive,
      }).setView([52.3676, 4.9041], 13);

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

      // Get colors from CSS variables
      const getColor = (varName: string) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return value ? `rgb(${value})` : '#0ea5e9'; // fallback
      };

      const primaryColor = getColor('--color-primary');
      const successColor = getColor('--color-success');
      const errorColor = getColor('--color-error');
      const warningColor = getColor('--color-warning');

      // Add route polyline
      const polyline = L.polyline(latLngs, {
        color: primaryColor,
        weight: 4,
        opacity: 0.7,
      }).addTo(mapRef.current);

      // Add start marker
      const startMarker = L.marker(latLngs[0] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${successColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Start');
      markersRef.current.push(startMarker);

      // Add finish marker
      const finishMarker = L.marker(latLngs[latLngs.length - 1] as L.LatLngExpression, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${errorColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        }),
      })
        .addTo(mapRef.current)
        .bindPopup('Finish');
      markersRef.current.push(finishMarker);

      // Add feed zone markers
      if (selectedFeedZones.length > 0) {
        selectedFeedZones.forEach((feedZone) => {
          const isStop = feedZone.isStop;

          const feedZoneMarker = L.marker(
            [feedZone.coordinates.lat, feedZone.coordinates.lng],
            {
              icon: L.divIcon({
                className: 'custom-marker',
                html: isStop
                  ? `
                    <div style="
                      background-color: ${warningColor};
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      border: 2px solid white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">
                      <div style="
                        display: flex;
                        gap: 2px;
                        align-items: center;
                        justify-content: center;
                      ">
                        <div style="width: 2px; height: 10px; background: white;"></div>
                        <div style="width: 2px; height: 10px; background: white;"></div>
                      </div>
                    </div>
                  `
                  : `
                    <div style="
                      background-color: ${errorColor};
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    "></div>
                  `,
                iconSize: isStop ? [24, 24] : [12, 12],
                iconAnchor: isStop ? [12, 12] : [6, 6],
              }),
            }
          )
            .addTo(mapRef.current!)
            .bindPopup(`
              <strong>${feedZone.name}</strong><br/>
              ${feedZone.distance_from_start_km} km from start
              ${isStop ? '<br/><em>Stop</em>' : '<br/><em>Passing</em>'}
            `);
          markersRef.current.push(feedZoneMarker);
        });
      }

      // Fit map to route bounds
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [20, 20] });
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routeCoordinates, selectedFeedZones, interactive]);

  return (
    <div
      ref={mapContainerRef}
      className={className || 'rounded-lg overflow-hidden'}
      style={{
        height: '100%',
        width: '100%',
        cursor: interactive ? 'grab' : 'default'
      }}
    />
  );
}

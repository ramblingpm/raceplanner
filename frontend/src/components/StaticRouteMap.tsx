'use client';

import { useMemo } from 'react';

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

interface StaticRouteMapProps {
  routeCoordinates: number[][];
  feedZones?: FeedZoneMarker[];
  className?: string;
}

export default function StaticRouteMap({
  routeCoordinates,
  feedZones = [],
  className = '',
}: StaticRouteMapProps) {
  const { pathData, viewBox, bounds } = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return { pathData: '', viewBox: '0 0 100 100', bounds: null };
    }

    // Calculate bounds
    const lats = routeCoordinates.map(([_, lat]) => lat);
    const lngs = routeCoordinates.map(([lng, _]) => lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    // Add padding
    const padding = 0.1;
    const paddedMinLat = minLat - latRange * padding;
    const paddedMaxLat = maxLat + latRange * padding;
    const paddedMinLng = minLng - lngRange * padding;
    const paddedMaxLng = maxLng + lngRange * padding;

    const paddedLatRange = paddedMaxLat - paddedMinLat;
    const paddedLngRange = paddedMaxLng - paddedMinLng;

    // Map coordinates to SVG space (flipping Y axis)
    const mapToSVG = (lng: number, lat: number) => {
      const x = ((lng - paddedMinLng) / paddedLngRange) * 1000;
      const y = ((paddedMaxLat - lat) / paddedLatRange) * 1000; // Flip Y axis
      return { x, y };
    };

    // Build path data
    const points = routeCoordinates.map(([lng, lat]) => mapToSVG(lng, lat));
    const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

    return {
      pathData: pathString,
      viewBox: '0 0 1000 1000',
      bounds: { paddedMinLat, paddedMaxLat, paddedMinLng, paddedMaxLng, paddedLatRange, paddedLngRange },
    };
  }, [routeCoordinates]);

  // Helper function to map coordinates to SVG space
  const mapCoordinateToSVG = (lng: number, lat: number) => {
    if (!bounds) return { x: 0, y: 0 };
    const { paddedMinLng, paddedMaxLat, paddedLngRange, paddedLatRange } = bounds;
    const x = ((lng - paddedMinLng) / paddedLngRange) * 1000;
    const y = ((paddedMaxLat - lat) / paddedLatRange) * 1000;
    return { x, y };
  };

  if (!pathData) {
    return null;
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', background: '#f0f0f0' }}>
      {/* SVG with background pattern and route */}
      <svg
        viewBox={viewBox}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Define patterns for background */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d0d0d0" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Background with grid pattern */}
        <rect width="1000" height="1000" fill="#f5f5f5" />
        <rect width="1000" height="1000" fill="url(#grid)" opacity="0.3" />

      {/* Route path */}
      <path
        d={pathData}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      />

      {/* Start marker */}
      {routeCoordinates.length > 0 && (() => {
        const firstPoint = routeCoordinates[0];
        const svgPoint = ((lng: number, lat: number) => {
          const lats = routeCoordinates.map(([_, lat]) => lat);
          const lngs = routeCoordinates.map(([lng, _]) => lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const latRange = maxLat - minLat;
          const lngRange = maxLng - minLng;
          const padding = 0.1;
          const paddedMinLat = minLat - latRange * padding;
          const paddedMaxLat = maxLat + latRange * padding;
          const paddedMinLng = minLng - lngRange * padding;
          const paddedMaxLng = maxLng + lngRange * padding;
          const paddedLatRange = paddedMaxLat - paddedMinLat;
          const paddedLngRange = paddedMaxLng - paddedMinLng;
          const x = ((lng - paddedMinLng) / paddedLngRange) * 1000;
          const y = ((paddedMaxLat - lat) / paddedLatRange) * 1000;
          return { x, y };
        })(firstPoint[0], firstPoint[1]);

        return (
          <circle
            cx={svgPoint.x}
            cy={svgPoint.y}
            r="40"
            fill="#10b981"
            stroke="white"
            strokeWidth="4"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        );
      })()}

      {/* Finish marker */}
      {routeCoordinates.length > 1 && (() => {
        const lastPoint = routeCoordinates[routeCoordinates.length - 1];
        const svgPoint = ((lng: number, lat: number) => {
          const lats = routeCoordinates.map(([_, lat]) => lat);
          const lngs = routeCoordinates.map(([lng, _]) => lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const latRange = maxLat - minLat;
          const lngRange = maxLng - minLng;
          const padding = 0.1;
          const paddedMinLat = minLat - latRange * padding;
          const paddedMaxLat = maxLat + latRange * padding;
          const paddedMinLng = minLng - lngRange * padding;
          const paddedMaxLng = maxLng + lngRange * padding;
          const paddedLatRange = paddedMaxLat - paddedMinLat;
          const paddedLngRange = paddedMaxLng - paddedMinLng;
          const x = ((lng - paddedMinLng) / paddedLngRange) * 1000;
          const y = ((paddedMaxLat - lat) / paddedLatRange) * 1000;
          return { x, y };
        })(lastPoint[0], lastPoint[1]);

        return (
          <circle
            cx={svgPoint.x}
            cy={svgPoint.y}
            r="40"
            fill="#ef4444"
            stroke="white"
            strokeWidth="4"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        );
      })()}

      {/* Feed zone markers (only for stops) */}
      {feedZones
        .filter(zone => zone.isStop)
        .map((zone) => {
          const svgPoint = mapCoordinateToSVG(zone.coordinates.lng, zone.coordinates.lat);
          return (
            <g key={zone.id}>
              {/* Yellow circle for stop */}
              <circle
                cx={svgPoint.x}
                cy={svgPoint.y}
                r="40"
                fill="#f59e0b"
                stroke="white"
                strokeWidth="4"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              />
              {/* Pause icon (two bars) */}
              <g transform={`translate(${svgPoint.x - 8}, ${svgPoint.y - 10})`}>
                <rect x="0" y="0" width="5" height="20" fill="white" />
                <rect x="11" y="0" width="5" height="20" fill="white" />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface ElevationProfileProps {
  elevations: number[]; // Elevation data in meters
  distances?: number[]; // Optional distance data in km (if not provided, will be evenly distributed)
  totalDistanceKm: number;
  className?: string;
  height?: number;
}

export default function ElevationProfile({
  elevations,
  distances,
  totalDistanceKm,
  className = '',
  height = 200,
}: ElevationProfileProps) {
  const t = useTranslations('elevationProfile');

  const { points, minElevation, maxElevation, elevationRange } = useMemo(() => {
    if (elevations.length === 0) {
      return { points: '', minElevation: 0, maxElevation: 0, elevationRange: 0 };
    }

    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const range = max - min;

    // If no distances provided, distribute evenly across total distance
    const distancePoints = distances || elevations.map((_, i) => (i / (elevations.length - 1)) * totalDistanceKm);

    // Generate SVG path points
    const width = 800; // SVG viewBox width
    const pathHeight = height - 40; // Leave space for axis labels

    const svgPoints = elevations
      .map((elevation, index) => {
        const x = (distancePoints[index] / totalDistanceKm) * width;
        const y = pathHeight - ((elevation - min) / (range || 1)) * pathHeight;
        return `${x},${y}`;
      })
      .join(' ');

    // Create a closed path for filling
    const pathData = `M 0,${pathHeight} L ${svgPoints} L ${width},${pathHeight} Z`;

    return {
      points: pathData,
      minElevation: Math.round(min),
      maxElevation: Math.round(max),
      elevationRange: Math.round(range),
    };
  }, [elevations, distances, totalDistanceKm, height]);

  if (elevations.length === 0) {
    return (
      <div className={`bg-surface-1 rounded-lg p-6 border border-border ${className}`}>
        <p className="text-sm text-text-muted text-center">
          No elevation data available for this route
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-surface-1 rounded-lg p-6 border border-border ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Elevation Profile
        </h3>
        <div className="flex gap-6 text-sm text-text-secondary">
          <div>
            <span className="font-medium">Min:</span> {minElevation}m
          </div>
          <div>
            <span className="font-medium">Max:</span> {maxElevation}m
          </div>
          <div>
            <span className="font-medium">Range:</span> {elevationRange}m
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 800 ${height}`}
          className="w-full"
          style={{ maxHeight: `${height}px` }}
        >
          {/* Grid lines */}
          <g className="opacity-20">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={`grid-${fraction}`}
                x1="0"
                y1={fraction * (height - 40)}
                x2="800"
                y2={fraction * (height - 40)}
                stroke="currentColor"
                strokeWidth="1"
                className="text-text-muted"
              />
            ))}
          </g>

          {/* Elevation fill area */}
          <path
            d={points}
            fill="url(#elevationGradient)"
            stroke="rgb(var(--color-primary))"
            strokeWidth="2"
            className="transition-all"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* X-axis labels (distance) */}
          <g className="text-xs text-text-muted">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <text
                key={`distance-${fraction}`}
                x={fraction * 800}
                y={height - 5}
                textAnchor="middle"
                fill="currentColor"
              >
                {Math.round(fraction * totalDistanceKm)}km
              </text>
            ))}
          </g>

          {/* Y-axis labels (elevation) */}
          <g className="text-xs text-text-muted">
            {[0, 0.5, 1].map((fraction) => {
              const elevation = minElevation + fraction * (maxElevation - minElevation);
              return (
                <text
                  key={`elevation-${fraction}`}
                  x="5"
                  y={(1 - fraction) * (height - 40) + 4}
                  fill="currentColor"
                >
                  {Math.round(elevation)}m
                </text>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

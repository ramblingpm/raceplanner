'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface FeedZoneMarker {
  name: string;
  distance_from_start_km: number;
}

interface ElevationProfileProps {
  elevations: number[]; // Elevation data in meters
  distances?: number[]; // Optional distance data in km (if not provided, will be evenly distributed)
  totalDistanceKm: number;
  feedZones?: FeedZoneMarker[]; // Optional feed zones to mark on profile
  className?: string;
  height?: number;
}

// Minimum elevation change for a segment to count (meters) - same as routeParser.ts
const ELEVATION_THRESHOLD = 3;

// Window size for moving average smoothing
const SMOOTHING_WINDOW = 5;

/**
 * Apply moving average smoothing to elevation data
 * Helps filter out GPS noise and small fluctuations
 */
function smoothElevations(elevations: number[]): number[] {
  if (elevations.length < SMOOTHING_WINDOW) {
    return elevations;
  }

  const smoothed: number[] = [];
  const halfWindow = Math.floor(SMOOTHING_WINDOW / 2);

  for (let i = 0; i < elevations.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(elevations.length, i + halfWindow + 1);

    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += elevations[j];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

/**
 * Calculate elevation gain using segment-based approach (same as routeParser.ts)
 */
function calculateElevationGain(elevations: number[]): number {
  if (elevations.length === 0) return 0;

  const smoothed = smoothElevations(elevations);

  let totalGain = 0;
  let segmentStart = 0;
  let isClimbing = false;

  for (let i = 1; i < smoothed.length; i++) {
    const diff = smoothed[i] - smoothed[i - 1];

    // Detect start of climbing segment
    if (diff > 0 && !isClimbing) {
      segmentStart = i - 1;
      isClimbing = true;
    }
    // Detect start of descending segment
    else if (diff < 0 && isClimbing) {
      // End climbing segment
      const segmentGain = smoothed[i - 1] - smoothed[segmentStart];
      if (segmentGain >= ELEVATION_THRESHOLD) {
        totalGain += segmentGain;
      }
      isClimbing = false;
    }
  }

  // Handle final segment if still climbing
  if (isClimbing) {
    const segmentGain = smoothed[smoothed.length - 1] - smoothed[segmentStart];
    if (segmentGain >= ELEVATION_THRESHOLD) {
      totalGain += segmentGain;
    }
  }

  return Math.round(totalGain);
}

export default function ElevationProfile({
  elevations,
  distances,
  totalDistanceKm,
  feedZones = [],
  className = '',
  height = 200,
}: ElevationProfileProps) {
  const t = useTranslations('elevationProfile');

  // Calculate elevation gain between two distance points
  const calculateSegmentGain = (startKm: number, endKm: number): number => {
    if (elevations.length === 0) return 0;

    const distancePoints = distances || elevations.map((_, i) => (i / (elevations.length - 1)) * totalDistanceKm);

    // Extract elevations within the segment range
    const segmentElevations: number[] = [];
    for (let i = 0; i < elevations.length; i++) {
      const dist = distancePoints[i];
      if (dist >= startKm && dist <= endKm) {
        segmentElevations.push(elevations[i]);
      }
    }

    // Use the same algorithm as the main calculation
    return calculateElevationGain(segmentElevations);
  };

  const { points, minElevation, maxElevation, totalElevationGain } = useMemo(() => {
    if (elevations.length === 0) {
      return { points: '', minElevation: 0, maxElevation: 0, totalElevationGain: 0 };
    }

    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const range = max - min;

    // Calculate total elevation gain using segment-based approach with smoothing
    const gain = calculateElevationGain(elevations);

    // If no distances provided, distribute evenly across total distance
    const distancePoints = distances || elevations.map((_, i) => (i / (elevations.length - 1)) * totalDistanceKm);

    // Generate SVG path points
    const chartWidth = 800; // SVG chart area width
    const leftMargin = 60; // Left margin for Y-axis labels
    const topMargin = 15; // Top margin for max elevation label
    const bottomMargin = 40; // Bottom margin for X-axis labels
    const chartHeight = height - topMargin - bottomMargin;

    const svgPoints = elevations
      .map((elevation, index) => {
        const x = leftMargin + (distancePoints[index] / totalDistanceKm) * chartWidth;
        const y = topMargin + chartHeight - ((elevation - min) / (range || 1)) * chartHeight;
        return `${x},${y}`;
      })
      .join(' ');

    // Create a closed path for filling
    const pathData = `M ${leftMargin},${topMargin + chartHeight} L ${svgPoints} L ${leftMargin + chartWidth},${topMargin + chartHeight} Z`;

    return {
      points: pathData,
      minElevation: Math.round(min),
      maxElevation: Math.round(max),
      totalElevationGain: gain, // Already rounded by calculateElevationGain
    };
  }, [elevations, distances, totalDistanceKm, height]);

  if (elevations.length === 0) {
    return (
      <div className={`bg-surface-1 rounded-lg p-6 border border-border ${className}`}>
        <p className="text-sm text-text-muted text-center">
          {t('noData')}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-surface-1 rounded-lg p-6 border border-border ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {t('title')}
        </h3>
        <div className="flex gap-6 text-sm text-text-secondary">
          <div>
            <span className="font-medium">{t('min')}:</span> {minElevation}{t('meters')}
          </div>
          <div>
            <span className="font-medium">{t('max')}:</span> {maxElevation}{t('meters')}
          </div>
          <div>
            <span className="font-medium">{t('gain')}:</span> {totalElevationGain}{t('meters')}
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 860 ${height}`}
          className="w-full"
          style={{ maxHeight: `${height}px` }}
        >
          {/* Grid lines */}
          <g className="opacity-20">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <line
                key={`grid-${fraction}`}
                x1="60"
                y1={15 + fraction * (height - 55)}
                x2="860"
                y2={15 + fraction * (height - 55)}
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
          <g className="text-base font-semibold text-text-secondary">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <text
                key={`distance-${fraction}`}
                x={60 + fraction * 800}
                y={height - 5}
                textAnchor="middle"
                fill="currentColor"
              >
                {Math.round(fraction * totalDistanceKm)}km
              </text>
            ))}
          </g>

          {/* Y-axis labels (elevation) */}
          <g className="text-base font-semibold text-text-secondary">
            {[0, 0.5, 1].map((fraction) => {
              const elevation = minElevation + fraction * (maxElevation - minElevation);
              return (
                <text
                  key={`elevation-${fraction}`}
                  x="55"
                  y={15 + (1 - fraction) * (height - 55) + 5}
                  textAnchor="end"
                  fill="currentColor"
                >
                  {Math.round(elevation)}m
                </text>
              );
            })}
          </g>

          {/* Segment elevation gains */}
          {(() => {
            // Create segments based on feed zones
            const segments: Array<{ startKm: number; endKm: number }> = [];
            const sortedFeedZones = [...feedZones].sort((a, b) => a.distance_from_start_km - b.distance_from_start_km);

            if (sortedFeedZones.length === 0) {
              // No feed zones, show total as one segment
              segments.push({ startKm: 0, endKm: totalDistanceKm });
            } else {
              // Start to first feed zone
              segments.push({ startKm: 0, endKm: sortedFeedZones[0].distance_from_start_km });

              // Between feed zones
              for (let i = 0; i < sortedFeedZones.length - 1; i++) {
                segments.push({
                  startKm: sortedFeedZones[i].distance_from_start_km,
                  endKm: sortedFeedZones[i + 1].distance_from_start_km,
                });
              }

              // Last feed zone to finish
              segments.push({
                startKm: sortedFeedZones[sortedFeedZones.length - 1].distance_from_start_km,
                endKm: totalDistanceKm,
              });
            }

            return segments.map((segment, index) => {
              const gain = calculateSegmentGain(segment.startKm, segment.endKm);
              if (gain === 0) return null; // Don't show segments with no gain

              const midKm = (segment.startKm + segment.endKm) / 2;
              const x = 60 + (midKm / totalDistanceKm) * 800;
              const y = 35; // Position near top of chart

              return (
                <g key={`segment-gain-${index}`}>
                  {/* Elevation gain text */}
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-base font-bold text-text-primary"
                  >
                    ↑{gain}m
                  </text>
                </g>
              );
            });
          })()}

          {/* Feed zone markers */}
          {feedZones.map((feedZone, index) => {
            const x = 60 + (feedZone.distance_from_start_km / totalDistanceKm) * 800;
            const chartBottom = height - 40;

            return (
              <g key={`feedzone-${index}`}>
                {/* Vertical line */}
                <line
                  x1={x}
                  y1="15"
                  x2={x}
                  y2={chartBottom}
                  stroke="rgb(var(--color-warning))"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                  className="opacity-80"
                />
                {/* Marker circle */}
                <circle
                  cx={x}
                  cy={chartBottom + 15}
                  r="8"
                  fill="rgb(var(--color-warning))"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Label background */}
                <rect
                  x={x - 35}
                  y={chartBottom + 20}
                  width="70"
                  height="18"
                  fill="rgb(var(--color-surface-1))"
                  stroke="rgb(var(--color-warning))"
                  strokeWidth="1"
                  rx="4"
                  className="opacity-95"
                />
                {/* Label */}
                <text
                  x={x}
                  y={chartBottom + 32}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-xs font-semibold text-text-primary"
                >
                  {feedZone.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

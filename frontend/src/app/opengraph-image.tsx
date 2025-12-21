import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Race Planner - Planera ditt lopp med precision';

// Open Graph Image component
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: 120,
            marginBottom: 20,
          }}
        >
          🚴
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Race Planner
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          Planera ditt lopp med precision
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

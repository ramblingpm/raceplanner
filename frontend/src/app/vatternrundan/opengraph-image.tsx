import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Vätternrundan - Planera ditt lopp | Race Planner';

// Open Graph Image for Vätternrundan page
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
          Vätternrundan
        </div>
        <div
          style={{
            fontSize: 42,
            color: 'rgba(255, 255, 255, 0.95)',
            textAlign: 'center',
            marginBottom: 15,
          }}
        >
          315 km runt Sveriges vackraste sjö
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.85)',
            textAlign: 'center',
          }}
        >
          Planera din strategi med Race Planner
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

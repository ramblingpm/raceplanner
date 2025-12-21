import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Guide: Planera för Vätternrundan | Race Planner';

// Open Graph Image for Vätternrundan Guide page
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
          📚
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Planeringsguide för Vätternrundan
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
          }}
        >
          Tips om tempo, näring, utrustning och strategi
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

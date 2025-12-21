import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const alt = 'Checklista inför Vätternrundan | Race Planner';

// Open Graph Image for Vätternrundan Checklist page
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
          ✅
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
          Jag ska cykla Vättern!
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
          }}
        >
          Din kompletta checklista inför loppet
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

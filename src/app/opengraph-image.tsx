import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ile Zostanie? — Kalkulator ZUS i PIT 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, color: 'white', marginBottom: 16, display: 'flex' }}>
          Ile Zostanie?
        </div>
        <div style={{ fontSize: 32, color: '#a78bfa', marginBottom: 32, display: 'flex' }}>
          Kalkulator ZUS i PIT 2026
        </div>
        <div style={{ fontSize: 24, color: '#9ca3af', textAlign: 'center', maxWidth: 800, display: 'flex' }}>
          Porównaj JDG, Sp. z o.o. i B2B vs etat. Oblicz ile zostanie Ci na rękę.
        </div>
        <div
          style={{
            marginTop: 48,
            padding: '12px 32px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: 16,
            fontSize: 24,
            color: 'white',
            fontWeight: 700,
            display: 'flex',
          }}
        >
          ilezostanie.com
        </div>
      </div>
    ),
    { ...size }
  );
}

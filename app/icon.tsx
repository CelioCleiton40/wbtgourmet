import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F1E17 0%, #060C09 100%)',
          borderRadius: '50%',
          border: '3px solid #22C55E',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: 'serif',
            letterSpacing: '1px',
            marginTop: '2px',
          }}
        >
          WBT
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 8,
            fontWeight: 800,
            color: '#EAB308',
            letterSpacing: '2px',
            marginTop: '-2px',
          }}
        >
          GOURMET
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

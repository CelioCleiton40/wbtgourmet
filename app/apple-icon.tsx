import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '36px',
          border: '6px solid #22C55E',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 70,
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: 'serif',
            letterSpacing: '2px',
          }}
        >
          WBT
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            fontWeight: 800,
            color: '#EAB308',
            letterSpacing: '6px',
            marginTop: '-4px',
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

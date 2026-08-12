export function CourtDivider() {
  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '40px 0',
      }}
    >
      <span
        style={{
          height: '1px',
          flex: 1,
          background:
            'repeating-linear-gradient(to right, rgba(239,230,208,0.2) 0, rgba(239,230,208,0.2) 8px, transparent 8px, transparent 16px)',
        }}
      />
      <span
        style={{
          height: '10px',
          width: '10px',
          borderRadius: '50%',
          background: '#D4F13A',
          boxShadow: '0 0 10px rgba(212, 241, 58, 0.7)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          height: '1px',
          flex: 1,
          background:
            'repeating-linear-gradient(to right, rgba(239,230,208,0.2) 0, rgba(239,230,208,0.2) 8px, transparent 8px, transparent 16px)',
        }}
      />
    </div>
  );
}

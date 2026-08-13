'use client';

/** GourmetDivider — Ornamento de talheres inspirado na logo WBT Gourmet */
export function CourtDivider() {
  return (
    <div
      aria-hidden="true"
      className="my-8 flex items-center gap-4 opacity-30"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-g-line" />

      {/* Ornamento central: talheres cruzados (motivo da logo) */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-g-green"
      >
        <path
          d="M8 3v3a4 4 0 0 0 3 3.87V21h2v-5.12A4 4 0 0 0 16 12V3h-2v3h-1V3h-2v3H9V3H8z"
          fill="currentColor"
          fillOpacity="0.7"
        />
        <path
          d="M5 3v18h2V3H5z"
          fill="currentColor"
          fillOpacity="0.4"
        />
      </svg>

      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-g-line" />
    </div>
  );
}

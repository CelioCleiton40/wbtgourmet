import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'court-night': '#12161B',
        sand: {
          DEFAULT: '#EFE6D0',
          '95': 'rgba(239, 230, 208, 0.95)',
        },
        ball: '#D4F13A',
        ember: '#E8592C',
        ink: {
          DEFAULT: '#F5F1E6',
          muted: '#93A19E',
        },
      },
      fontFamily: {
        display: ['var(--font-anton)', 'sans-serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      backgroundImage: {
        'court-gradient': 'linear-gradient(180deg, #12161B 0%, #1a2028 100%)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-ball': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 241, 58, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 241, 58, 0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.35s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-ball': 'pulse-ball 2s ease-in-out infinite',
      },
    },
  },
} satisfies Config;

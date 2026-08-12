import { HeroVideo } from './hero-video';
import { HeroContent } from './hero-content';

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-court-night"
    >
      {/* Vídeo Fullscreen em 3D Parallax */}
      <HeroVideo />

      {/* Linhas Perspectivas da Quadra no SVG */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
      >
        <line x1="400" y1="0" x2="0" y2="500" stroke="#EFE6D0" strokeWidth="1.2" strokeDasharray="10 14" />
        <line x1="400" y1="0" x2="800" y2="500" stroke="#EFE6D0" strokeWidth="1.2" strokeDasharray="10 14" />
        <line x1="400" y1="0" x2="150" y2="500" stroke="#EFE6D0" strokeWidth="0.7" strokeDasharray="6 10" opacity="0.6" />
        <line x1="400" y1="0" x2="650" y2="500" stroke="#EFE6D0" strokeWidth="0.7" strokeDasharray="6 10" opacity="0.6" />
        <line x1="0" y1="240" x2="800" y2="240" stroke="#EFE6D0" strokeWidth="1" strokeDasharray="10 14" />
        <line x1="0" y1="380" x2="800" y2="380" stroke="#EFE6D0" strokeWidth="0.6" strokeDasharray="6 10" opacity="0.5" />
      </svg>

      {/* Conteúdo Principal do Hero */}
      <HeroContent />
    </section>
  );
}
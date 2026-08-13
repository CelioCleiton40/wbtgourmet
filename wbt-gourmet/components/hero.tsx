import { HeroVideo } from './hero-video';
import { HeroContent } from './hero-content';

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-g-dark"
    >
      {/* Vídeo Fullscreen */}
      <HeroVideo />

      {/* Overlay gourmet — gradiente radial verde + escurecimento */}
      <div
        aria-hidden="true"
        className="hero-overlay pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Brilho difuso superior — atmosfera premium */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4BA646 0%, transparent 70%)' }}
      />

      {/* Conteúdo Principal */}
      <HeroContent />
    </section>
  );
}
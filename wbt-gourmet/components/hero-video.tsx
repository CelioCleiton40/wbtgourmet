'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Efeito Parallax 3D suave no vídeo e no container
  const videoY = useTransform(scrollY, [0, 500], [0, 100]);
  const videoScale = useTransform(scrollY, [0, 500], [1, 1.12]);
  const videoOpacity = useTransform(scrollY, [0, 400], [0.65, 0.15]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        style={{
          y: videoY,
          scale: videoScale,
          opacity: videoOpacity,
        }}
        className="relative h-full w-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/og-image.png"
          className="h-full w-full object-cover object-center filter brightness-[0.7] contrast-[1.1] scale-105"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Gradientes Cinematic Overlays para integração harmoniosa */}
      <div className="absolute inset-0 bg-gradient-to-t from-court-night via-court-night/40 to-court-night/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,transparent_0%,#12161B_100%)]" />
    </div>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite imagens locais do /public
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;

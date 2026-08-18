import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Manrope, DM_Mono } from 'next/font/google';
import './globals.css';

/* =========================================================
   FONTS — Identidade Gourmet
   Nomes únicos com prefixo --wbt- para evitar conflito
   com os tokens --font-* do Tailwind v4 @theme
   ========================================================= */

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--wbt-playfair',
  display: 'swap',
  preload: true,
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--wbt-manrope',
  display: 'swap',
  preload: true,
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--wbt-dm-mono',
  display: 'swap',
  preload: true,
});

/* =========================================================
   CONSTANTS
   ========================================================= */

const BASE_URL = 'https://wbtgourmet.com.br';
const SITE_NAME = 'WBT Gourmet';

const DESCRIPTION =
  'Peça o cardápio completo da WBT Gourmet: filé mignon, camarão, petiscos, açaí, sanduíches e bebidas premium. Delivery em Mossoró-RN.';

/* =========================================================
   VIEWPORT
   ========================================================= */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4BA646',
  colorScheme: 'dark',
};

/* =========================================================
   METADATA
   ========================================================= */

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'WBT Gourmet | Delivery em Mossoró-RN',
    template: '%s | WBT Gourmet',
  },

  description: DESCRIPTION,

  keywords: [
    'WBT Gourmet',
    'delivery Mossoró',
    'WBT Arena',
    'comida delivery Mossoró',
    'filé mignon delivery',
    'camarão delivery',
    'açaí Mossoró',
    'petiscos Mossoró',
    'sanduíche gourmet Mossoró',
    'delivery RN',
    'cardápio WBT',
  ],

  authors: [
    {
      name: SITE_NAME,
      url: BASE_URL,
    },
  ],

  creator: SITE_NAME,
  publisher: SITE_NAME,

  applicationName: SITE_NAME,

  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/',
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  openGraph: {
    type: 'website',
    url: BASE_URL,
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: 'WBT Gourmet | Delivery em Mossoró-RN',
    description: DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WBT Gourmet — Delivery em Mossoró-RN',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'WBT Gourmet | Delivery em Mossoró-RN',
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

  category: 'food',
};

/* =========================================================
   ROOT LAYOUT
   ========================================================= */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${manrope.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
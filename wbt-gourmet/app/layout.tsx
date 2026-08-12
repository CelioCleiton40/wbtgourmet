import type { Metadata, Viewport } from 'next';
import { Anton, Manrope, Space_Mono } from 'next/font/google';
import './globals.css';

/* =========================================================
   FONTS
   ========================================================= */

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
  preload: true,
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  preload: true,
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
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
  themeColor: '#12161B',
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
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
      className={`${anton.variable} ${manrope.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
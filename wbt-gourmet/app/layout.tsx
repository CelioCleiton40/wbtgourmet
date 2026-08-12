import type { Metadata } from 'next';
import { Anton, Manrope, Space_Mono } from 'next/font/google';
import './globals.css';

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const BASE_URL = 'https://wbtgourmet.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: 'WBT Gourmet | Delivery em Mossoró-RN',
    template: '%s | WBT Gourmet',
  },
  description:
    'Peça o cardápio completo da WBT Gourmet: filé mignon, camarão, petiscos, açaí, sanduíches e bebidas premium. Delivery rápido em Mossoró-RN direto da WBT Arena.',
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
  authors: [{ name: 'WBT Gourmet' }],
  creator: 'WBT Gourmet',
  publisher: 'WBT Gourmet',

  alternates: {
    canonical: BASE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    url: BASE_URL,
    locale: 'pt_BR',
    siteName: 'WBT Gourmet',
    title: 'WBT Gourmet | Delivery em Mossoró-RN',
    description:
      'Peça o cardápio completo da WBT Gourmet: filé mignon, camarão, petiscos, açaí, sanduíches e bebidas premium. Delivery rápido em Mossoró-RN.',
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
    description:
      'Peça o cardápio completo da WBT Gourmet: filé mignon, camarão, petiscos, açaí e bebidas premium.',
    images: ['/og-image.png'],
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },

  category: 'food',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${manrope.variable} ${spaceMono.variable}`}
    >
      <body className="bg-[#12161B] font-[family-name:var(--font-manrope)] text-[#F5F1E6] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { WithContext, Restaurant } from 'schema-dts';

import { menu } from '@/data/menu';
import { Hero } from '@/components/hero';
import { MenuNav } from '@/components/menu-nav';
import { MenuSection } from '@/components/menu-section';
import { StickyCta } from '@/components/sticky-cta';
import { CartDrawer } from '@/components/cart-drawer';
import { LgpdBanner } from '@/components/lgpd-banner';

const SITE_URL = 'https://wbtgourmet.com.br';
const RESTAURANT_IMAGE = `${SITE_URL}/og-image.png`;

const restaurantSchema: WithContext<Restaurant> = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',

  name: 'WBT Gourmet',

  description:
    'Delivery de comida gourmet em Mossoró-RN. Filé mignon, camarão, petiscos, açaí, sanduíches e bebidas premium direto da WBT Arena.',

  url: SITE_URL,

  image: [RESTAURANT_IMAGE],

  servesCuisine: ['Brasileira', 'Gourmet', 'Petiscos'],

  priceRange: '$$',

  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mossoró',
    addressRegion: 'RN',
    addressCountry: 'BR',
  },

  geo: {
    '@type': 'GeoCoordinates',
    latitude: -5.1876,
    longitude: -37.3437,
  },

  areaServed: {
    '@type': 'City',
    name: 'Mossoró',
  },

  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: ['pt-BR'],
  },
};

const restaurantJsonLd = JSON.stringify(restaurantSchema);

export default function Page() {
  return (
    <main className="min-h-dvh bg-court-night text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: restaurantJsonLd,
        }}
      />

      {/* Hero com Vídeo 3D Parallax */}
      <Hero />

      {/* Menu de Navegação Sticky */}
      <MenuNav sections={menu} />

      {/* Grade de Seções do Cardápio */}
      <section
        id="cardapio"
        className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8"
        aria-label="Cardápio WBT Gourmet"
      >
        {menu.map((section, index) => (
          <MenuSection
            key={section.id}
            section={section}
            index={index}
          />
        ))}
      </section>

      {/* Footer Profissional */}
      <footer className="border-t border-sand/10 bg-court-night/80 px-4 py-10 text-center text-xs text-ink-muted">
        <div className="mx-auto max-w-2xl space-y-2">
          <p className="font-mono text-sm text-ball font-bold tracking-wider">
            WBT Gourmet
          </p>
          <p>
            WBT Arena · Mossoró-RN · Delivery em Mossoró e região
          </p>
          <p className="text-[11px] text-ink-muted/70 pt-2">
            Confirmação rápida via WhatsApp · Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Componentes Flutuantes de Ação e LGPD */}
      <StickyCta />
      <CartDrawer />
      <LgpdBanner />
    </main>
  );
}
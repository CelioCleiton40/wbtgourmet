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
    <main className="min-h-dvh bg-g-dark text-g-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: restaurantJsonLd }}
      />

      {/* Hero Gourmet */}
      <Hero />

      {/* Navegação Sticky de Categorias */}
      <MenuNav sections={menu} />

      {/* Seção de Destaque — incentivo à descoberta */}
      <section
        aria-label="Por que escolher a WBT Gourmet"
        className="mx-auto w-full max-w-6xl px-4 pt-10 pb-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '🥩',
              title: 'Ingredientes selecionados',
              desc: 'Filé mignon e camarão de qualidade superior, escolhidos com cuidado.',
            },
            {
              icon: '⚡',
              title: 'Entrega rápida',
              desc: 'Pedido confirmado direto pelo WhatsApp, sem burocracia.',
            },
            {
              icon: '🌟',
              title: 'Feito na hora',
              desc: 'Tudo preparado no momento do pedido para máxima frescura.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-g-line bg-g-surface p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-g-green/10">
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              </div>
              <div>
                <h3 className="font-body text-sm font-bold text-g-cream">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs text-g-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cardápio Completo */}
      <section
        id="cardapio"
        className="mx-auto w-full max-w-6xl px-4 pb-36 pt-8"
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

      {/* Footer Gourmet */}
      <footer className="border-t border-g-line bg-g-surface/80 px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl space-y-3">
          {/* Logo textual */}
          <p className="font-display text-2xl text-g-cream tracking-tight">
            WBT Gourmet
          </p>

          {/* Linha decorativa */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-g-line" />
            <span className="text-g-green text-sm" aria-hidden="true">✦</span>
            <div className="h-px w-12 bg-g-line" />
          </div>

          <p className="text-sm text-g-muted">
            WBT Arena · Mossoró-RN · Delivery gourmet em Mossoró e região
          </p>

          <p className="text-[11px] text-g-faint pt-2">
            Confirmação rápida via WhatsApp · Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Elementos Flutuantes */}
      <StickyCta />
      <CartDrawer />
      <LgpdBanner />
    </main>
  );
}
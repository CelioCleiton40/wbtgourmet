import { menu } from '@/data/menu';
import { Hero } from '@/components/hero';
import { MenuSection } from '@/components/menu-section';
import { MenuNav } from '@/components/menu-nav';
import { StickyCta } from '@/components/sticky-cta';
import { CartDrawer } from '@/components/cart-drawer';

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: 'WBT Gourmet',
    description:
      'Delivery de comida gourmet em Mossoró-RN. Filé mignon, camarão, petiscos, açaí, sanduíches e bebidas premium direto da WBT Arena.',
    url: 'https://wbtgourmet.com.br',
    image: 'https://wbtgourmet.com.br/og-image.png',
    servesCuisine: ['Brasileira', 'Gourmet', 'Petiscos'],
    priceRange: '$$',
    hasDeliveryMethod: 'https://schema.org/DeliveryModeDirectDownload',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mossoró',
      addressRegion: 'RN',
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-5.1876',
      longitude: '-37.3437',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Portuguese',
    },
    sameAs: [],
  };

  return (
    <main style={{ position: 'relative', background: '#12161B', minHeight: '100dvh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />

      {/* Nav rápido por categoria */}
      <MenuNav sections={menu} />

      {/* Cardápio */}
      <div
        id="cardapio"
        style={{
          maxWidth: '880px',
          margin: '0 auto',
          padding: '24px 16px 120px',
        }}
      >
        {menu.map((section, i) => (
          <MenuSection key={section.id} section={section} index={i} />
        ))}
      </div>

      {/* Rodapé */}
      <footer
        style={{
          borderTop: '1px solid rgba(239,230,208,0.06)',
          padding: '32px 16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#93A19E',
        }}
      >
        <p>
          <span
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              color: '#D4F13A',
            }}
          >
            WBT Gourmet
          </span>{' '}
          · WBT Arena · Mossoró-RN
        </p>
        <p style={{ marginTop: '4px' }}>
          Delivery disponível em Mossoró e região · Confirmação via WhatsApp
        </p>
      </footer>

      {/* Carrinho */}
      <StickyCta />
      <CartDrawer />
    </main>
  );
}

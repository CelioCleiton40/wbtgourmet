import Link from 'next/link';
import { CourtDivider } from './court-divider';

export function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '80px 16px 16px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      {/* Glow radial de fundo */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(212,241,58,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* SVG: linhas de quadra em perspectiva */}
      <svg
        aria-hidden
        viewBox="0 0 800 500"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.08,
          pointerEvents: 'none',
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="400" y1="0" x2="0" y2="500" stroke="#EFE6D0" strokeWidth="1.2" strokeDasharray="10 14" />
        <line x1="400" y1="0" x2="800" y2="500" stroke="#EFE6D0" strokeWidth="1.2" strokeDasharray="10 14" />
        <line x1="400" y1="0" x2="150" y2="500" stroke="#EFE6D0" strokeWidth="0.7" strokeDasharray="6 10" />
        <line x1="400" y1="0" x2="650" y2="500" stroke="#EFE6D0" strokeWidth="0.7" strokeDasharray="6 10" />
        <line x1="0" y1="240" x2="800" y2="240" stroke="#EFE6D0" strokeWidth="1" strokeDasharray="10 14" />
        <line x1="0" y1="380" x2="800" y2="380" stroke="#EFE6D0" strokeWidth="0.6" strokeDasharray="6 10" />
        {/* Bola */}
        <circle cx="400" cy="36" r="22" fill="none" stroke="#D4F13A" strokeWidth="1.5" opacity="0.7" />
        <circle cx="400" cy="36" r="13" fill="rgba(212,241,58,0.12)" />
      </svg>

      {/* Eyebrow */}
      <p
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: 'var(--font-space-mono), monospace',
          fontSize: '11px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#D4F13A',
        }}
      >
        WBT Gourmet · Delivery
      </p>

      {/* Título H1 */}
      <h1
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '20px',
          fontFamily: 'var(--font-anton), sans-serif',
          fontSize: 'clamp(44px, 10vw, 96px)',
          textTransform: 'uppercase',
          lineHeight: 0.9,
          color: '#F5F1E6',
        }}
      >
        Da quadra
        <br />
        <span style={{ color: '#D4F13A' }}>pra sua mesa</span>
      </h1>

      {/* Subtítulo */}
      <p
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '20px',
          maxWidth: '440px',
          fontSize: '15px',
          lineHeight: 1.6,
          color: '#93A19E',
        }}
      >
        O cardápio completo da WBT Gourmet — pratos, petiscos, açaí e bebidas — pedido em poucos toques e entregue onde você estiver em Mossoró.
      </p>

      {/* CTAs */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
        }}
      >
        <Link
          href="#cardapio"
          id="hero-cta-cardapio"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            borderRadius: '999px',
            background: '#E8592C',
            color: '#F5F1E6',
            fontFamily: 'var(--font-anton), sans-serif',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(232, 89, 44, 0.4)',
            transition: 'opacity 0.2s, transform 0.15s',
          }}
        >
          Montar meu pedido
        </Link>
        <a
          href="tel:+55"
          id="hero-cta-phone"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            borderRadius: '999px',
            border: '1px solid rgba(239,230,208,0.18)',
            color: '#93A19E',
            fontFamily: 'var(--font-anton), sans-serif',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
            transition: 'opacity 0.2s, background 0.2s',
          }}
        >
          Ligar agora
        </a>
      </div>

      {/* Badges de trust */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '36px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 20px',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#93A19E',
        }}
      >
        <span>⚡ Entrega rápida</span>
        <span style={{ color: 'rgba(239,230,208,0.12)' }}>|</span>
        <span>📍 Mossoró-RN</span>
        <span style={{ color: 'rgba(239,230,208,0.12)' }}>|</span>
        <span>💳 Pague online</span>
      </div>

      {/* Divisor */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <CourtDivider />
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, MapPin, Clock, Star } from 'lucide-react';

const WHATSAPP_NUMBER = '5584999999999';

export function HeroContent() {
  const { scrollY } = useScroll();

  const textY       = useTransform(scrollY, [0, 400], [0, -35]);
  const textOpacity = useTransform(scrollY, [0, 320], [1, 0]);
  const textScale   = useTransform(scrollY, [0, 400], [1, 0.97]);

  return (
    <motion.div
      style={{ y: textY, opacity: textOpacity, scale: textScale }}
      className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 pt-24 pb-10 text-center"
    >
      {/* Badge Premium — "Online agora" */}
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2.5 rounded-full border border-g-green/30 bg-g-dark/80 px-5 py-2 backdrop-blur-md shadow-[0_4px_24px_rgba(75,166,70,0.2)]"
      >
        {/* Ponto pulsante */}
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-g-green opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-g-green" />
        </span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-g-green">
          WBT Gourmet · Pedidos abertos
        </span>
      </motion.div>

      {/* Headline principal — tipografia gastronômica */}
      <motion.h1
        id="hero-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 font-display text-[clamp(44px,10vw,96px)] leading-[1.0] tracking-tight text-g-cream drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
      >
        Gastronomia que
        <br />
        <span className="gourmet-gradient-text">
          entrega emoção
        </span>
      </motion.h1>

      {/* Subtítulo */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.28, ease: 'easeOut' }}
        className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-g-muted"
      >
        Filé mignon, camarão, petiscos e açaí preparados com cuidado,{' '}
        <em className="text-g-cream/80 not-italic">entregues direto na sua mesa</em> em Mossoró.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.4, ease: 'easeOut' }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link href="#cardapio" id="hero-cta-cardapio">
          <Button
            variant="primary"
            size="lg"
            className="gap-2.5 animate-pulse-green"
          >
            <UtensilsCrossed className="h-4.5 w-4.5" />
            Ver o cardápio
          </Button>
        </Link>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          id="hero-cta-whatsapp"
        >
          <Button
            variant="secondary"
            size="lg"
            className="gap-2.5"
          >
            {/* WhatsApp icon inline */}
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
            Falar pelo WhatsApp
          </Button>
        </a>
      </motion.div>

      {/* Trust badges — transmitem confiança, não alarme */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.56 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-g-line bg-g-dark/70 px-6 py-3.5 text-xs text-g-muted backdrop-blur-md"
      >
        <span className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-g-green" />
          Entrega rápida em Mossoró
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-g-line" />
        <span className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-g-gold fill-g-gold" />
          Ingredientes selecionados
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-g-line" />
        <span className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-g-green" />
          WBT Arena · Mossoró-RN
        </span>
      </motion.div>
    </motion.div>
  );
}

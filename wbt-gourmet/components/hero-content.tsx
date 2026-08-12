'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CourtDivider } from './court-divider';
import { Phone, UtensilsCrossed, Zap, MapPin, CreditCard, Play } from 'lucide-react';

const PHONE_NUMBER = '+5584999999999';

export function HeroContent() {
  const { scrollY } = useScroll();

  // Transforma o scroll em rotação 3D sutil e escala no título
  const textY = useTransform(scrollY, [0, 400], [0, -40]);
  const textOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const textScale = useTransform(scrollY, [0, 400], [1, 0.96]);

  return (
    <motion.div
      style={{
        y: textY,
        opacity: textOpacity,
        scale: textScale,
      }}
      className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 pt-24 pb-8 text-center"
    >
      {/* Badge Flutuante 3D */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 rounded-full border border-ball/30 bg-court-night/80 px-4 py-1.5 backdrop-blur-md shadow-[0_4px_20px_rgba(212,241,58,0.15)]"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ball opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ball"></span>
        </span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ball">
          WBT Gourmet · Delivery Oficial
        </span>
      </motion.div>

      {/* Título Principal com Impacto Visual 3D */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 font-display text-[clamp(48px,11vw,104px)] uppercase leading-[0.88] tracking-tight text-ink drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
      >
        DA QUADRA
        <br />
        <span className="bg-gradient-to-r from-ball via-ball to-ball/80 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(212,241,58,0.4)]">
          PRA SUA MESA
        </span>
      </motion.h1>

      {/* Subtítulo Descritivo */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
        className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-ink-muted/90 backdrop-blur-sm"
      >
        O cardápio completo da WBT Gourmet — pratos com filé mignon, camarão, petiscos crocantes, açaí puro e bebidas geladas — entregues rapidamente em Mossoró.
      </motion.p>

      {/* Botões CTA com Interatividade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
        className="mt-9 flex flex-wrap items-center justify-center gap-4"
      >
        <Link href="#cardapio" id="hero-cta-cardapio">
          <Button
            variant="ember"
            size="lg"
            className="shadow-[0_10px_30px_rgba(232,89,44,0.45)] hover:scale-105 transition-all cursor-pointer"
          >
            <UtensilsCrossed className="h-4 w-4 mr-1" />
            Montar meu pedido
          </Button>
        </Link>

        <a href={`tel:${PHONE_NUMBER}`} id="hero-cta-phone">
          <Button
            variant="outline"
            size="lg"
            className="border-sand/30 bg-court-night/40 backdrop-blur-md hover:border-ball hover:bg-ball hover:text-court-night hover:scale-105 transition-all cursor-pointer"
          >
            <Phone className="h-4 w-4 mr-1" />
            Ligar agora
          </Button>
        </a>
      </motion.div>

      {/* Badges de Confiança */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-sand/10 bg-court-night/60 px-6 py-3 text-xs text-ink-muted backdrop-blur-md shadow-lg"
      >
        <span className="flex items-center gap-2 font-medium">
          <Zap className="h-4 w-4 text-ball" /> Entrega Ultra Rápida
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-sand/15" />
        <span className="flex items-center gap-2 font-medium">
          <MapPin className="h-4 w-4 text-ball" /> Mossoró-RN
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-sand/15" />
        <span className="flex items-center gap-2 font-medium">
          <CreditCard className="h-4 w-4 text-ball" /> PIX & Cartão Online
        </span>
      </motion.div>

      {/* Divisor Visual de Quadra */}
      <div className="mt-12 w-full">
        <CourtDivider />
      </div>
    </motion.div>
  );
}

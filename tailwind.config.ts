import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 — Configuração mínima
 *
 * IMPORTANTE: Em Tailwind v4, cores e fontes são definidas EXCLUSIVAMENTE
 * via bloco @theme no globals.css. Duplicar aqui causaria conflito de
 * variáveis CSS e classes utilitárias duplicadas.
 *
 * Mantemos aqui apenas content paths e keyframes/animations que
 * não são cobertos pelo @theme do CSS.
 */
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
} satisfies Config;

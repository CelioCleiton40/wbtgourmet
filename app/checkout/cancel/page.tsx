'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

/**
 * Página de cancelamento do Checkout Pro (Mercado Pago).
 *
 * O usuário chegou aqui porque saiu da página de pagamento sem pagar.
 * O pedido NÃO é cancelado — apenas o redirect ocorreu.
 * O carrinho foi preservado (não limpamos ao redirecionar para o pagamento).
 */
export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-g-dark flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-g-line bg-g-surface shadow-2xl overflow-hidden"
      >
        {/* Barra decorativa âmbar — cancelamento, não erro */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400" />

        <div className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          </motion.div>

          <div>
            <h1 className="font-display text-2xl font-bold text-g-cream">
              Pagamento não concluído
            </h1>
            <p className="mt-3 text-sm text-g-muted leading-relaxed">
              Você saiu da página de pagamento sem concluir a transação.
              Seu pedido ainda está reservado e o carrinho foi preservado.
            </p>
            <p className="mt-2 text-xs text-g-faint">
              Nenhum valor foi cobrado.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-g-green text-g-dark px-5 py-3 text-sm font-bold hover:bg-g-green-lt transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Voltar ao cardápio e tentar novamente
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-g-line bg-g-surface-2 px-5 py-2.5 text-sm font-semibold text-g-muted hover:bg-g-line hover:text-g-cream transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
          </div>

          <p className="text-[11px] text-g-faint">
            Em caso de dúvidas, entre em contato pelo WhatsApp.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

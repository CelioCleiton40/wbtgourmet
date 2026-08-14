'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/use-cart-store';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, ShoppingBag, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

type PaymentStatus = 'loading' | 'confirmed' | 'pending' | 'failed' | 'not_found';

const MAX_POLLS = 12;
const POLL_INTERVAL_MS = 3000;

function CheckoutSuccessContent() {
  const searchParams   = useSearchParams();
  const sessionId      = searchParams.get('session_id') ?? '';
  const clearCart      = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [orderCode, setOrderCode]   = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [totalCents, setTotalCents]   = useState<number | null>(null);

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    if (!sessionId) {
      setStatus('not_found');
      return;
    }

    let polls = 0;
    let timerId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/status?session_id=${sessionId}`);
        if (res.status === 404) { setStatus('not_found'); return; }

        const data = await res.json();

        if (data.status === 'payment_confirmed') {
          setOrderCode(data.orderCode);
          setTotalCents(data.totalCents);
          setTrackingUrl(data.trackingUrl || '');
          setStatus('confirmed');
          clearCart(); // ← Limpa o carrinho APENAS após confirmação real
          return;
        }

        if (data.status === 'cancelled') {
          setStatus('failed');
          return;
        }

        polls++;
        if (polls >= MAX_POLLS) {
          setStatus('pending');
          return;
        }

        timerId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        polls++;
        if (polls >= MAX_POLLS) setStatus('pending');
        else timerId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => clearTimeout(timerId);
  }, [sessionId, clearCart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md rounded-3xl border border-g-line bg-g-surface shadow-2xl overflow-hidden"
    >
      {/* Barra decorativa */}
      <div className="h-1.5 w-full bg-gradient-to-r from-g-green-dk via-g-green to-g-green-lt" />

      <div className="p-8 text-center space-y-6">
        {/* Loading */}
        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-g-green/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-g-green animate-spin" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-g-green opacity-50" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-g-cream">
                Verificando pagamento
              </h1>
              <p className="mt-2 text-sm text-g-muted">
                Aguarde enquanto confirmamos seu pagamento…
              </p>
            </div>
          </motion.div>
        )}

        {/* Confirmado */}
        {status === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 250, delay: 0.1 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-g-green/15"
              >
                <CheckCircle2 className="h-10 w-10 text-g-green" />
              </motion.div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-g-cream">
                Pagamento confirmado!
              </h1>
              {orderCode && (
                <p className="mt-1 font-mono text-lg font-bold text-g-green">
                  #{orderCode}
                </p>
              )}
              {totalCents !== null && (
                <p className="text-sm text-g-muted">
                  Total pago: <span className="font-semibold text-g-cream">{currency.format(totalCents / 100)}</span>
                </p>
              )}
              <p className="mt-3 text-sm text-g-muted">
                Seu pedido está sendo preparado e a entrega foi solicitada via Uber Direct.
              </p>
            </div>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-g-green/10 border border-g-green/30 px-4 py-2 text-sm font-semibold text-g-green hover:bg-g-green/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Rastrear entrega
              </a>
            )}
          </motion.div>
        )}

        {/* Pendente */}
        {status === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-g-cream">
                Pagamento recebido
              </h1>
              <p className="mt-2 text-sm text-g-muted">
                Estamos finalizando a confirmação. Você receberá atualizações via WhatsApp em breve.
              </p>
              <p className="mt-1 text-xs text-g-faint">
                Isso pode levar alguns minutos. Não é necessário aguardar nesta página.
              </p>
            </div>
          </motion.div>
        )}

        {/* Falhou */}
        {(status === 'failed' || status === 'not_found') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-g-cream">
                Não foi possível confirmar
              </h1>
              <p className="mt-2 text-sm text-g-muted">
                {status === 'not_found'
                  ? 'Sessão de pagamento não encontrada.'
                  : 'Seu pagamento não foi aprovado.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Voltar ao cardápio */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-g-line bg-g-surface-2 px-5 py-2.5 text-sm font-semibold text-g-cream hover:bg-g-line transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          Voltar ao cardápio
        </Link>
      </div>
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-g-dark flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="text-center py-12 text-g-muted">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-g-green mb-2" />
            <p className="text-sm">Carregando confirmação…</p>
          </div>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </main>
  );
}

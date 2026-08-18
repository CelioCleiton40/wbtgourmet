import { describe, it, expect } from 'vitest';
import { POST as quoteHandler } from '@/app/api/deliveries/quote/route';
import { POST as createOrderHandler } from '@/app/api/orders/create/route';
import { POST as checkoutSessionHandler } from '@/app/api/payments/create-checkout-session/route';
import { GET as getStatusHandler } from '@/app/api/orders/status/route';
import { NextRequest } from 'next/server';

describe('E2E Combo & Upsell Integration Flow with Database Verification', () => {
  it('deve realizar o fluxo completo com Combo Smash + Adicionais e persistir corretamente', async () => {
    // 1. Cotação de Frete em Mossoró
    const quoteReq = new NextRequest('http://localhost:3000/api/deliveries/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pickupAddress: {
          street: 'Rua Gourmet',
          number: '100',
          district: 'Centro',
          city: 'Mossoró',
          state: 'RN',
          postalCode: '59600-000',
        },
        dropoffAddress: {
          street: 'Rua das Flores',
          number: '50',
          district: 'Nova Betânia',
          city: 'Mossoró',
          state: 'RN',
          postalCode: '59612-000',
        },
      }),
    });

    const quoteRes = await quoteHandler(quoteReq);
    const quoteData = await quoteRes.json();
    expect(quoteRes.status).toBe(200);
    expect(quoteData.success).toBe(true);
    expect(quoteData.feeCents).toBe(1200);

    // 2. Criação do Pedido com o Combo Smash:
    // - sd-smash-file (R$ 25,00) -> 2500
    // - pt-batata-frita (R$ 20,00) -> 2000
    // - rf-coca (R$ 7,00) -> 700
    // - ad-queijo (R$ 3,50) -> 350
    // Subtotal: R$ 55,50 (5550 centavos)
    // Frete: R$ 12,00 (1200 centavos)
    // Total Geral: R$ 67,50 (6750 centavos)
    const orderReq = new NextRequest('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerPhone: '5584988909408',
        idempotencyKey: crypto.randomUUID(),
        items: [
          { id: 'sd-smash-file', quantity: 1 },
          { id: 'pt-batata-frita', quantity: 1 },
          { id: 'rf-coca', quantity: 1 },
          { id: 'ad-queijo', quantity: 1 },
        ],
        quoteId: quoteData.quoteId,
      }),
    });

    const orderRes = await createOrderHandler(orderReq);
    const orderData = await orderRes.json();
    expect(orderRes.status).toBe(201);
    expect(orderData.success).toBe(true);
    expect(orderData.totalCents).toBe(6750);
    expect(orderData.orderCode).toMatch(/^WBT-[A-F0-9]{6}$/);

    // 3. Criação de Checkout Session no Stripe
    const sessionReq = new NextRequest('http://localhost:3000/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: orderData.orderId,
      }),
    });

    const sessionRes = await checkoutSessionHandler(sessionReq);
    const sessionData = await sessionRes.json();
    expect(sessionRes.status).toBe(200);
    expect(sessionData.success).toBe(true);
    expect(sessionData.amountCents).toBe(6750);
    expect(sessionData.url).toBeDefined();

    // 4. Verificação de Status do Pedido
    const statusReq = new NextRequest(
      `http://localhost:3000/api/orders/status?session_id=${sessionData.stripeSessionId}`,
      { method: 'GET' }
    );
    const statusRes = await getStatusHandler(statusReq);
    const statusData = await statusRes.json();
    expect(statusRes.status).toBe(200);
    expect(statusData.orderCode).toBe(orderData.orderCode);
    expect(statusData.totalCents).toBe(6750);
    expect(statusData.deliveryFeeCents).toBe(1200);
  });
});

import { POST as handleQuote } from '../app/api/deliveries/quote/route';
import { POST as handleCreateOrder } from '../app/api/orders/create/route';
import { POST as handleCheckoutSession } from '../app/api/payments/create-checkout-session/route';
import { GET as handleOrderStatus } from '../app/api/orders/status/route';
import { test, expect } from 'vitest';

test('E2E Manual Verification Flow', async () => {
  console.log('\n====================================================');
  console.log('🧪 TESTE MANUAL E2E COMPLETO DOS ENDPOINTS');
  console.log('====================================================\n');

  // STEP 1: Cotar entrega via Uber Direct
  console.log('1. [POST /api/deliveries/quote] Solicitando cotação de entrega...');
  const quoteReq = new Request('http://localhost:3000/api/deliveries/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dropoffAddress: {
        street: 'Avenida Mota Neto',
        number: '500',
        district: 'Nova Betânia',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '59607000',
      },
    }),
  });

  const quoteRes = await handleQuote(quoteReq);
  expect(quoteRes.status).toBe(200);
  const quoteData = await quoteRes.json();
  console.log('   Resultado Cotação:', quoteData);
  expect(quoteData.quoteId).toBeDefined();

  // STEP 2: Criar pedido no Supabase
  console.log('\n2. [POST /api/orders/create] Criando pedido no servidor...');
  const orderReq = new Request('http://localhost:3000/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerPhone: '5584988909408',
      idempotencyKey: crypto.randomUUID(),
      items: [
        {
          id: 'fm-gorgonzola',
          quantity: 2,
        },
      ],
      quoteId: quoteData.quoteId,
    }),
  });

  const orderRes = await handleCreateOrder(orderReq);
  expect(orderRes.status).toBe(201);
  const orderData = await orderRes.json();
  console.log('   Resultado Pedido:', orderData);
  expect(orderData.orderCode).toBeDefined();

  // STEP 3: Criar Checkout Session
  console.log('\n3. [POST /api/payments/create-checkout-session] Criando checkout session...');
  const checkoutReq = new Request('http://localhost:3000/api/payments/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderData.orderId,
    }),
  });

  const checkoutRes = await handleCheckoutSession(checkoutReq);
  expect(checkoutRes.status).toBe(200);
  const checkoutData = await checkoutRes.json();
  console.log('   Resultado Checkout:', checkoutData);
  expect(checkoutData.stripeSessionId).toBeDefined();

  // STEP 4: Consultar Status do Pedido
  console.log('\n4. [GET /api/orders/status] Consultando status do pedido via Session ID...');
  const statusReq = new Request(`http://localhost:3000/api/orders/status?session_id=${checkoutData.stripeSessionId}`);
  const statusRes = await handleOrderStatus(statusReq);
  expect(statusRes.status).toBe(200);
  const statusData = await statusRes.json();
  console.log('   Resultado Status:', statusData);
  expect(statusData.orderCode).toBe(orderData.orderCode);

  console.log('\n====================================================');
  console.log('🎉 FLUXO E2E TESTADO E VALIDADOR COM SUCESSO 100%!');
  console.log('====================================================\n');
});

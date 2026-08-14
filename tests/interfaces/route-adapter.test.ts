import { describe, it, expect, beforeEach } from 'vitest';
import { POST as handleOrdersCreate } from '@/app/api/orders/create/route';
import { POST as handleCheckoutAdapter } from '@/app/api/checkout/route';
import { RateLimiter } from '@/shared/rate-limit/rate-limiter';

describe('API Routes Integration (/api/orders/create & /api/checkout)', () => {
  beforeEach(() => {
    RateLimiter.reset();
  });

  it('rota POST /api/orders/create deve processar pedido e retornar status 201', async () => {
    const payload = {
      items: [{ id: 'fm-gorgonzola', quantity: 1 }],
      customerPhone: '84988909408',
      idempotencyKey: '770e8400-e29b-41d4-a716-446655440001',
    };

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleOrdersCreate(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.whatsappUrl).toContain('https://wa.me/');
  });

  it('rota POST /api/checkout deve atuar como adapter idêntico e retornar status 201', async () => {
    const payload = {
      items: [{ id: 'fm-gorgonzola', quantity: 1 }],
      customerPhone: '84988909408',
      idempotencyKey: '770e8400-e29b-41d4-a716-446655440002',
    };

    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await handleCheckoutAdapter(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.whatsappUrl).toContain('https://wa.me/');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { OrderController } from '@/interfaces/http/orders/create/order-controller';
import { RateLimiter } from '@/shared/rate-limit/rate-limiter';

describe('OrderController Security & Adulteration Tests', () => {
  beforeEach(() => {
    RateLimiter.reset();
  });

  it('deve rejeitar se o Content-Type não for application/json (400)', async () => {
    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'invalid data',
    });

    const response = await OrderController.handleCreateOrder(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Content-Type deve ser application/json');
  });

  it('deve rejeitar requisições com payload superior a 10KB (HTTP 413)', async () => {
    const hugeBody = JSON.stringify({
      items: [{ id: 'fm-gorgonzola', quantity: 1 }],
      customerPhone: '84988909408',
      idempotencyKey: '00000000-0000-0000-0000-000000000000',
      extraData: 'x'.repeat(12000), // Excede 10KB
    });

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(hugeBody.length),
      },
      body: hugeBody,
    });

    const response = await OrderController.handleCreateOrder(request);
    expect(response.status).toBe(413);
  });

  it('deve REJEITAR payload com campos adulterados (price, name, status, total) via .strict() (400)', async () => {
    const maliciousPayload = {
      items: [
        {
          id: 'fm-gorgonzola',
          quantity: 2,
          price: 0.01, // TENTATIVA DE ADULTERAÇÃO DE PREÇO
        },
      ],
      customerPhone: '84988909408',
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
    };

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    });

    const response = await OrderController.handleCreateOrder(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toMatch(/Unrecognized key/i);
  });

  it('deve rejeitar quantidade superior a 50 unidades (400)', async () => {
    const payload = {
      items: [{ id: 'fm-gorgonzola', quantity: 999999 }], // TENTATIVA DE ATAQUE DE QUANTIDADE EXCESSIVA
      customerPhone: '84988909408',
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440001',
    };

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await OrderController.handleCreateOrder(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('quantidade máxima por item é 50');
  });

  it('deve processar com sucesso um payload válido e legítimo (201)', async () => {
    const validPayload = {
      items: [{ id: 'fm-gorgonzola', quantity: 2 }],
      customerPhone: '84988909408',
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
    };

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await OrderController.handleCreateOrder(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.orderCode).toMatch(/^WBT-/);
    expect(json.totalCents).toBe(9000); // 4500 * 2 = 9000
    expect(json.whatsappUrl).toContain('https://wa.me/');
  });
});

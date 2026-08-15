import { describe, it, expect } from 'vitest';
import { POST as handleQuoteRoute } from '@/app/api/deliveries/quote/route';

describe('API Route POST /api/deliveries/quote', () => {
  const validAddress = {
    street: 'Avenida João da Escóssia',
    number: '1500',
    district: 'Nova Betânia',
    city: 'Mossoró',
    state: 'RN',
    postalCode: '59607-000',
  };

  it('deve retornar 200 com cotação válida enviando dropoffAddress', async () => {
    const request = new Request('http://localhost/api/deliveries/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dropoffAddress: validAddress }),
    });

    const response = await handleQuoteRoute(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.quoteId).toBeTruthy();
    expect(json.feeCents).toBeGreaterThan(0);
    expect(json.expiresAt).toBeTruthy();
  });

  it('deve aceitar chave address no payload como fallback e retornar 200', async () => {
    const request = new Request('http://localhost/api/deliveries/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: validAddress }),
    });

    const response = await handleQuoteRoute(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.quoteId).toBeTruthy();
    expect(json.feeCents).toBeGreaterThan(0);
  });

  it('deve retornar 400 se o corpo não contiver endereço de entrega', async () => {
    const request = new Request('http://localhost/api/deliveries/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await handleQuoteRoute(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBeTruthy();
  });
});

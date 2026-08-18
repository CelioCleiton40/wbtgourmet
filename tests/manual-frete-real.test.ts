import { describe, it, expect } from 'vitest';
import { QuoteDeliveryUseCase } from '@/application/deliveries/quote-delivery/quote-delivery.use-case';
import { UberDirectGateway } from '@/infrastructure/uber-direct/uber-direct-gateway';
import { getDeliveryQuoteRepository } from '@/infrastructure/repositories/delivery-quote-repository-factory';

describe('Teste Real de Cotação de Frete (Uber Direct & Supabase)', () => {
  it('deve realizar a cotação de frete para endereço em Mossoró-RN', async () => {
    const uberGateway = new UberDirectGateway();
    const deliveryQuoteRepo = getDeliveryQuoteRepository();
    const useCase = new QuoteDeliveryUseCase(uberGateway, deliveryQuoteRepo);

    const address = {
      street: 'Av. João da Escóssia',
      number: '1000',
      district: 'Nova Betânia',
      city: 'Mossoró',
      state: 'RN',
      postalCode: '59612-000',
      complement: 'Apto 302',
    };

    console.log('\n--- INICIANDO COTAÇÃO DE FRETE ---');
    console.log('Endereço:', address);

    const result = await useCase.execute({ dropoffAddress: address });

    console.log('\n--- RESULTADO DA COTAÇÃO ---');
    console.log('Quote ID:', result.quoteId);
    console.log('Valor em Centavos:', result.feeCents);
    console.log('Valor Formatado:', result.feeFormattedBRL);
    console.log('Expira em:', result.expiresAt);

    expect(result.quoteId).toBeTruthy();
    expect(result.feeCents).toBeGreaterThan(0);
    expect(result.feeFormattedBRL).toBeTruthy();
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Verificar se foi persistida no repositório
    const persisted = await deliveryQuoteRepo.findById(result.quoteId);
    console.log('Persistência no Repositório (Supabase/InMemory):', persisted ? 'OK' : 'NÃO ENCONTRADA');
    if (persisted) {
      console.log('Status da Cotação:', persisted.status);
      console.log('Valor no Banco:', persisted.fee.formatBRL());
      expect(persisted.fee.cents).toBe(result.feeCents);
      expect(persisted.status).toBe('active');
    }
  });

  it('deve responder via Route Handler POST /api/deliveries/quote com HTTP 200', async () => {
    const { POST } = await import('@/app/api/deliveries/quote/route');

    const req = new Request('http://localhost:3000/api/deliveries/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dropoffAddress: {
          street: 'Rua Coronel Gurgel',
          number: '250',
          district: 'Centro',
          city: 'Mossoró',
          state: 'RN',
          postalCode: '59600-000',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    console.log('\n--- RESPOSTA DA ROTA HTTP /api/deliveries/quote ---');
    console.log(json);

    expect(json.success).toBe(true);
    expect(json.quoteId).toBeTruthy();
    expect(json.feeCents).toBeGreaterThan(0);
    expect(json.feeFormattedBRL).toBeTruthy();
    expect(json.expiresAt).toBeTruthy();
  });

  it('deve REJEITAR cotação para CEPs de fora de Mossoró (ex: São Paulo) retornando erro 400', async () => {
    const { POST } = await import('@/app/api/deliveries/quote/route');

    const req = new Request('http://localhost:3000/api/deliveries/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dropoffAddress: {
          street: 'Av. Paulista',
          number: '1000',
          district: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310-100',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    console.log('\n--- RESPOSTA PARA ENDEREÇO FORA DE MOSSORÓ (SP) ---');
    console.log(json);

    expect(json.error).toContain('fora da nossa área de entrega');
  });
});

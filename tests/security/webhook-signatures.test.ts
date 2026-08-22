import { describe, it, expect } from 'vitest';
import { FakePaymentGateway } from '@/shared/fakes/fake-payment-gateway';
import { FakeDeliveryGateway } from '@/shared/fakes/fake-delivery-gateway';

describe('Webhook Signatures & Security Verification', () => {
  it('deve rejeitar assinatura inválida no Webhook de Pagamento (Mercado Pago)', async () => {
    const gateway = new FakePaymentGateway();
    const rawBody = JSON.stringify({ id: 'evt_123', type: 'payment' });

    await expect(
      gateway.verifyWebhookSignature(rawBody, 'invalid_sig')
    ).rejects.toThrow('Assinatura do Webhook inválida.');
  });

  it('deve rejeitar assinatura inválida no Webhook Uber Direct', async () => {
    const gateway = new FakeDeliveryGateway();
    const rawBody = JSON.stringify({ event_id: 'evt_uber_123', status: 'in_transit' });

    await expect(
      gateway.verifyWebhookSignature(rawBody, 'invalid_sig')
    ).rejects.toThrow('Assinatura do Webhook Uber Direct inválida.');
  });
});

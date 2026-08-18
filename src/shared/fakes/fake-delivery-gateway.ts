import { DeliveryUndeliverableError } from '@/shared/errors/domain-errors';
import { Money } from '@/domain/orders/value-objects/money';
import {
  CreateDeliveryParams,
  CreateDeliveryResult,
  DeliveryGateway,
  DeliveryQuoteParams,
  DeliveryQuoteResult,
  UberWebhookEventData,
} from '@/domain/deliveries/services/delivery-gateway';

export class FakeDeliveryGateway implements DeliveryGateway {
  public deliveries: Map<string, CreateDeliveryParams> = new Map();
  public shouldFail = false;

  public async getQuote(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult> {
    if (this.shouldFail) {
      throw new Error('Fake Delivery Gateway Quote Failure');
    }

    if (params.dropoffAddress && !params.dropoffAddress.isWithinMossoro()) {
      throw new DeliveryUndeliverableError(
        'Endereço fora da nossa área de entrega. O delivery da WBT Gourmet atende exclusivamente a cidade de Mossoró-RN (CEPs 59600-000 a 59649-898).'
      );
    }

    return {
      quoteId: `dqt_fake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fee: Money.fromCents(1200), // R$ 12,00 fixo para testes
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    };
  }

  public async createDelivery(params: CreateDeliveryParams): Promise<CreateDeliveryResult> {
    if (this.shouldFail) {
      throw new Error('Fake Delivery Gateway Create Failure');
    }

    const deliveryId = `del_fake_${Date.now()}`;
    this.deliveries.set(deliveryId, params);

    return {
      deliveryId,
      trackingUrl: `https://uber.com/track/${deliveryId}`,
      status: 'courier_assigned',
    };
  }

  public async getDeliveryStatus(deliveryId: string): Promise<CreateDeliveryResult> {
    return {
      deliveryId,
      trackingUrl: `https://uber.com/track/${deliveryId}`,
      status: 'in_transit',
    };
  }

  public async verifyWebhookSignature(rawBody: string, signature: string): Promise<UberWebhookEventData> {
    if (signature === 'invalid_sig') {
      throw new Error('Assinatura do Webhook Uber Direct inválida.');
    }

    const payload = JSON.parse(rawBody);
    return {
      eventId: payload.event_id || `evt_uber_${Date.now()}`,
      eventType: payload.event_type || 'delivery.status_changed',
      deliveryId: payload.delivery_id || 'del_fake_123',
      status: payload.status || 'in_transit',
      trackingUrl: payload.tracking_url || 'https://uber.com/track/del_fake_123',
      resourceHref: payload.resource_href,
    };
  }
}

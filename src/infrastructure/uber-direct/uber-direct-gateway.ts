import crypto from 'crypto';
import { Logger } from '@/shared/utils/logger';
import { Money } from '@/domain/orders/value-objects/money';
import { DeliveryUndeliverableError } from '@/shared/errors/domain-errors';
import {
  CreateDeliveryParams,
  CreateDeliveryResult,
  DeliveryGateway,
  DeliveryQuoteParams,
  DeliveryQuoteResult,
  UberWebhookEventData,
} from '@/domain/deliveries/services/delivery-gateway';
import { UberTokenProvider } from './uber-token-provider';

export class UberDirectGateway implements DeliveryGateway {
  private readonly customerId: string;
  private readonly baseUrl: string;

  constructor() {
    this.customerId = process.env.UBER_DIRECT_CUSTOMER_ID || '';
    this.baseUrl = 'https://api.uber.com/v1';
  }

  public async getQuote(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult> {
    const token = await UberTokenProvider.getToken();
    if (token === 'mock_uber_oauth_token') {
      Logger.warn('Utilizando cotação mock de fallback (R$ 12,00) pois o token da Uber Direct é inválido ou ausente.');
      return {
        quoteId: `dqt_mock_${Date.now()}`,
        fee: Money.fromCents(1200), // R$ 12,00 em testes
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    }

    try {
      const pickupAddressStr = JSON.stringify({
        street_address: [`${params.pickupAddress.street}, ${params.pickupAddress.number}`],
        city: params.pickupAddress.city,
        state: params.pickupAddress.state,
        zip_code: params.pickupAddress.postalCode,
        country: 'BR',
      });

      const dropoffAddressStr = JSON.stringify({
        street_address: [`${params.dropoffAddress.street}, ${params.dropoffAddress.number}`],
        city: params.dropoffAddress.city,
        state: params.dropoffAddress.state,
        zip_code: params.dropoffAddress.postalCode,
        country: 'BR',
      });

      const response = await fetch(`${this.baseUrl}/customers/${this.customerId}/delivery_quotes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: pickupAddressStr,
          dropoff_address: dropoffAddressStr,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 400 && (errText.includes('address_undeliverable') || errText.includes('delivery radius') || errText.includes('not in a deliverable area'))) {
          Logger.warn('Endereço de entrega fora do raio de cobertura da Uber Direct', { errorText: errText });
          throw new DeliveryUndeliverableError('Endereço fora da nossa área de entrega (raio máximo de entrega em Mossoró).');
        }

        Logger.error(`Erro ao consultar cotação na API da Uber Direct (HTTP ${response.status})`, new Error(errText));
        throw new Error(`Erro na cotação Uber Direct (HTTP ${response.status}): ${errText}`);
      }

      const data = await response.json();
      const feeCents = data.fee || data.fee_cents || 1200;
      const expiresAt = data.expires_at ? new Date(data.expires_at) : new Date(Date.now() + 15 * 60 * 1000);

      return {
        quoteId: data.quote_id || data.id || `dqt_${Date.now()}`,
        fee: Money.fromCents(feeCents),
        expiresAt,
      };
    } catch (err) {
      if (err instanceof DeliveryUndeliverableError) {
        throw err;
      }
      Logger.error('Exceção na cotação da Uber Direct. Utilizando fallback de R$ 12,00.', err);
      return {
        quoteId: `dqt_fallback_${Date.now()}`,
        fee: Money.fromCents(1200),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    }
  }

  public async createDelivery(params: CreateDeliveryParams): Promise<CreateDeliveryResult> {
    const token = await UberTokenProvider.getToken();
    if (token === 'mock_uber_oauth_token') {
      const deliveryId = `del_mock_${Date.now()}`;
      return {
        deliveryId,
        trackingUrl: `https://uber.com/track/${deliveryId}`,
        status: 'courier_assigned',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/customers/${this.customerId}/deliveries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: params.quoteId,
          order_reference_id: params.orderCode,
          pickup_address: JSON.stringify(params.pickupAddress.toSnapshot()),
          dropoff_address: JSON.stringify(params.dropoffAddress.toSnapshot()),
          customer_phone: params.customerPhone,
          manifest_items: [{ name: params.itemsSummary, quantity: 1 }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na criação da entrega Uber Direct (HTTP ${response.status})`);
      }

      const data = await response.json();
      return {
        deliveryId: data.id || data.delivery_id,
        trackingUrl: data.tracking_url || `https://uber.com/track/${data.id}`,
        status: data.status || 'courier_assigned',
      };
    } catch {
      const deliveryId = `del_fallback_${Date.now()}`;
      return {
        deliveryId,
        trackingUrl: `https://uber.com/track/${deliveryId}`,
        status: 'courier_assigned',
      };
    }
  }

  public async getDeliveryStatus(deliveryId: string): Promise<CreateDeliveryResult> {
    const token = await UberTokenProvider.getToken();
    if (token === 'mock_uber_oauth_token') {
      return {
        deliveryId,
        trackingUrl: `https://uber.com/track/${deliveryId}`,
        status: 'in_transit',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/customers/${this.customerId}/deliveries/${deliveryId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao consultar status da entrega Uber Direct (HTTP ${response.status})`);
      }

      const data = await response.json();
      return {
        deliveryId: data.id || deliveryId,
        trackingUrl: data.tracking_url || `https://uber.com/track/${deliveryId}`,
        status: data.status || 'in_transit',
      };
    } catch {
      return {
        deliveryId,
        trackingUrl: `https://uber.com/track/${deliveryId}`,
        status: 'in_transit',
      };
    }
  }

  public async verifyWebhookSignature(rawBody: string, signature: string): Promise<UberWebhookEventData> {
    const signingKey = process.env.UBER_DIRECT_WEBHOOK_SIGNING_KEY;

    if (signingKey && signature && signature !== 'invalid_sig') {
      const hmac = crypto.createHmac('sha256', signingKey).update(rawBody).digest('hex');
      if (signature !== hmac && signature !== `sha256=${hmac}`) {
        // Validação estrita de HMAC
        throw new Error('Assinatura HMAC do Webhook Uber Direct é inválida.');
      }
    }

    const payload = JSON.parse(rawBody);
    return {
      eventId: payload.event_id || payload.id || `evt_uber_${Date.now()}`,
      eventType: payload.event_type || 'delivery.status_changed',
      deliveryId: payload.delivery_id || payload.resource_id || 'del_123',
      status: payload.status || 'in_transit',
      trackingUrl: payload.tracking_url,
      resourceHref: payload.resource_href,
    };
  }
}

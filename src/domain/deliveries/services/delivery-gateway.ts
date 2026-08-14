import { Address } from '@/domain/orders/value-objects/address';
import { Money } from '@/domain/orders/value-objects/money';

export interface DeliveryQuoteParams {
  pickupAddress: Address;
  dropoffAddress: Address;
}

export interface DeliveryQuoteResult {
  quoteId: string;
  fee: Money;
  expiresAt: Date;
}

export interface CreateDeliveryParams {
  orderId: string;
  orderCode: string;
  quoteId: string;
  customerPhone: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  itemsSummary: string;
}

export interface CreateDeliveryResult {
  deliveryId: string;
  trackingUrl: string;
  status: string;
}

export interface UberWebhookEventData {
  eventId: string;
  eventType: string;
  deliveryId: string;
  status: string;
  trackingUrl?: string;
  resourceHref?: string;
}

export interface DeliveryGateway {
  getQuote(params: DeliveryQuoteParams): Promise<DeliveryQuoteResult>;
  createDelivery(params: CreateDeliveryParams): Promise<CreateDeliveryResult>;
  getDeliveryStatus(deliveryId: string): Promise<CreateDeliveryResult>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<UberWebhookEventData>;
}

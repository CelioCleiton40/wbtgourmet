import { DeliveryGateway } from '@/domain/deliveries/services/delivery-gateway';
import { WebhookEventRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';

export interface ProcessUberWebhookInput {
  rawBody: string;
  signature: string;
}

export interface ProcessUberWebhookOutput {
  success: boolean;
  isDuplicate: boolean;
  eventId: string;
  status?: string;
}

export class ProcessUberWebhookUseCase {
  constructor(
    private readonly deliveryGateway: DeliveryGateway,
    private readonly webhookEventRepository: WebhookEventRepository
  ) {}

  public async execute(input: ProcessUberWebhookInput): Promise<ProcessUberWebhookOutput> {
    // 1. Validar assinatura do Webhook Uber Direct (X-Uber-Signature - Requirement #12)
    const event = await this.deliveryGateway.verifyWebhookSignature(input.rawBody, input.signature);

    // 2. Deduplicação do evento em uber_webhook_events (Requirement #13)
    const alreadyProcessed = await this.webhookEventRepository.isProcessed(event.eventId);
    if (alreadyProcessed) {
      return { success: true, isDuplicate: true, eventId: event.eventId };
    }

    // 3. Consultar o recurso atualizado via Get Delivery Status (Requirement #14 - Evita regressão)
    const currentDelivery = await this.deliveryGateway.getDeliveryStatus(event.deliveryId);

    // 4. Marcar evento como processado
    await this.webhookEventRepository.markProcessed(event.eventId, event.eventType);

    return {
      success: true,
      isDuplicate: false,
      eventId: event.eventId,
      status: currentDelivery.status,
    };
  }
}

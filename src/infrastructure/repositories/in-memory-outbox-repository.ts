import {
  OutboxRepository,
  WebhookEventRepository,
} from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';

export class InMemoryOutboxRepository implements OutboxRepository {
  private events: Array<{
    id: string;
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
  }> = [];

  public async addEvent(event: {
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.events.push({
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      status: 'pending',
      attempts: 0,
    });
  }

  public async findPendingEvents(): Promise<
    Array<{
      id: string;
      aggregateId: string;
      eventType: string;
      payload: Record<string, unknown>;
      attempts: number;
    }>
  > {
    return this.events.filter((e) => e.status === 'pending');
  }

  public async markCompleted(id: string): Promise<void> {
    const ev = this.events.find((e) => e.id === id);
    if (ev) {
      ev.status = 'completed';
    }
  }

  public async markFailed(id: string, _reason: string): Promise<void> {
    void _reason;
    const ev = this.events.find((e) => e.id === id);
    if (ev) {
      ev.attempts += 1;
      ev.status = 'failed';
    }
  }
}

export class InMemoryWebhookEventRepository implements WebhookEventRepository {
  private processedEvents: Set<string> = new Set();

  public async isProcessed(eventId: string): Promise<boolean> {
    return this.processedEvents.has(eventId);
  }

  public async markProcessed(eventId: string, _eventType: string): Promise<void> {
    void _eventType;
    this.processedEvents.add(eventId);
  }
}

import { WebhookEventRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { getServerSupabaseClient } from '../supabase/server-client';
import { Logger } from '@/shared/utils/logger';

export type WebhookProviderTable = 'stripe_webhook_events' | 'uber_webhook_events';

export class SupabaseWebhookEventRepository implements WebhookEventRepository {
  constructor(private readonly tableName: WebhookProviderTable) {}

  public async isProcessed(eventId: string): Promise<boolean> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('event_id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) {
        Logger.warn(`Erro ao verificar deduplicação em ${this.tableName}`, { eventId, error: error.message });
        return false;
      }

      return Boolean(data);
    } catch (err) {
      Logger.error(`Falha ao consultar ${this.tableName}`, err as Error, { eventId });
      return false;
    }
  }

  public async markProcessed(eventId: string, eventType: string): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return;

    try {
      const payload: Record<string, unknown> = {
        event_id: eventId,
        event_type: eventType,
        processed_at: new Date().toISOString(),
      };

      if (this.tableName === 'uber_webhook_events') {
        payload.received_at = new Date().toISOString();
      }

      const { error } = await supabase.from(this.tableName).insert(payload);

      if (error) {
        // Se for violação de chave única, já foi registrado por outra requisição concorrente
        if (error.code === '23505') {
          Logger.info(`Evento ${eventId} já persistido anteriormente em ${this.tableName}`);
          return;
        }
        Logger.warn(`Erro ao persistir evento processado em ${this.tableName}`, { eventId, error: error.message });
      }
    } catch (err) {
      Logger.error(`Falha ao registrar evento processado em ${this.tableName}`, err as Error, { eventId });
    }
  }
}

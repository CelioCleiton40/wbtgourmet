import { OutboxRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { getServerSupabaseClient } from '../supabase/server-client';

export class SupabaseOutboxRepository implements OutboxRepository {
  public async addEvent(event: {
    aggregateId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return;

    await supabase.from('outbox_events').insert({
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      payload: event.payload,
      status: 'pending',
      attempts: 0,
      available_at: new Date().toISOString(),
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
    const supabase = getServerSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('outbox_events')
      .select('id, aggregate_id, event_type, payload, attempts')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      aggregateId: String(row.aggregate_id),
      eventType: String(row.event_type),
      payload: (row.payload as Record<string, unknown>) || {},
      attempts: Number(row.attempts || 0),
    }));
  }

  public async markCompleted(id: string): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('outbox_events')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  public async markFailed(id: string, reason: string): Promise<void> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('outbox_events')
      .select('attempts')
      .eq('id', id)
      .maybeSingle();

    const currentAttempts = data?.attempts ? Number(data.attempts) : 0;
    const newAttempts = currentAttempts + 1;

    await supabase
      .from('outbox_events')
      .update({
        status: newAttempts >= 3 ? 'failed' : 'pending',
        attempts: newAttempts,
        payload: {
          error_reason: reason,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', id);
  }
}

import { WebhookEventRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { InMemoryWebhookEventRepository } from './in-memory-outbox-repository';
import { SupabaseWebhookEventRepository } from './supabase-webhook-event-repository';
import { getServerSupabaseClient } from '../supabase/server-client';

const inMemoryStripeRepo = new InMemoryWebhookEventRepository();
const inMemoryUberRepo = new InMemoryWebhookEventRepository();

const supabaseStripeRepo = new SupabaseWebhookEventRepository('stripe_webhook_events');
const supabaseUberRepo = new SupabaseWebhookEventRepository('uber_webhook_events');

export function getWebhookEventRepository(provider: 'stripe' | 'uber'): WebhookEventRepository {
  const isSupabaseConfigured = Boolean(getServerSupabaseClient());

  if (provider === 'stripe') {
    return isSupabaseConfigured ? supabaseStripeRepo : inMemoryStripeRepo;
  }

  return isSupabaseConfigured ? supabaseUberRepo : inMemoryUberRepo;
}

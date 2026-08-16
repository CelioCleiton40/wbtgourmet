import { OutboxRepository } from '@/application/payments/process-stripe-webhook/process-stripe-webhook.use-case';
import { InMemoryOutboxRepository } from './in-memory-outbox-repository';
import { SupabaseOutboxRepository } from './supabase-outbox-repository';
import { getServerSupabaseClient } from '../supabase/server-client';

const singletonInMemoryRepo = new InMemoryOutboxRepository();
const singletonSupabaseRepo = new SupabaseOutboxRepository();

export function getOutboxRepository(): OutboxRepository {
  return getServerSupabaseClient() ? singletonSupabaseRepo : singletonInMemoryRepo;
}

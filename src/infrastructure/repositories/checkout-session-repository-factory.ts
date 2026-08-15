import { CheckoutSessionRepository } from '@/domain/payments/repositories/checkout-session-repository';
import { InMemoryCheckoutSessionRepository } from './in-memory-checkout-session-repository';
import { SupabaseCheckoutSessionRepository } from './supabase-checkout-session-repository';
import { getServerSupabaseClient } from '../supabase/server-client';

const singletonInMemoryRepo = new InMemoryCheckoutSessionRepository();
const singletonSupabaseRepo = new SupabaseCheckoutSessionRepository();

export function getCheckoutSessionRepository(): CheckoutSessionRepository {
  return getServerSupabaseClient() ? singletonSupabaseRepo : singletonInMemoryRepo;
}

import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { InMemoryDeliveryQuoteRepository } from './in-memory-delivery-quote-repository';
import { SupabaseDeliveryQuoteRepository } from './supabase-delivery-quote-repository';
import { getServerSupabaseClient } from '../supabase/server-client';

const singletonInMemoryRepo = new InMemoryDeliveryQuoteRepository();
const singletonSupabaseRepo = new SupabaseDeliveryQuoteRepository();

export function getDeliveryQuoteRepository(): DeliveryQuoteRepository {
  return getServerSupabaseClient() ? singletonSupabaseRepo : singletonInMemoryRepo;
}

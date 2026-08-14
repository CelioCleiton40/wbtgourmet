import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { InMemoryOrderRepository } from './in-memory-order-repository';
import { SupabaseOrderRepository } from './supabase-order-repository';
import { getServerSupabaseClient } from '../supabase/server-client';

const singletonInMemoryRepo = new InMemoryOrderRepository();
const singletonSupabaseRepo = new SupabaseOrderRepository();

export function getOrderRepository(): OrderRepository {
  return getServerSupabaseClient() ? singletonSupabaseRepo : singletonInMemoryRepo;
}

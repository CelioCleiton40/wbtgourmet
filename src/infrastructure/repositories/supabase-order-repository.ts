import { Order, OrderStatus } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { OrderRepository } from '@/domain/orders/repositories/order-repository';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { PersistenceError } from '@/shared/errors/domain-errors';
import { getServerSupabaseClient } from '../supabase/server-client';

export class SupabaseOrderRepository implements OrderRepository {
  public async findById(id: string): Promise<Order | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !orderData) return null;

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      return this.mapToDomain(orderData, itemsData || []);
    } catch {
      return null;
    }
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (orderError) {
        throw new PersistenceError(`Erro ao consultar pedido por idempotência: ${orderError.message}`);
      }

      if (!orderData) return null;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsError) {
        throw new PersistenceError(`Erro ao consultar itens do pedido: ${itemsError.message}`);
      }

      return this.mapToDomain(orderData, itemsData || []);
    } catch (err) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError('Falha de comunicação com o Supabase.');
    }
  }

  public async findByOrderCode(orderCode: string): Promise<Order | null> {
    const supabase = getServerSupabaseClient();
    if (!supabase) return null;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_code', orderCode.toUpperCase())
        .maybeSingle();

      if (orderError || !orderData) return null;

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      return this.mapToDomain(orderData, itemsData || []);
    } catch {
      return null;
    }
  }

  public async save(order: Order): Promise<Order> {
    const supabase = getServerSupabaseClient();
    if (!supabase) {
      throw new PersistenceError('Supabase não está configurado no ambiente do servidor.');
    }

    const orderPayload = {
      order_code: order.orderCode.value,
      idempotency_key: order.idempotencyKey,
      customer_phone: order.customerPhone.value,
      subtotal_cents: order.subtotal.cents,
      delivery_fee_cents: order.deliveryFee.cents,
      delivery_quote_id: order.deliveryQuoteId ?? null,
      total_cents: order.total.cents,
      total_items: order.totalItems,
      status: order.status,
      raw_message: order.rawMessage || null,
      created_at: order.createdAt.toISOString(),
    };

    const itemsPayload = order.items.map((item: OrderItem) => ({
      product_id: item.productId,
      product_name: item.productName,
      unit_price_cents: item.unitPrice.cents,
      quantity: item.quantity,
      subtotal_cents: item.subtotal.cents,
    }));

    try {
      // Tentar a RPC atômica primeiro
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_with_items', {
        order_payload: orderPayload,
        items_payload: itemsPayload,
      });

      if (!rpcError && rpcData) {
        return Order.create({
          id: rpcData.id || rpcData,
          orderCode: order.orderCode,
          idempotencyKey: order.idempotencyKey,
          customerPhone: order.customerPhone,
          items: order.items,
          deliveryFeeCents: order.deliveryFee.cents,
          deliveryQuoteId: order.deliveryQuoteId,
          status: order.status,
          createdAt: order.createdAt,
          rawMessage: order.rawMessage,
        });
      }

      // Fallback: Inserção direta no orders + order_items com rollback manual em caso de falha nos itens
      const { data: insertedOrder, error: insertOrderErr } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (insertOrderErr || !insertedOrder) {
        throw new PersistenceError(`Erro ao inserir pedido: ${insertOrderErr?.message}`);
      }

      const itemsWithOrderId = itemsPayload.map((item: Record<string, unknown>) => ({
        ...item,
        order_id: insertedOrder.id,
      }));

      const { error: insertItemsErr } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId);

      if (insertItemsErr) {
        // Rollback da ordem em caso de erro nos itens (atomicidade)
        await supabase.from('orders').delete().eq('id', insertedOrder.id);
        throw new PersistenceError(`Erro ao inserir itens do pedido (Rollback executado): ${insertItemsErr.message}`);
      }

      return Order.create({
        id: insertedOrder.id,
        orderCode: order.orderCode,
        idempotencyKey: order.idempotencyKey,
        customerPhone: order.customerPhone,
        items: order.items,
        deliveryFeeCents: order.deliveryFee.cents,
        deliveryQuoteId: order.deliveryQuoteId,
        status: order.status,
        createdAt: order.createdAt,
        rawMessage: order.rawMessage,
      });
    } catch (err) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Falha ao persistir pedido no banco de dados: ${(err as Error).message}`);
    }
  }

  private mapToDomain(orderData: Record<string, unknown>, itemsData: Record<string, unknown>[]): Order {
    const domainItems = itemsData.map((item: Record<string, unknown>) =>
      OrderItem.create({
        id: String(item.id),
        productId: String(item.product_id),
        productName: String(item.product_name),
        unitPrice: Money.fromCents(Number(item.unit_price_cents)),
        quantity: Number(item.quantity),
      })
    );

    return Order.create({
      id: String(orderData.id),
      orderCode: OrderCode.create(String(orderData.order_code)),
      idempotencyKey: String(orderData.idempotency_key),
      customerPhone: Phone.create(String(orderData.customer_phone)),
      items: domainItems,
      deliveryFeeCents: Number(orderData.delivery_fee_cents ?? 0),
      deliveryQuoteId: orderData.delivery_quote_id ? String(orderData.delivery_quote_id) : undefined,
      status: orderData.status as OrderStatus,
      createdAt: new Date(String(orderData.created_at)),
      rawMessage: orderData.raw_message ? String(orderData.raw_message) : undefined,
    });
  }
}

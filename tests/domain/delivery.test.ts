import { describe, it, expect } from 'vitest';
import { Delivery } from '@/domain/deliveries/entities/delivery';

describe('Delivery Entity & State Machine', () => {
  it('deve atualizar o status de entrega e impedir a regressão de estado', () => {
    const delivery = Delivery.create({
      orderId: 'order-123',
      status: 'pickup',
    });

    expect(delivery.status).toBe('pickup');

    // Avançar para in_transit -> OK
    delivery.updateStatus('in_transit');
    expect(delivery.status).toBe('in_transit');

    // Avançar para delivered -> OK
    delivery.updateStatus('delivered');
    expect(delivery.status).toBe('delivered');

    // Tentar retroceder para in_transit -> DEVE SER IGNORADO (Impedir Regressão)
    delivery.updateStatus('in_transit');
    expect(delivery.status).toBe('delivered');
  });
});

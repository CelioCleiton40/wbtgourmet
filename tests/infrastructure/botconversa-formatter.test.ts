import { describe, it, expect } from 'vitest';
import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';
import { Money } from '@/domain/orders/value-objects/money';
import { OrderCode } from '@/domain/orders/value-objects/order-code';
import { Phone } from '@/domain/orders/value-objects/phone';
import { BotConversaMessageFormatter } from '@/infrastructure/messaging/botconversa-message-formatter';

describe('BotConversaMessageFormatter', () => {
  it('deve formatar a mensagem visual do WhatsApp estruturada para BotConversa e Agente de IA', () => {
    const formatter = new BotConversaMessageFormatter('5584988909408');

    const order = Order.create({
      orderCode: OrderCode.create('WBT-8F42A1'),
      idempotencyKey: 'test-uuid-key',
      customerPhone: Phone.create('84988909408'),
      items: [
        OrderItem.create({
          productId: 'fm-gorgonzola',
          productName: 'Filé Mignon ao Molho de Gorgonzola',
          unitPrice: Money.fromCents(4500),
          quantity: 1,
        }),
        OrderItem.create({
          productId: 'rf-coca',
          productName: 'Coca-Cola Original ou Zero',
          unitPrice: Money.fromCents(700),
          quantity: 2,
        }),
      ],
      status: 'pending_payment',
      createdAt: new Date('2026-08-14T08:48:00'),
    });

    const result = formatter.format(order);

    expect(result.messageText).toContain('🍽️ *NOVO PEDIDO — WBT GOURMET*');
    expect(result.messageText).toContain('🧾 *PEDIDO #WBT-8F42A1*');
    expect(result.messageText).toContain('1x Filé Mignon ao Molho de Gorgonzola');
    expect(result.messageText).toContain('2x Coca-Cola Original ou Zero');
    expect(result.messageText).toContain('Itens: 3');
    expect(result.messageText).toMatch(/Subtotal: R\$\s*59,00/);
    expect(result.messageText).toMatch(/TOTAL: \*R\$\s*59,00\*/);
    expect(result.messageText).toContain('WhatsApp: 5584988909408');
    expect(result.messageText).toContain('Aguardando confirmação do pagamento.');
    expect(result.messageText).toContain('#PEDIDO_WBT_8F42A1');

    // A mensagem original usa quebras de linha normais (\n) sem %0A manual
    expect(result.messageText).not.toContain('%0A');
    // A URL final deve usar encodeURIComponent
    expect(result.whatsappUrl).toContain('https://wa.me/5584988909408?text=');
    expect(result.whatsappUrl).toContain(encodeURIComponent('#PEDIDO_WBT_8F42A1'));
  });
});

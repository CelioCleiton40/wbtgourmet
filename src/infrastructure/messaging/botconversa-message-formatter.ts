import { Order } from '@/domain/orders/entities/order';
import { OrderItem } from '@/domain/orders/entities/order-item';

export interface FormattedMessageResult {
  messageText: string;
  whatsappUrl: string;
}

export class BotConversaMessageFormatter {
  private readonly defaultRestaurantPhone: string;

  constructor(restaurantPhone = process.env.RESTAURANT_WHATSAPP_PHONE || '5584988909408') {
    this.defaultRestaurantPhone = restaurantPhone.replace(/\D/g, '');
  }

  public format(order: Order): FormattedMessageResult {
    const formattedDate = this.formatDateTime(order.createdAt);
    const orderCodeWithHash = order.orderCode.formattedWithHash;
    const hashtag = order.orderCode.hashtag;

    const itemsLines = order.items
      .map((item: OrderItem) => `${item.quantity}x ${item.productName}\n   ${item.unitPrice.formatBRL()}`)
      .join('\n\n');

    const statusText = this.mapStatusText(order.status);

    const messageText = [
      '🍽️ *NOVO PEDIDO — WBT GOURMET*',
      '',
      '━━━━━━━━━━━━━━━━━━',
      `🧾 *PEDIDO ${orderCodeWithHash}*`,
      '━━━━━━━━━━━━━━━━━━',
      '',
      '🛒 *ITENS*',
      '',
      itemsLines,
      '',
      '━━━━━━━━━━━━━━━━━━',
      '📦 *RESUMO*',
      '',
      `Itens: ${order.totalItems}`,
      `Subtotal: ${order.subtotal.formatBRL()}`,
      `TOTAL: *${order.total.formatBRL()}*`,
      '━━━━━━━━━━━━━━━━━━',
      '',
      '👤 *CLIENTE*',
      `WhatsApp: ${order.customerPhone.value}`,
      '',
      `🕐 Pedido recebido: ${formattedDate}`,
      '',
      '🤖 *STATUS*',
      statusText,
      '',
      hashtag,
    ].join('\n');

    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${this.defaultRestaurantPhone}?text=${encodedMessage}`;

    return {
      messageText,
      whatsappUrl,
    };
  }

  private mapStatusText(status: string): string {
    switch (status) {
      case 'pending_payment':
        return 'Aguardando confirmação do pagamento.';
      case 'payment_confirmed':
        return 'Pagamento confirmado.';
      case 'preparing':
        return 'Em preparação.';
      case 'ready':
        return 'Pronto para entrega/retirada.';
      case 'completed':
        return 'Pedido finalizado.';
      case 'cancelled':
        return 'Pedido cancelado.';
      default:
        return 'Aguardando confirmação do pagamento.';
    }
  }

  private formatDateTime(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}

import { Money } from '../value-objects/money';
import { Phone } from '../value-objects/phone';
import { OrderCode } from '../value-objects/order-code';
import { OrderItem } from './order-item';
import { InvalidQuantityError } from '@/shared/errors/domain-errors';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderProps {
  id?: string;
  orderCode: OrderCode;
  idempotencyKey: string;
  customerPhone: Phone;
  items: OrderItem[];
  /** Taxa de entrega em centavos (0 = retirada no local / sem frete). */
  deliveryFeeCents?: number;
  /** ID interno da cotação de entrega vinculada ao pedido. */
  deliveryQuoteId?: string;
  status?: OrderStatus;
  createdAt?: Date;
  rawMessage?: string;
}

export class Order {
  public readonly id?: string;
  public readonly orderCode: OrderCode;
  public readonly idempotencyKey: string;
  public readonly customerPhone: Phone;
  public readonly items: OrderItem[];
  public readonly status: OrderStatus;
  public readonly createdAt: Date;
  public readonly rawMessage?: string;

  /** Taxa de entrega. */
  public readonly deliveryFee: Money;
  /** ID interno da DeliveryQuote vinculada. */
  public readonly deliveryQuoteId?: string;

  public readonly subtotal: Money;
  /** total = subtotal + deliveryFee — invariante financeiro central. */
  public readonly total: Money;
  public readonly totalItems: number;

  private constructor(props: OrderProps) {
    if (!props.idempotencyKey || typeof props.idempotencyKey !== 'string') {
      throw new Error('Chave de idempotência (idempotencyKey) é obrigatória.');
    }

    if (!Array.isArray(props.items) || props.items.length === 0) {
      throw new InvalidQuantityError('O pedido deve conter pelo menos um item.');
    }

    if (props.items.length > 50) {
      throw new InvalidQuantityError('O pedido não pode conter mais de 50 itens distintos.');
    }

    const feeCents = props.deliveryFeeCents ?? 0;
    if (!Number.isInteger(feeCents) || feeCents < 0) {
      throw new Error('Taxa de entrega deve ser um inteiro não-negativo em centavos.');
    }

    this.id = props.id;
    this.orderCode = props.orderCode;
    this.idempotencyKey = props.idempotencyKey;
    this.customerPhone = props.customerPhone;
    this.items = [...props.items];
    this.deliveryFee = Money.fromCents(feeCents);
    this.deliveryQuoteId = props.deliveryQuoteId;
    this.status = props.status || 'pending_payment';
    this.createdAt = props.createdAt || new Date();
    this.rawMessage = props.rawMessage;

    let calculatedSubtotal = Money.zero();
    let calculatedItemsCount = 0;

    for (const item of this.items) {
      calculatedSubtotal = calculatedSubtotal.add(item.subtotal);
      calculatedItemsCount += item.quantity;
    }

    this.subtotal = calculatedSubtotal;
    // total = subtotal + deliveryFee — calculado exclusivamente no backend
    this.total = calculatedSubtotal.add(this.deliveryFee);
    this.totalItems = calculatedItemsCount;
  }

  public static create(props: OrderProps): Order {
    return new Order(props);
  }

  public cloneWithStatus(newStatus: OrderStatus): Order {
    return new Order({
      id: this.id,
      orderCode: this.orderCode,
      idempotencyKey: this.idempotencyKey,
      customerPhone: this.customerPhone,
      items: this.items,
      deliveryFeeCents: this.deliveryFee.cents,
      deliveryQuoteId: this.deliveryQuoteId,
      status: newStatus,
      createdAt: this.createdAt,
      rawMessage: this.rawMessage,
    });
  }
}


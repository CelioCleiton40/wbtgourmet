import { Money } from '../value-objects/money';
import { InvalidQuantityError } from '@/shared/errors/domain-errors';

export interface OrderItemProps {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
}

export class OrderItem {
  public readonly id?: string;
  public readonly productId: string;
  public readonly productName: string;
  public readonly unitPrice: Money;
  public readonly quantity: number;
  public readonly subtotal: Money;

  private constructor(props: OrderItemProps) {
    if (!props.productId || !props.productName) {
      throw new Error('Produto deve conter ID e nome válidos.');
    }

    if (!Number.isInteger(props.quantity) || props.quantity <= 0 || props.quantity > 50) {
      throw new InvalidQuantityError(
        `A quantidade do produto "${props.productName}" deve ser entre 1 e 50.`
      );
    }

    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName;
    this.unitPrice = props.unitPrice;
    this.quantity = props.quantity;
    this.subtotal = props.unitPrice.multiply(props.quantity);
  }

  public static create(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }
}

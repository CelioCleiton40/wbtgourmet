import { Money } from '@/domain/orders/value-objects/money';

export interface DeliveryQuoteProps {
  id?: string;
  orderId?: string;
  provider?: string;
  providerQuoteId: string;
  fee: Money;
  currency?: string;
  expiresAt: Date;
  status?: 'active' | 'expired' | 'used';
  createdAt?: Date;
}

export class DeliveryQuote {
  public readonly id?: string;
  private _orderId?: string;
  public readonly provider: string;
  public readonly providerQuoteId: string;
  public readonly fee: Money;
  public readonly currency: string;
  public readonly expiresAt: Date;
  public status: 'active' | 'expired' | 'used';
  public readonly createdAt: Date;

  private constructor(props: DeliveryQuoteProps) {
    if (!props.providerQuoteId) {
      throw new Error('Cotação de entrega deve conter um providerQuoteId válido.');
    }

    this.id = props.id;
    this._orderId = props.orderId;
    this.provider = props.provider || 'uber_direct';
    this.providerQuoteId = props.providerQuoteId;
    this.fee = props.fee;
    this.currency = props.currency || 'BRL';
    this.expiresAt = props.expiresAt;
    this.status = props.status || (this.isExpired ? 'expired' : 'active');
    this.createdAt = props.createdAt || new Date();
  }

  public static create(props: DeliveryQuoteProps): DeliveryQuote {
    return new DeliveryQuote(props);
  }

  public get orderId(): string | undefined {
    return this._orderId;
  }

  public get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Vincula esta cotação a um pedido.
   * Só pode ser chamado uma vez — após vínculo, orderId é imutável.
   */
  public linkToOrder(orderId: string): void {
    if (this._orderId) {
      throw new Error(
        `Cotação já vinculada ao pedido ${this._orderId}. Não é possível vincular novamente.`
      );
    }
    if (!orderId) {
      throw new Error('orderId obrigatório para vincular cotação.');
    }
    this._orderId = orderId;
  }

  /**
   * Marca a cotação como utilizada na criação da entrega.
   * Impede reuso da mesma cotação.
   */
  public markUsed(): void {
    if (this.isExpired) {
      throw new Error('Não é possível usar uma cotação expirada.');
    }
    if (this.status === 'used') {
      throw new Error('Cotação já foi utilizada.');
    }
    this.status = 'used';
  }

  /**
   * Marca a cotação como expirada (acionado pelo worker ou na verificação).
   */
  public markExpired(): void {
    this.status = 'expired';
  }
}

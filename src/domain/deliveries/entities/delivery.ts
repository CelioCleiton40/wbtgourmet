export type DeliveryStatus =
  | 'pending'
  | 'quoted'
  | 'scheduled'
  | 'courier_assigned'
  | 'pickup'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryProps {
  id?: string;
  orderId: string;
  provider?: string;
  providerDeliveryId?: string;
  trackingUrl?: string;
  status?: DeliveryStatus;
  pickupAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Delivery {
  public readonly id?: string;
  public readonly orderId: string;
  public readonly provider: string;
  public providerDeliveryId?: string;
  public trackingUrl?: string;
  public status: DeliveryStatus;
  public pickupAt?: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: DeliveryProps) {
    if (!props.orderId) {
      throw new Error('Entrega deve estar associada a um orderId válido.');
    }

    this.id = props.id;
    this.orderId = props.orderId;
    this.provider = props.provider || 'uber_direct';
    this.providerDeliveryId = props.providerDeliveryId;
    this.trackingUrl = props.trackingUrl;
    this.status = props.status || 'pending';
    this.pickupAt = props.pickupAt;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static create(props: DeliveryProps): Delivery {
    return new Delivery(props);
  }

  public updateStatus(newStatus: DeliveryStatus): void {
    // Evita regressão de estado (ex: in_transit após delivered)
    const statusPriority: Record<DeliveryStatus, number> = {
      pending: 1,
      quoted: 2,
      scheduled: 3,
      courier_assigned: 4,
      pickup: 5,
      in_transit: 6,
      delivered: 7,
      failed: 8,
      cancelled: 8,
    };

    if (statusPriority[newStatus] < statusPriority[this.status]) {
      // Ignorar tentativas de retroceder o estado
      return;
    }

    this.status = newStatus;
    this.updatedAt = new Date();
  }
}

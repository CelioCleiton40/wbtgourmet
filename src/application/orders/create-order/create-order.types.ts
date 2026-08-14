export interface CreateOrderItemInput {
  id: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  customerPhone: string;
  idempotencyKey: string;
  /** UUID interno da cotação de entrega (retornado por /api/deliveries/quote). */
  quoteId?: string;
}

export interface CreateOrderOutput {
  orderId: string;
  orderCode: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  totalItems: number;
  customerPhone: string;
  status: string;
  createdAt: Date;
  isExisting: boolean; // Indica se foi retornado via idempotência
}

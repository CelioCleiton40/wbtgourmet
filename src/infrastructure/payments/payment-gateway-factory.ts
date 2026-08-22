import { PaymentGateway } from '@/domain/payments/services/payment-gateway';
import { MercadoPagoPaymentGateway } from '@/infrastructure/mercadopago/mercadopago-payment-gateway';

let cachedGateway: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (cachedGateway) {
    return cachedGateway;
  }

  cachedGateway = new MercadoPagoPaymentGateway();
  return cachedGateway;
}

/** Permite resetar a instância em testes */
export function resetPaymentGateway(): void {
  cachedGateway = null;
}

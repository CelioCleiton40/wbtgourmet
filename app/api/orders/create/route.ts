import { OrderController } from '@/interfaces/http/orders/create/order-controller';

export async function POST(request: Request) {
  return OrderController.handleCreateOrder(request);
}

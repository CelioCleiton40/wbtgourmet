import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateOrderUseCase } from '@/application/orders/create-order/create-order.use-case';
import { MenuProductRepository } from '@/infrastructure/catalog/menu-product-repository';
import { BotConversaMessageFormatter } from '@/infrastructure/messaging/botconversa-message-formatter';
import { getOrderRepository } from '@/infrastructure/repositories/order-repository-factory';
import { InMemoryDeliveryQuoteRepository } from '@/infrastructure/repositories/in-memory-delivery-quote-repository';
import {
  InvalidPhoneError,
  InvalidQuantityError,
  PersistenceError,
  ProductNotFoundError,
  RateLimitError,
} from '@/shared/errors/domain-errors';
import { RateLimiter } from '@/shared/rate-limit/rate-limiter';
import { Logger } from '@/shared/utils/logger';

// Schema Zod com .strict() para rejeitar adulteração (price, name, status, deliveryFee, etc)
const createOrderSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1, 'ID do produto é obrigatório.').max(100),
            quantity: z
              .number()
              .int('A quantidade deve ser um número inteiro.')
              .positive('A quantidade deve ser positiva.')
              .max(50, 'A quantidade máxima por item é 50.'),
          })
          .strict()
      )
      .min(1, 'O pedido deve conter pelo menos 1 item.')
      .max(50, 'O pedido não pode conter mais de 50 produtos diferentes.'),
    customerPhone: z.string().min(8, 'Telefone muito curto.').max(30, 'Telefone muito longo.'),
    idempotencyKey: z.string().uuid('A chave de idempotência deve ser um UUID válido (v4).'),
    /** ID da cotação retornado por /api/deliveries/quote — nunca um preço. */
    quoteId: z.string().min(1, 'quoteId inválido.').max(100, 'quoteId muito longo.').optional(),
  })
  .strict();

import { getDeliveryQuoteRepository } from '@/infrastructure/repositories/delivery-quote-repository-factory';

const rateLimiter = new RateLimiter(10, 60);
const menuProductRepository = new MenuProductRepository();
const botConversaFormatter = new BotConversaMessageFormatter();

export class OrderController {
  public static async handleCreateOrder(request: Request): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // 1. Validação de Content-Type
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return NextResponse.json(
          { error: 'Cabeçalho Content-Type deve ser application/json.' },
          { status: 400 }
        );
      }

      // 2. Validação do tamanho do Payload (Máximo 10 KB)
      const contentLengthHeader = request.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 10240) {
        return NextResponse.json(
          { error: 'Tamanho da requisição excede o limite máximo permitido (10KB).' },
          { status: 413 }
        );
      }

      const bodyText = await request.text();
      if (bodyText.length > 10240) {
        return NextResponse.json(
          { error: 'Tamanho do corpo da requisição excede 10KB.' },
          { status: 413 }
        );
      }

      // 3. Parsing do JSON
      let rawJson: unknown;
      try {
        rawJson = JSON.parse(bodyText);
      } catch {
        return NextResponse.json(
          { error: 'Formato JSON inválido.' },
          { status: 400 }
        );
      }

      // 4. Validação Zod estrita
      const validatedData = createOrderSchema.parse(rawJson);

      // 5. Rate Limiting por IP e Telefone
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
      const rateLimitKey = `${clientIp}:${validatedData.customerPhone.replace(/\D/g, '')}`;
      rateLimiter.check(rateLimitKey);

      // 6. Seleção dos repositórios via fábrica compartilhada
      const orderRepo = getOrderRepository();
      const deliveryQuoteRepo = getDeliveryQuoteRepository();

      // 7. Invocação do UseCase (com repositório de cotações para suporte a frete)
      const useCase = new CreateOrderUseCase(orderRepo, menuProductRepository, deliveryQuoteRepo);
      const result = await useCase.execute(validatedData);

      // 8. Reconstruir a entidade/dados para o Formatter do BotConversa
      const fetchedOrder = await orderRepo.findByOrderCode(result.orderCode);
      if (!fetchedOrder) {
        throw new PersistenceError('Não foi possível recuperar o pedido persistido.');
      }

      const formatted = botConversaFormatter.format(fetchedOrder);

      Logger.info('Pedido processado com sucesso', {
        requestId,
        orderCode: result.orderCode,
        totalCents: result.totalCents,
        phone: result.customerPhone,
        isExisting: result.isExisting,
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json(
        {
          success: true,
          orderId: result.orderId,
          orderCode: result.orderCode,
          totalCents: result.totalCents,
          customerPhone: result.customerPhone,
          status: result.status,
          whatsappUrl: formatted.whatsappUrl,
          isExisting: result.isExisting,
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;

      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        const errorMessage = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Dados do pedido inválidos.';
        Logger.error('Erro de validação Zod', error, { requestId, durationMs });
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      if (error instanceof InvalidQuantityError || error instanceof InvalidPhoneError) {
        Logger.error('Erro de validação de domínio', error, { requestId, durationMs });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error instanceof ProductNotFoundError) {
        Logger.error('Produto não encontrado', error, { requestId, durationMs });
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error instanceof RateLimitError) {
        Logger.error('Rate Limit excedido', error, { requestId, durationMs });
        return NextResponse.json({ error: error.message }, { status: 429 });
      }

      if (error instanceof PersistenceError) {
        Logger.error('Erro de persistência no banco de dados', error, { requestId, durationMs });
        return NextResponse.json(
          { error: 'Falha ao salvar o pedido no servidor. Tente novamente mais tarde.' },
          { status: 503 }
        );
      }

      Logger.error('Erro interno inesperado no controller', error, { requestId, durationMs });
      return NextResponse.json(
        { error: 'Erro interno ao processar o pedido. Tente novamente.' },
        { status: 500 }
      );
    }
  }
}

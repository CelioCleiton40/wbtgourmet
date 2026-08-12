import { NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'O carrinho deve conter pelo menos um item.'),
  customerPhone: z
    .string()
    .min(10, 'Número de WhatsApp inválido.')
    .regex(/^\d+$/, 'O número deve conter apenas dígitos.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = checkoutSchema.parse(body);

    // Calcular o total no servidor para evitar manipulação de valores no frontend
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Formatar texto do pedido para o WhatsApp oficial da casa
    const itemsSummary = validatedData.items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`
      )
      .join('%0A');

    const message = `🎾 *NOVO PEDIDO - WBT GOURMET*%0A%0A*Itens do Pedido:*%0A${itemsSummary}%0A%0A*Total:* R$ ${totalAmount.toFixed(
      2
    )}%0A*Cliente WhatsApp:* ${validatedData.customerPhone}%0A%0A_Aguardando confirmação do pagamento!_`;

    const whatsappUrl = `https://wa.me/5584999999999?text=${message}`;

    return NextResponse.json({ url: whatsappUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dados do pedido inválidos.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar o pedido. Tente novamente.' },
      { status: 500 }
    );
  }
}

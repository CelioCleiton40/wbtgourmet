import { describe, it, expect } from 'vitest';
import { OrderCode } from '@/domain/orders/value-objects/order-code';

describe('OrderCode Value Object', () => {
  it('deve gerar código no formato WBT-XXXXXX', () => {
    const code = OrderCode.generate();
    expect(code.value).toMatch(/^WBT-[A-F0-9]{6}$/);
  });

  it('deve formatar com hash (#WBT-XXXXXX)', () => {
    const code = OrderCode.create('WBT-8F42A1');
    expect(code.formattedWithHash).toBe('#WBT-8F42A1');
  });

  it('deve gerar hashtag limpa para BotConversa (#PEDIDO_WBT_8F42A1)', () => {
    const code = OrderCode.create('WBT-8F42A1');
    expect(code.hashtag).toBe('#PEDIDO_WBT_8F42A1');
  });
});

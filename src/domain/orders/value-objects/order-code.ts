import crypto from 'crypto';

export class OrderCode {
  public readonly value: string;

  private constructor(code: string) {
    if (!code || typeof code !== 'string' || !code.startsWith('WBT-')) {
      throw new Error('Código do pedido inválido. Deve iniciar com "WBT-".');
    }
    this.value = code.toUpperCase();
  }

  public static create(code: string): OrderCode {
    return new OrderCode(code);
  }

  public static generate(): OrderCode {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return new OrderCode(`WBT-${randomHex}`);
  }

  public get formattedWithHash(): string {
    return `#${this.value}`;
  }

  public get hashtag(): string {
    return `#PEDIDO_${this.value.replace('-', '_')}`;
  }

  public equals(other: OrderCode): boolean {
    return this.value === other.value;
  }
}

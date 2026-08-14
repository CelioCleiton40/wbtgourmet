export class Money {
  private constructor(public readonly cents: number) {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new Error('O valor em centavos deve ser um número inteiro não negativo.');
    }
  }

  public static fromCents(cents: number): Money {
    return new Money(Math.round(cents));
  }

  public static fromFloat(amount: number): Money {
    return new Money(Math.round(amount * 100));
  }

  public static zero(): Money {
    return new Money(0);
  }

  public add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  public multiply(quantity: number): Money {
    if (quantity < 0) {
      throw new Error('A quantidade para multiplicação não pode ser negativa.');
    }
    return Money.fromCents(Math.round(this.cents * quantity));
  }

  public toFloat(): number {
    return this.cents / 100;
  }

  public formatBRL(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.toFloat());
  }

  public equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}

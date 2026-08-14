import { describe, it, expect } from 'vitest';
import { Money } from '@/domain/orders/value-objects/money';

describe('Money Value Object', () => {
  it('deve criar Money a partir de centavos', () => {
    const money = Money.fromCents(4500);
    expect(money.cents).toBe(4500);
    expect(money.toFloat()).toBe(45.0);
  });

  it('deve criar Money a partir de float R$', () => {
    const money = Money.fromFloat(29.9);
    expect(money.cents).toBe(2990);
    expect(money.toFloat()).toBe(29.9);
  });

  it('deve formatar para BRL corretamente', () => {
    const money = Money.fromCents(4500);
    const formatted = money.formatBRL();
    expect(formatted).toContain('45,00');
  });

  it('deve somar dois valores Money', () => {
    const m1 = Money.fromCents(1000);
    const m2 = Money.fromCents(2500);
    const sum = m1.add(m2);
    expect(sum.cents).toBe(3500);
  });

  it('deve multiplicar o valor por uma quantidade inteira', () => {
    const unitPrice = Money.fromCents(1500);
    const total = unitPrice.multiply(3);
    expect(total.cents).toBe(4500);
  });

  it('deve lançar erro se o valor em centavos for negativo', () => {
    expect(() => Money.fromCents(-100)).toThrow('O valor em centavos deve ser um número inteiro não negativo.');
  });
});

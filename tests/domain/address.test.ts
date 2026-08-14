import { describe, it, expect } from 'vitest';
import { Address } from '@/domain/orders/value-objects/address';

describe('Address Value Object', () => {
  it('deve criar um Address válido e sanitizar o CEP', () => {
    const addr = Address.create({
      street: 'Avenida João da Escóssia',
      number: '1500',
      district: 'Nova Betânia',
      city: 'Mossoró',
      state: 'rn',
      postalCode: '59.607-000',
    });

    expect(addr.street).toBe('Avenida João da Escóssia');
    expect(addr.state).toBe('RN');
    expect(addr.postalCode).toBe('59607000');
    expect(addr.formatFull()).toContain('59607000');
  });

  it('deve lançar erro se o CEP for inválido', () => {
    expect(() =>
      Address.create({
        street: 'Rua Teste',
        number: '123',
        district: 'Centro',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '123', // Inválido
      })
    ).toThrow('CEP de entrega inválido');
  });

  it('deve lançar erro se os campos obrigatórios estiverem ausentes', () => {
    expect(() =>
      Address.create({
        street: '',
        number: '123',
        district: 'Centro',
        city: 'Mossoró',
        state: 'RN',
        postalCode: '59600000',
      })
    ).toThrow('Endereço incompleto');
  });
});

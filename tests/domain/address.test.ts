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

  it('deve identificar corretamente endereços dentro e fora de Mossoró-RN', () => {
    const mossoroAddr1 = Address.create({
      street: 'Av. João da Escóssia',
      number: '1500',
      district: 'Nova Betânia',
      city: 'Mossoró',
      state: 'RN',
      postalCode: '59607-000',
    });
    expect(mossoroAddr1.isWithinMossoro()).toBe(true);

    const mossoroAddr2 = Address.create({
      street: 'Rua Coronel Gurgel',
      number: '100',
      district: 'Centro',
      city: 'Mossoro',
      state: 'RN',
      postalCode: '59600-000',
    });
    expect(mossoroAddr2.isWithinMossoro()).toBe(true);

    // Limite superior de Mossoró: 59649-898
    const mossoroMaxAddr = Address.create({
      street: 'Rua Limite',
      number: '50',
      district: 'Zona Rural',
      city: 'Mossoró',
      state: 'RN',
      postalCode: '59649-898',
    });
    expect(mossoroMaxAddr.isWithinMossoro()).toBe(true);

    // Fora do limite superior de Mossoró: 59649-899
    const outsideMaxAddr = Address.create({
      street: 'Rua Além Limite',
      number: '50',
      district: 'Outro',
      city: 'Mossoró',
      state: 'RN',
      postalCode: '59649-899',
    });
    expect(outsideMaxAddr.isWithinMossoro()).toBe(false);

    // CEP de São Paulo - SP
    const spAddr = Address.create({
      street: 'Av. Paulista',
      number: '1000',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01310-100',
    });
    expect(spAddr.isWithinMossoro()).toBe(false);

    // CEP de Natal - RN
    const natalAddr = Address.create({
      street: 'Av. Hermes da Fonseca',
      number: '500',
      district: 'Tirol',
      city: 'Natal',
      state: 'RN',
      postalCode: '59020-000',
    });
    expect(natalAddr.isWithinMossoro()).toBe(false);
  });
});

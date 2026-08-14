import { describe, it, expect } from 'vitest';
import { Phone } from '@/domain/orders/value-objects/phone';
import { InvalidPhoneError } from '@/shared/errors/domain-errors';

describe('Phone Value Object', () => {
  it('deve normalizar telefone brasileiro de 11 dígitos adicionando DDI 55', () => {
    const phone = Phone.create('84988909408');
    expect(phone.value).toBe('5584988909408');
  });

  it('deve normalizar telefone com máscara (84) 99889-0940', () => {
    const phone = Phone.create('(84) 99889-0940');
    expect(phone.value).toBe('5584998890940');
  });

  it('deve manter DDI 55 se já fornecido', () => {
    const phone = Phone.create('5584988909408');
    expect(phone.value).toBe('5584988909408');
  });

  it('deve mascarar o telefone para proteção LGPD', () => {
    const phone = Phone.create('5584988909408');
    expect(phone.maskedValue).toBe('5584******408');
  });

  it('deve lançar InvalidPhoneError se o número for muito curto ou inválido', () => {
    expect(() => Phone.create('12345')).toThrow(InvalidPhoneError);
  });

  it('deve lançar InvalidPhoneError se o DDD for inválido', () => {
    expect(() => Phone.create('00988909408')).toThrow(InvalidPhoneError);
  });
});

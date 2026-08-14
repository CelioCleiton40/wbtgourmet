import { InvalidPhoneError } from '@/shared/errors/domain-errors';

export class Phone {
  public readonly value: string;

  private constructor(phone: string) {
    this.value = this.normalize(phone);
  }

  public static create(phone: string): Phone {
    return new Phone(phone);
  }

  private normalize(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new InvalidPhoneError('Telefone não fornecido.');
    }

    const digitsOnly = input.replace(/\D/g, '');

    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      // 10 dígitos (DDD + 8 números) ou 11 dígitos (DDD + 9 números): adiciona o DDI 55
      const normalized = `55${digitsOnly}`;
      this.validate(normalized);
      return normalized;
    }

    if (digitsOnly.length === 12 || digitsOnly.length === 13) {
      if (!digitsOnly.startsWith('55')) {
        throw new InvalidPhoneError('Número de telefone com DDI inválido. Deve começar com 55 (Brasil).');
      }
      this.validate(digitsOnly);
      return digitsOnly;
    }

    throw new InvalidPhoneError(
      `Número de WhatsApp inválido (${digitsOnly.length} dígitos). Informe DDD + número completo.`
    );
  }

  private validate(phoneWithDdi: string): void {
    // Ex: 55 + DDD (2 dígitos: 11-99) + 8 ou 9 dígitos -> total 12 ou 13 dígitos
    const ddd = parseInt(phoneWithDdi.substring(2, 4), 10);
    if (isNaN(ddd) || ddd < 11 || ddd > 99) {
      throw new InvalidPhoneError('DDD de telefone inválido.');
    }
  }

  public get maskedValue(): string {
    if (this.value.length < 8) return '***';
    const prefix = this.value.substring(0, 4);
    const suffix = this.value.substring(this.value.length - 3);
    return `${prefix}******${suffix}`;
  }

  public equals(other: Phone): boolean {
    return this.value === other.value;
  }
}

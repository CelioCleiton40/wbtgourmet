export interface AddressProps {
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  complement?: string;
  latitude?: number;
  longitude?: number;
}

export class Address {
  public readonly street: string;
  public readonly number: string;
  public readonly district: string;
  public readonly city: string;
  public readonly state: string;
  public readonly postalCode: string;
  public readonly complement?: string;
  public readonly latitude?: number;
  public readonly longitude?: number;

  private constructor(props: AddressProps) {
    if (!props.street || !props.number || !props.district || !props.city || !props.state) {
      throw new Error('Endereço incompleto. Informar rua, número, bairro, cidade e estado.');
    }

    const cleanCep = props.postalCode ? props.postalCode.replace(/\D/g, '') : '';
    if (cleanCep.length !== 8) {
      throw new Error('CEP de entrega inválido. Deve conter 8 dígitos.');
    }

    this.street = props.street;
    this.number = props.number;
    this.district = props.district;
    this.city = props.city;
    this.state = props.state.toUpperCase();
    this.postalCode = cleanCep;
    this.complement = props.complement;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
  }

  public static create(props: AddressProps): Address {
    return new Address(props);
  }

  public isWithinMossoro(): boolean {
    const numericCep = parseInt(this.postalCode, 10);
    const isMossoroCep = !isNaN(numericCep) && numericCep >= 59600000 && numericCep <= 59649898;
    const cleanCity = this.city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    const isMossoroCity = cleanCity === 'mossoro';
    const isMossoroState = this.state.toUpperCase().trim() === 'RN';

    // Para entrega ser válida em Mossoró:
    // O CEP deve estar na faixa de Mossoró (59600-000 a 59649-898) e estado RN
    return isMossoroCep && (isMossoroCity || isMossoroState);
  }

  public toSnapshot(): AddressProps {
    return {
      street: this.street,
      number: this.number,
      district: this.district,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      complement: this.complement,
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  public formatFull(): string {
    const comp = this.complement ? `, ${this.complement}` : '';
    return `${this.street}, ${this.number}${comp} - ${this.district}, ${this.city}/${this.state} - CEP ${this.postalCode}`;
  }
}

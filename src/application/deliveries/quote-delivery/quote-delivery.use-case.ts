import { DeliveryGateway } from '@/domain/deliveries/services/delivery-gateway';
import { DeliveryQuote } from '@/domain/deliveries/entities/delivery-quote';
import { DeliveryQuoteRepository } from '@/domain/deliveries/repositories/delivery-quote-repository';
import { Address, AddressProps } from '@/domain/orders/value-objects/address';

export interface QuoteDeliveryInput {
  dropoffAddress: AddressProps;
}

export interface QuoteDeliveryOutput {
  /** UUID interno da cotação persistida — enviado ao frontend como referência (nunca como preço). */
  quoteId: string;
  /** ID retornado pela Uber — usado na criação da entrega. */
  providerQuoteId: string;
  feeCents: number;
  feeFormattedBRL: string;
  expiresAt: Date;
}

export class QuoteDeliveryUseCase {
  constructor(
    private readonly deliveryGateway: DeliveryGateway,
    private readonly deliveryQuoteRepository: DeliveryQuoteRepository
  ) {}

  public async execute(input: QuoteDeliveryInput): Promise<QuoteDeliveryOutput> {
    // Endereço de retirada oficial do estabelecimento (WBT Gourmet)
    const pickupAddress = Address.create({
      street: process.env.RESTAURANT_STREET || 'Avenida João da Escóssia',
      number: process.env.RESTAURANT_NUMBER || '1500',
      district: process.env.RESTAURANT_DISTRICT || 'Nova Betânia',
      city: process.env.RESTAURANT_CITY || 'Mossoró',
      state: process.env.RESTAURANT_STATE || 'RN',
      postalCode: process.env.RESTAURANT_POSTAL_CODE || '59607000',
    });

    const dropoffAddress = Address.create(input.dropoffAddress);

    // Obtém cotação do gateway (Uber Direct ou mock)
    const quoteResult = await this.deliveryGateway.getQuote({
      pickupAddress,
      dropoffAddress,
    });

    // Persiste a cotação — ela deve existir no banco antes de criar o pedido
    const quote = DeliveryQuote.create({
      providerQuoteId: quoteResult.quoteId,
      fee: quoteResult.fee,
      expiresAt: quoteResult.expiresAt,
    });

    await this.deliveryQuoteRepository.save(quote);

    // Recarrega para obter o UUID interno atribuído pelo banco
    const persisted = await this.deliveryQuoteRepository.findByProviderQuoteId(
      quoteResult.quoteId
    );

    if (!persisted || !persisted.id) {
      throw new Error('Falha ao persistir cotação de entrega.');
    }

    return {
      quoteId: persisted.id,
      providerQuoteId: quoteResult.quoteId,
      feeCents: quoteResult.fee.cents,
      feeFormattedBRL: quoteResult.fee.formatBRL(),
      expiresAt: quoteResult.expiresAt,
    };
  }
}

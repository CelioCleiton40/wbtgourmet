import { Money } from '../value-objects/money';

export interface CatalogProduct {
  id: string;
  name: string;
  price: Money;
  category: string;
}

export interface ProductRepository {
  findById(id: string): Promise<CatalogProduct | null>;
}

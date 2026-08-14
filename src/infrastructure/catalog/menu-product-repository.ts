import { menu } from '@/data/menu';
import { CatalogProduct, ProductRepository } from '@/domain/orders/repositories/product-repository';
import { Money } from '@/domain/orders/value-objects/money';

export class MenuProductRepository implements ProductRepository {
  private catalogMap: Map<string, CatalogProduct>;

  constructor() {
    this.catalogMap = new Map();
    // Achatar todas as seções e itens do cardápio em um mapa indexado por ID
    for (const section of menu) {
      for (const item of section.items) {
        this.catalogMap.set(item.id, {
          id: item.id,
          name: item.name,
          price: Money.fromFloat(item.price), // Converte float R$ -> Money (centavos)
          category: item.category,
        });
      }
    }
  }

  public async findById(id: string): Promise<CatalogProduct | null> {
    const product = this.catalogMap.get(id);
    if (!product) return null;
    return product;
  }
}

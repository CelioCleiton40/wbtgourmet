import { describe, it, expect } from 'vitest';
import { MenuProductRepository } from '@/infrastructure/catalog/menu-product-repository';

describe('MenuProductRepository', () => {
  const repo = new MenuProductRepository();

  it('deve encontrar um produto válido do cardápio pelo ID oficial (ex: fm-gorgonzola)', async () => {
    const product = await repo.findById('fm-gorgonzola');

    expect(product).not.toBeNull();
    expect(product?.id).toBe('fm-gorgonzola');
    expect(product?.name).toBe('Filé Mignon ao Molho de Gorgonzola');
    expect(product?.price.cents).toBe(4500); // R$ 45,00
    expect(product?.category).toBe('file-mignon');
  });

  it('deve retornar null para IDs inexistentes no cardápio', async () => {
    const product = await repo.findById('id-totalmente-invalido-999');
    expect(product).toBeNull();
  });
});

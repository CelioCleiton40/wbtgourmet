export interface SauceOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const MANDATORY_SAUCE_CATEGORIES = new Set(['sanduiches', 'panquecas']);

export const MANDATORY_SAUCES: SauceOption[] = [
  { id: 'molho-alho', name: 'Molho de Alho', emoji: '🧄', description: 'Artesanal, cremoso e suave' },
  { id: 'molho-azeitona', name: 'Molho de Azeitona', emoji: '🫒', description: 'Sabor marcante de azeitonas pretas' },
  { id: 'molho-rose', name: 'Molho Rosé', emoji: '🌸', description: 'Clássico, leve e bem temperado' },
];

export function isSauceMandatory(category?: string): boolean {
  return !!category && MANDATORY_SAUCE_CATEGORIES.has(category);
}

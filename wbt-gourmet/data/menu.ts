export type MenuCategory =
  | 'file-mignon'
  | 'camarao'
  | 'sanduiches'
  | 'tapiocas'
  | 'petiscos'
  | 'espetinhos'
  | 'salgados'
  | 'acai'
  | 'sabores-regionais'
  | 'crepioca'
  | 'panquecas'
  | 'adicionais'
  | 'refrigerantes'
  | 'aguas'
  | 'sucos'
  | 'energeticos';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  image?: string;
  availability?: { days: number[] }; // 0=domingo … 6=sábado
}

export interface MenuSection {
  id: MenuCategory;
  title: string;
  subtitle?: string;
  emoji: string;
  items: MenuItem[];
}

const QUA_QUI_SEX = { days: [3, 4, 5] };

export const menu: MenuSection[] = [
  {
    id: 'file-mignon',
    title: 'Pratos com Filé Mignon',
    emoji: '🥩',
    items: [
      {
        id: 'fm-gorgonzola',
        name: 'Filé Mignon ao Molho de Gorgonzola',
        description: 'Servido com espaguete',
        price: 45,
        category: 'file-mignon',
        image: '/images/menu/file-mignon-gorgonzola.jpg',
      },
      {
        id: 'fm-trinchado',
        name: 'Filé Mignon Trinchado com Fritas',
        description: 'Molho rústico',
        price: 55,
        category: 'file-mignon',
      },
      {
        id: 'fm-parmegiana-individual',
        name: 'Filé Mignon à Parmegiana Individual',
        description: 'Espaguete ao molho de tomate caseiro, fritas ou purê',
        price: 45,
        category: 'file-mignon',
      },
      {
        id: 'fm-parmegiana-duplo',
        name: 'Filé Mignon à Parmegiana Duplo',
        description: 'Espaguete ao molho de tomate caseiro, fritas ou purê',
        price: 80,
        category: 'file-mignon',
      },
    ],
  },
  {
    id: 'camarao',
    title: 'Pratos com Camarão',
    emoji: '🦐',
    items: [
      {
        id: 'cam-molho-branco',
        name: 'Filé de Camarão ao Molho Branco Especial',
        description: 'Servido com espaguete',
        price: 45,
        category: 'camarao',
        image: '/images/menu/camarao-molho-branco.jpg',
      },
      {
        id: 'cam-alho-oleo',
        name: 'Camarão com Casca ao Alho e Óleo',
        price: 55,
        category: 'camarao',
        image: '/images/menu/camarao-alho-oleo.jpg',
      },
    ],
  },
  {
    id: 'sanduiches',
    title: 'Sanduíches',
    emoji: '🍔',
    items: [
      {
        id: 'sd-smash-file',
        name: 'Smash Filé',
        description: 'Filé, queijo, salada e molho',
        price: 25,
        category: 'sanduiches',
        image: '/images/menu/smash-file.jpg',
      },
      {
        id: 'sd-lob-burg',
        name: 'Lob Burg',
        description: 'Hambúrguer, queijo, salada e molho',
        price: 17,
        category: 'sanduiches',
      },
      {
        id: 'sd-drop-chicken',
        name: 'Drop Chicken',
        description: 'Frango, queijo, salada e molho',
        price: 20,
        category: 'sanduiches',
      },
      {
        id: 'sd-toss-bauru',
        name: 'Toss Bauru',
        description: 'Queijo, presunto, ovo, salada e molho',
        price: 14,
        category: 'sanduiches',
      },
      {
        id: 'sd-misto-point',
        name: 'Misto Point',
        description: 'Queijo e presunto',
        price: 12,
        category: 'sanduiches',
      },
      {
        id: 'sd-match-hotdog',
        name: 'Match Hot Dog',
        description: 'Salsicha, carne moída e batata palha',
        price: 22,
        category: 'sanduiches',
      },
    ],
  },
  {
    id: 'tapiocas',
    title: 'Tapiocas Recheadas',
    emoji: '🫓',
    items: [
      {
        id: 'tp-nordestina',
        name: 'Tapioca Nordestina',
        description: 'Carne de sol e creme de queijo',
        price: 20,
        category: 'tapiocas',
        image: '/images/menu/tapioca-nordestina.jpg',
      },
      {
        id: 'tp-frango',
        name: 'Tapioca de Frango',
        description: 'Frango e creme de queijo',
        price: 15,
        category: 'tapiocas',
      },
      {
        id: 'tp-mista',
        name: 'Tapioca Mista',
        description: 'Queijo e presunto',
        price: 12,
        category: 'tapiocas',
      },
      {
        id: 'tp-romeu-julieta',
        name: 'Tapioca Romeu e Julieta',
        description: 'Doce de goiaba e queijo',
        price: 15,
        category: 'tapiocas',
      },
    ],
  },
  {
    id: 'petiscos',
    title: 'Petiscos',
    emoji: '🍟',
    items: [
      {
        id: 'pt-batata-frita',
        name: 'Batata Frita',
        price: 20,
        category: 'petiscos',
        image: '/images/menu/batata-frita.jpg',
      },
      {
        id: 'pt-calabresa-fritas',
        name: 'Calabresa com Fritas',
        price: 35,
        category: 'petiscos',
      },
      {
        id: 'pt-queijo-empanado',
        name: 'Queijo Empanado',
        price: 25,
        category: 'petiscos',
      },
      {
        id: 'pt-carne-sol-macaxeira',
        name: 'Carne de Sol com Macaxeira',
        price: 50,
        category: 'petiscos',
      },
    ],
  },
  {
    id: 'espetinhos',
    title: 'Espetinhos',
    subtitle: 'Quarta a sexta · servidos com arroz de leite, farofa e vinagrete',
    emoji: '🍢',
    items: [
      {
        id: 'esp-padrao',
        name: 'Espetinho Padrão',
        description: 'Carne, frango, queijo, calabresa, porco ou coração de frango',
        price: 13,
        category: 'espetinhos',
        availability: QUA_QUI_SEX,
      },
      {
        id: 'esp-premium',
        name: 'Espetinho Premium',
        description: 'Carne c/ bacon, frango c/ bacon, asinha ou cafta',
        price: 15,
        category: 'espetinhos',
        availability: QUA_QUI_SEX,
      },
    ],
  },
  {
    id: 'salgados',
    title: 'Salgados Variados',
    emoji: '🥟',
    items: [
      {
        id: 'sg-mini-salgados',
        name: 'Mini Salgados (15 unid.)',
        price: 18,
        category: 'salgados',
      },
      {
        id: 'sg-mini-churros',
        name: 'Mini Churros (10 unid.)',
        price: 18,
        category: 'salgados',
      },
    ],
  },
  {
    id: 'acai',
    title: 'Açaí',
    emoji: '🫐',
    items: [
      {
        id: 'ac-300',
        name: 'Açaí 300ml',
        price: 20,
        category: 'acai',
        image: '/images/menu/acai-bowl.jpg',
      },
      {
        id: 'ac-500',
        name: 'Açaí 500ml',
        price: 25,
        category: 'acai',
        image: '/images/menu/acai-bowl.jpg',
      },
      {
        id: 'ac-700',
        name: 'Açaí 700ml',
        price: 28,
        category: 'acai',
        image: '/images/menu/acai-bowl.jpg',
      },
    ],
  },
  {
    id: 'sabores-regionais',
    title: 'Sabores Regionais',
    subtitle: 'Cuscuz do nordeste do jeito certo',
    emoji: '🌽',
    items: [
      {
        id: 'cz-creme-queijo',
        name: 'Cuscuz Recheado com Creme de Queijo',
        price: 20,
        category: 'sabores-regionais',
      },
      {
        id: 'cz-carne-sol',
        name: 'Cuscuz Carne de Sol',
        price: 17,
        category: 'sabores-regionais',
      },
      {
        id: 'cz-frango',
        name: 'Cuscuz Frango',
        price: 15,
        category: 'sabores-regionais',
      },
      {
        id: 'cz-calabresa',
        name: 'Cuscuz Calabresa',
        price: 15,
        category: 'sabores-regionais',
      },
      {
        id: 'cz-ovo',
        name: 'Cuscuz Ovo',
        price: 12,
        category: 'sabores-regionais',
      },
    ],
  },
  {
    id: 'crepioca',
    title: 'Crepioca',
    emoji: '🥞',
    items: [
      {
        id: 'cr-carne-sol',
        name: 'Crepioca Carne de Sol',
        price: 20,
        category: 'crepioca',
      },
      {
        id: 'cr-frango',
        name: 'Crepioca Frango',
        price: 15,
        category: 'crepioca',
      },
      {
        id: 'cr-mista',
        name: 'Crepioca Mista',
        price: 10,
        category: 'crepioca',
      },
    ],
  },
  {
    id: 'panquecas',
    title: 'Panquecas',
    subtitle: 'Servidas com arroz solto, salada e batata palha',
    emoji: '🫔',
    items: [
      {
        id: 'pq-carne-sol',
        name: 'Panqueca de Carne de Sol',
        price: 25,
        category: 'panquecas',
      },
      {
        id: 'pq-frango',
        name: 'Panqueca de Frango',
        price: 20,
        category: 'panquecas',
      },
    ],
  },
  {
    id: 'adicionais',
    title: 'Adicionais',
    emoji: '➕',
    items: [
      { id: 'ad-bacon', name: 'Bacon', price: 3.5, category: 'adicionais' },
      { id: 'ad-calabresa', name: 'Calabresa', price: 3.5, category: 'adicionais' },
      { id: 'ad-file', name: 'Filé', price: 10, category: 'adicionais' },
      { id: 'ad-frango', name: 'Frango', price: 7, category: 'adicionais' },
      { id: 'ad-hamburguer', name: 'Hambúrguer', price: 5, category: 'adicionais' },
      { id: 'ad-molho', name: 'Molho', price: 3, category: 'adicionais' },
      { id: 'ad-ovo', name: 'Ovo', price: 3, category: 'adicionais' },
      { id: 'ad-presunto', name: 'Presunto', price: 3, category: 'adicionais' },
      { id: 'ad-queijo', name: 'Queijo', price: 3.5, category: 'adicionais' },
      { id: 'ad-salsicha', name: 'Salsicha', price: 3, category: 'adicionais' },
    ],
  },
  {
    id: 'refrigerantes',
    title: 'Refrigerantes',
    subtitle: 'Lata 350ml',
    emoji: '🥤',
    items: [
      { id: 'rf-coca', name: 'Coca-Cola Original ou Zero', price: 7, category: 'refrigerantes' },
      { id: 'rf-guarana', name: 'Guaraná Antarctica Original ou Zero', price: 7, category: 'refrigerantes' },
      { id: 'rf-fanta', name: 'Fanta Uva ou Laranja', price: 7, category: 'refrigerantes' },
      { id: 'rf-sprite-zero', name: 'Sprite Zero', price: 7, category: 'refrigerantes' },
    ],
  },
  {
    id: 'aguas',
    title: 'Águas',
    emoji: '💧',
    items: [
      { id: 'ag-sem-gas-500', name: 'Água Sem Gás 500ml', price: 3.5, category: 'aguas' },
      { id: 'ag-sem-gas-1500', name: 'Água Sem Gás 1,5L', price: 6.5, category: 'aguas' },
      { id: 'ag-com-gas-500', name: 'Água Com Gás 500ml', price: 4, category: 'aguas' },
    ],
  },
  {
    id: 'sucos',
    title: 'Sucos',
    subtitle: '300ml naturais e de polpa',
    emoji: '🍊',
    items: [
      { id: 'sc-laranja', name: 'Laranja Natural 300ml', price: 12, category: 'sucos' },
      { id: 'sc-maracuja', name: 'Polpa de Maracujá 300ml', price: 12, category: 'sucos' },
      { id: 'sc-polpa-outras', name: 'Polpa 300ml (Acerola, Caju, Goiaba)', price: 8, category: 'sucos' },
    ],
  },
  {
    id: 'energeticos',
    title: 'Energéticos',
    emoji: '⚡',
    items: [
      { id: 'en-monster', name: 'Monster Original ou Zero', price: 15, category: 'energeticos' },
      { id: 'en-redbull', name: 'Red Bull Original ou Zero', price: 15, category: 'energeticos' },
    ],
  },
];

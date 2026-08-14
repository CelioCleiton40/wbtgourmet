/**
 * data/menu.ts — Cardápio WBT Gourmet
 *
 * COMO ALTERAR PREÇOS:    Edite o campo `price` no item correspondente.
 * COMO ADICIONAR ITEM:    Inclua um objeto no array da seção correta.
 * COMO ADICIONAR SEÇÃO:   Adicione a categoria em MenuCategory e chame sec() no array menu[].
 * REGRA:                  Este arquivo não deve ultrapassar 200 linhas.
 */

/* ─── Tipos ─────────────────────────────────────────────────── */

export type MenuCategory =
  | 'file-mignon' | 'camarao'    | 'sanduiches'      | 'tapiocas'
  | 'petiscos'    | 'espetinhos' | 'salgados'         | 'acai'
  | 'sabores-regionais'           | 'crepioca'         | 'panquecas'
  | 'adicionais'  | 'refrigerantes' | 'aguas'          | 'sucos'
  | 'energeticos';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  image?: string;
  availability?: { days: number[] }; // 0 = dom … 6 = sáb
}

export interface MenuSection {
  id: MenuCategory;
  title: string;
  subtitle?: string;
  emoji: string;
  items: MenuItem[];
}

/* ─── Helpers ────────────────────────────────────────────────── */

/** Dias com espetinhos: quarta, quinta e sexta */
const QUA_QUI_SEX = { days: [3, 4, 5] };

/** Itens sem o campo `category` — preenchido automaticamente pelo helper sec() */
type RawItem = Omit<MenuItem, 'category'>;

/** Cria uma MenuSection injetando `category` em todos os itens automaticamente */
function sec(
  id: MenuCategory,
  meta: Pick<MenuSection, 'title' | 'emoji'> & { subtitle?: string },
  items: RawItem[],
): MenuSection {
  return { id, ...meta, items: items.map(i => ({ ...i, category: id })) };
}

/* ─── Cardápio ───────────────────────────────────────────────── */

export const menu: MenuSection[] = [

  sec('file-mignon', { title: 'Pratos com Filé Mignon', emoji: '🥩' }, [
    { id: 'fm-gorgonzola',          name: 'Filé Mignon ao Molho de Gorgonzola',     price: 45, description: 'Servido com espaguete',                                image: '/images/menu/file-mignon-gorgonzola.jpg' },
    { id: 'fm-trinchado',           name: 'Filé Mignon Trinchado com Fritas',        price: 55, description: 'Molho rústico especial',                               image: '/images/menu/file-mignon-trinchado.jpg'  },
    { id: 'fm-parmegiana-individual', name: 'Filé à Parmegiana Individual',          price: 45, description: 'Espaguete ao molho de tomate caseiro, fritas ou purê', image: '/images/menu/file-parmegiana.jpg'        },
    { id: 'fm-parmegiana-duplo',    name: 'Filé à Parmegiana Duplo',                 price: 80, description: 'Espaguete ao molho de tomate caseiro, fritas ou purê', image: '/images/menu/file-parmegiana.jpg'        },
  ]),

  sec('camarao', { title: 'Pratos com Camarão', emoji: '🦐' }, [
    { id: 'cam-molho-branco', name: 'Filé de Camarão ao Molho Branco Especial', price: 45, description: 'Servido com espaguete', image: '/images/menu/camarao-molho-branco.jpg' },
    { id: 'cam-alho-oleo',   name: 'Camarão com Casca ao Alho e Óleo',         price: 55,                                       image: '/images/menu/camarao-alho-oleo.jpg'    },
  ]),

  sec('sanduiches', { title: 'Sanduíches', emoji: '🍔' }, [
    { id: 'sd-smash-file',   name: 'Smash Filé',    price: 25, description: 'Filé, queijo, salada e molho',          image: '/images/menu/smash-file.jpg' },
    { id: 'sd-lob-burg',     name: 'Lob Burg',      price: 17, description: 'Hambúrguer, queijo, salada e molho',    image: '/images/menu/lob-burg.jpg'    },
    { id: 'sd-drop-chicken', name: 'Drop Chicken',  price: 20, description: 'Frango, queijo, salada e molho',        image: '/images/menu/lob-burg.jpg'    },
    { id: 'sd-toss-bauru',   name: 'Toss Bauru',    price: 14, description: 'Queijo, presunto, ovo, salada e molho', image: '/images/menu/smash-file.jpg' },
    { id: 'sd-misto-point',  name: 'Misto Point',   price: 12, description: 'Queijo e presunto',                     image: '/images/menu/smash-file.jpg' },
    { id: 'sd-match-hotdog', name: 'Match Hot Dog', price: 22, description: 'Salsicha, carne moída e batata palha', image: '/images/menu/smash-file.jpg' },
  ]),

  sec('tapiocas', { title: 'Tapiocas Recheadas', emoji: '🫓' }, [
    { id: 'tp-nordestina',   name: 'Tapioca Nordestina',    price: 20, description: 'Carne de sol e creme de queijo', image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'tp-frango',       name: 'Tapioca de Frango',     price: 15, description: 'Frango e creme de queijo',       image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'tp-mista',        name: 'Tapioca Mista',         price: 12, description: 'Queijo e presunto',              image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'tp-romeu-julieta',name: 'Tapioca Romeu e Julieta',price: 15, description: 'Doce de goiaba e queijo',        image: '/images/menu/tapioca-nordestina.jpg' },
  ]),

  sec('petiscos', { title: 'Petiscos', emoji: '🍟' }, [
    { id: 'pt-batata-frita',      name: 'Batata Frita',              price: 20, image: '/images/menu/batata-frita.jpg' },
    { id: 'pt-calabresa-fritas',  name: 'Calabresa com Fritas',      price: 35, image: '/images/menu/batata-frita.jpg' },
    { id: 'pt-queijo-empanado',   name: 'Queijo Empanado',           price: 25, image: '/images/menu/batata-frita.jpg' },
    { id: 'pt-carne-sol-macaxeira', name: 'Carne de Sol com Macaxeira', price: 50, image: '/images/menu/file-mignon-trinchado.jpg' },
  ]),

  sec('espetinhos', { title: 'Espetinhos', emoji: '🍢', subtitle: 'Quarta a sexta · servidos com arroz de leite, farofa e vinagrete' }, [
    { id: 'esp-padrao',  name: 'Espetinho Padrão',  price: 13, description: 'Carne, frango, queijo, calabresa, porco ou coração de frango', availability: QUA_QUI_SEX, image: '/images/menu/file-mignon-trinchado.jpg' },
    { id: 'esp-premium', name: 'Espetinho Premium', price: 15, description: 'Carne c/ bacon, frango c/ bacon, asinha ou cafta',            availability: QUA_QUI_SEX, image: '/images/menu/file-mignon-trinchado.jpg' },
  ]),

  sec('salgados', { title: 'Salgados Variados', emoji: '🥟' }, [
    { id: 'sg-mini-salgados', name: 'Mini Salgados (15 unid.)', price: 18, image: '/images/menu/smash-file.jpg' },
    { id: 'sg-mini-churros',  name: 'Mini Churros (10 unid.)',  price: 18, image: '/images/menu/acai-bowl.jpg' },
  ]),

  sec('acai', { title: 'Açaí', emoji: '🫐' }, [
    { id: 'ac-300', name: 'Açaí 300ml', price: 20, image: '/images/menu/acai-bowl.jpg' },
    { id: 'ac-500', name: 'Açaí 500ml', price: 25, image: '/images/menu/acai-bowl.jpg' },
    { id: 'ac-700', name: 'Açaí 700ml', price: 28, image: '/images/menu/acai-bowl.jpg' },
  ]),

  sec('sabores-regionais', { title: 'Sabores Regionais', emoji: '🌽', subtitle: 'Cuscuz do nordeste do jeito certo' }, [
    { id: 'cz-creme-queijo', name: 'Cuscuz Recheado com Creme de Queijo', price: 20, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cz-carne-sol',    name: 'Cuscuz Carne de Sol',                 price: 17, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cz-frango',       name: 'Cuscuz Frango',                       price: 15, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cz-calabresa',    name: 'Cuscuz Calabresa',                    price: 15, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cz-ovo',          name: 'Cuscuz Ovo',                          price: 12, image: '/images/menu/tapioca-nordestina.jpg' },
  ]),

  sec('crepioca', { title: 'Crepioca', emoji: '🥞' }, [
    { id: 'cr-carne-sol', name: 'Crepioca Carne de Sol', price: 20, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cr-frango',    name: 'Crepioca Frango',       price: 15, image: '/images/menu/tapioca-nordestina.jpg' },
    { id: 'cr-mista',     name: 'Crepioca Mista',        price: 10, image: '/images/menu/tapioca-nordestina.jpg' },
  ]),

  sec('panquecas', { title: 'Panquecas', emoji: '🫔', subtitle: 'Servidas com arroz solto, salada e batata palha' }, [
    { id: 'pq-carne-sol', name: 'Panqueca de Carne de Sol', price: 25, image: '/images/menu/file-parmegiana.jpg' },
    { id: 'pq-frango',    name: 'Panqueca de Frango',       price: 20, image: '/images/menu/file-parmegiana.jpg' },
  ]),

  sec('adicionais', { title: 'Adicionais', emoji: '➕' }, [
    { id: 'ad-bacon',     name: 'Bacon',     price: 3.5 },
    { id: 'ad-calabresa', name: 'Calabresa', price: 3.5 },
    { id: 'ad-file',      name: 'Filé',      price: 10  },
    { id: 'ad-frango',    name: 'Frango',    price: 7   },
    { id: 'ad-hamburguer',name: 'Hambúrguer',price: 5   },
    { id: 'ad-molho',     name: 'Molho',     price: 3   },
    { id: 'ad-ovo',       name: 'Ovo',       price: 3   },
    { id: 'ad-presunto',  name: 'Presunto',  price: 3   },
    { id: 'ad-queijo',    name: 'Queijo',    price: 3.5 },
    { id: 'ad-salsicha',  name: 'Salsicha',  price: 3   },
  ]),

  sec('refrigerantes', { title: 'Refrigerantes', emoji: '🥤', subtitle: 'Lata 350ml' }, [
    { id: 'rf-coca',        name: 'Coca-Cola Original ou Zero',            price: 7 },
    { id: 'rf-guarana',     name: 'Guaraná Antarctica Original ou Zero',   price: 7 },
    { id: 'rf-fanta',       name: 'Fanta Uva ou Laranja',                  price: 7 },
    { id: 'rf-sprite-zero', name: 'Sprite Zero',                           price: 7 },
  ]),

  sec('aguas', { title: 'Águas', emoji: '💧' }, [
    { id: 'ag-sem-gas-500',  name: 'Água Sem Gás 500ml', price: 3.5 },
    { id: 'ag-sem-gas-1500', name: 'Água Sem Gás 1,5L',  price: 6.5 },
    { id: 'ag-com-gas-500',  name: 'Água Com Gás 500ml', price: 4   },
  ]),

  sec('sucos', { title: 'Sucos', emoji: '🍊', subtitle: '300ml naturais e de polpa' }, [
    { id: 'sc-laranja',      name: 'Laranja Natural 300ml',                price: 12 },
    { id: 'sc-maracuja',     name: 'Polpa de Maracujá 300ml',              price: 12 },
    { id: 'sc-polpa-outras', name: 'Polpa 300ml (Acerola, Caju, Goiaba)',  price: 8  },
  ]),

  sec('energeticos', { title: 'Energéticos', emoji: '⚡' }, [
    { id: 'en-monster', name: 'Monster Original ou Zero',  price: 15 },
    { id: 'en-redbull', name: 'Red Bull Original ou Zero', price: 15 },
  ]),

];

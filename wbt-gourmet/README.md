# 🍽️ WBT Gourmet — Cardápio Digital & Delivery

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Zustand](https://img.shields.io/badge/Zustand-State_Management-764abc?style=for-the-badge)

Aplicação web moderna de cardápio digital e sistema de pedidos via WhatsApp para o **WBT Gourmet** (WBT Arena) em Mossoró-RN. Desenvolvido com **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TypeScript** e **Zustand**.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [✨ Principais Funcionalidades](#-principais-funcionalidades)
- [🎨 Design System & Identidade Gourmet](#-design-system--identidade-gourmet)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [⚡ Arquitetura do Cardápio & Manutenção](#-arquitetura-do-cardápio--manutenção)
- [🔌 Integração de Checkout & WhatsApp](#-integração-de-checkout--whatsapp)
- [🔒 LGPD & Privacidade](#-lgpd--privacidade)
- [🚀 Como Executar o Projeto](#-como-executar-o-projeto)
- [👨‍💻 Desenvolvedor](#-desenvolvedor)
- [📜 Licença](#-licença)

---

## 🔍 Visão Geral

O **WBT Gourmet** oferece uma experiência fluida, apetitosa e de alta conversão para clientes visualizarem pratos gourmet (filé mignon, camarão, petiscos, tapiocas, açaí, bebidas e mais), montarem seus pedidos no carrinho interativo e enviarem o pedido pronto para atendimento via WhatsApp com um único clique.

---

## ✨ Principais Funcionalidades

- 📱 **Cardápio Interativo por Categorias**: Navegação rápida com *scroll* suave, indicador de categoria ativa e filtro dinâmico por seções.
- 🛒 **Carrinho de Compras Dinâmico**: Gerenciado via **Zustand**, com gaveta (*drawer*) responsiva, controle de quantidades, subtotal em tempo real e animações fluidas (`Framer Motion`).
- 💬 **Checkout direto para WhatsApp**: Validação de dados no servidor via **Zod** e formatação automática de mensagem com o resumo detalhado do pedido para envio instantâneo ao atendimento.
- 🎨 **Redesign Completo Gourmet**: Identidade visual extraída da marca oficial — verde esmeralda, detalhes em rose e acentos em gold premium sobre background escuro orgânico.
- ⚡ **SEO & Schema.org**: Metadata enriquecida para restaurantes (`Restaurant` JSON-LD), OpenGraph, `sitemap.ts` e `robots.ts`.
- 🔒 **Conformidade LGPD**: Banner de consentimento de privacidade e página dedicada de Política de Privacidade (`/politica-de-privacidade`).

---

## 🎨 Design System & Identidade Gourmet

- **Paleta de Cores**:
  - `Verde Esmeralda (#4BA646)` — Cor primária, botões de ação e confiança
  - `Rose / Magenta (#C9587A)` — Badges de destaque e novidades
  - `Dourado Premium (#C49A3C)` — Exibição de preços e favoritos
  - `Dark Orgânico (#0E0F0D)` — Background sofisticado com textura sutil de cozinha
- **Tipografia Gastronômica**:
  - **Display**: `Playfair Display` (Serif elegante e sofisticada)
  - **Body**: `Manrope` (Excelente legibilidade no mobile e desktop)
  - **Mono**: `DM Mono` (Dados e valores financeiros)
- **Experiência de Compra (CRO)**:
  - Vermelho eliminado do fluxo de compra (reservado exclusivamente para alertas de validação real).
  - Botões de confirmação em verde pleno que transmitem segurança e fluidez.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend & Framework**
- **Next.js 16.3** (App Router, Server Components e Server Actions / API Routes)
- **React 19.2**
- **TypeScript 5**
- **Tailwind CSS v4** (`@theme` no CSS global)
- **Framer Motion 13** (animações e transições)
- **Lucide React** (ícones modernos)

### **Gerenciamento de Estado & Validação**
- **Zustand 5** (estado global reativo e leve do carrinho)
- **Zod 4** (validação estrita de esquemas no servidor)

### **Outras Bibliotecas**
- `@supabase/supabase-js` (integração com banco de dados Postgres/Supabase)
- `stripe` (suporte a pagamentos)
- `schema-dts` (tipagem TypeScript para Schema.org)

---

## 📁 Estrutura do Projeto

```
wbt-gourmet/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   └── checkout/
│   │       └── route.ts        # Endpoint de validação e link WhatsApp
│   ├── politica-de-privacidade/ # Página LGPD
│   ├── globals.css             # Design Tokens Gourmet (@theme Tailwind v4)
│   ├── layout.tsx              # Root Layout (Playfair Display, Manrope, DM Mono)
│   ├── page.tsx                # Página principal (Hero + Destaques + Cardápio)
│   ├── robots.ts               # Rastreamento SEO
│   └── sitemap.ts              # Sitemap XML
├── components/                 # Componentes React
│   ├── cart-drawer.tsx         # Drawer do carrinho e checkout WhatsApp
│   ├── hero.tsx                # Hero section com overlay cinematográfico
│   ├── hero-content.tsx        # Conteúdo do Hero e CTAs principais
│   ├── hero-video.tsx          # Background de vídeo
│   ├── menu-nav.tsx            # Navegação sticky por categorias
│   ├── menu-section.tsx        # Seções do cardápio com animação
│   ├── product-card.tsx        # Cards de produtos (com imagem, preço gold e CTA verde)
│   ├── sticky-cta.tsx          # Botão flutuante de carrinho
│   ├── court-divider.tsx       # Divisor ornamental com marca d'água de talheres
│   └── lgpd-banner.tsx         # Banner de consentimento LGPD
├── data/                       # Dados e regras de negócios
│   └── menu.ts                 # Cardápio otimizado (< 170 linhas com helper sec())
├── hooks/                      # Custom React Hooks
│   └── use-consent.ts          # Gerenciamento de consentimento LGPD
├── lib/                        # Utilitários
│   └── cn.ts                   # Utilitário de classes Tailwind
├── store/                      # Estado global
│   └── use-cart-store.ts       # Store do carrinho via Zustand
└── public/                     # Mídias estáticas e favicon
```

---

## ⚡ Arquitetura do Cardápio & Manutenção

O arquivo `data/menu.ts` foi refatorado para facilitar a manutenção de preços e produtos, reduzindo a duplicidade de dados:
- **Helper `sec()`**: Injeta automaticamente a categoria nos itens, eliminando linhas repetitivas.
- **Regra de Qualidade**: Estrutura mantida em menos de **170 linhas** de código limpo.
- **Como alterar preços**: Basta localizar o produto em `data/menu.ts` e alterar o valor numérico do campo `price`.

---

## 🔌 Integração de Checkout & WhatsApp

1. O cliente adiciona pratos ao carrinho ("Quero pedir").
2. Ao acessar a gaveta (*drawer*), digita o WhatsApp de contato.
3. O servidor em `/api/checkout` valida os itens com **Zod**, calcula o subtotal seguro e gera o link `wa.me` formatado.
4. O cliente é direcionado ao atendimento com o pedido totalmente estruturado.

---

## 🔒 LGPD & Privacidade

- Armazenamento de consentimento via `localStorage` com o hook `use-consent.ts`.
- Termos de privacidade completos disponíveis em `/politica-de-privacidade`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** >= 18.x
- **npm** / **yarn** / **pnpm** / **bun**

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/CelioCleiton40/wbtgourmet.git
   cd wbt-gourmet
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar no navegador:**
   Abra [http://localhost:3000](http://localhost:3000).

---

## 👨‍💻 Desenvolvedor

<table>
  <tr>
    <td align="center">
      <b>Célio Cleiton</b><br/>
      <sub>Estudante de Engenharia de Software</sub><br/>
      <a href="https://github.com/CelioCleiton40">@CelioCleiton40</a>
    </td>
  </tr>
</table>

---

## 📜 Licença

Desenvolvido por **Célio Cleiton** para **WBT Gourmet** · WBT Arena Mossoró-RN. Todos os direitos reservados.

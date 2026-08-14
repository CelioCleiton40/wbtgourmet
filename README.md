# 🍽️ WBT Gourmet — Cardápio Digital & Sistema de Pedidos Seguro

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Vitest-TDD-6E9F18?style=for-the-badge&logo=vitest)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Zod](https://img.shields.io/badge/Zod-Security_Validation-3E67B1?style=for-the-badge)

Aplicação web moderna de cardápio digital, sistema transacional de pedidos seguro e integração automatizada via WhatsApp / BotConversa para o **WBT Gourmet** (WBT Arena) em Mossoró-RN. 

Desenvolvido com **Clean Architecture**, **TDD (Test-Driven Development)**, **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Supabase (PostgreSQL RPC)**, **Zod** e **Vitest**.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [✨ Principais Funcionalidades](#-principais-funcionalidades)
- [🛡️ Arquitetura de Segurança e Anti-Adulteração](#️-arquitetura-de-segurança-e-anti-adulteração)
- [🏛️ Clean Architecture & Estrutura do Projeto](#️-clean-architecture--estrutura-do-projeto)
- [🛢️ Banco de Dados & Persistência Atômica no Supabase](#️-banco-de-dados--persistência-atômica-no-supabase)
- [🤖 Formatação para BotConversa & Agentes de IA](#-formatação-para-botconversa--agentes-de-ia)
- [🧪 Suíte de Testes Automatizados (TDD)](#-suíte-de-testes-automatizados-tdd)
- [🔒 LGPD & Privacidade](#-lgpd--privacidade)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🚀 Como Executar o Projeto](#-como-executar-o-projeto)
- [👨‍💻 Desenvolvedor](#-desenvolvedor)
- [📜 Licença](#-licença)

---

## 🔍 Visão Geral

O **WBT Gourmet** combina uma interface visualmente impressionante e de alta conversão (CRO) com um backend robusto construído sob os princípios da **Clean Architecture** e **SOLID**. 

O sistema permite que os clientes naveguem pelo cardápio, adicionem itens ao carrinho e finalizem o pedido com total garantia de integridade de preços, prevenindo manipulações do cliente, garantindo idempotência e enviando o pedido formatado diretamente para o atendimento e automação via WhatsApp / BotConversa.

---

## ✨ Principais Funcionalidades

- 📱 **Cardápio Interativo Otimizado**: Navegação por categorias com *scroll* suave, badges gastronômicas e suporte a horários/dias de disponibilidade.
- 🛒 **Carrinho Reativo & Idempotente**: Gerenciado via **Zustand**, com controle de quantidades, geração de UUID v4 para idempotência e gaveta (*drawer*) responsiva com animações fluidas (`Framer Motion`).
- 🛡️ **Checkout Transacional Seguro**: Endpoint oficial `POST /api/orders/create` (e adapter `/api/checkout`) com validação estrita no servidor.
- 💰 **Cálculo em Centavos Inteiros**: Representação monetária via Value Object `Money`, eliminando erros de arredondamento de ponto flutuante (`float`).
- 🤖 **Integração BotConversa & WhatsApp**: Formatação visual legível por humanos e estruturada com tags previsíveis para extração automática por agentes de IA (`#PEDIDO_WBT_XXXXXX`).
- 🛢️ **Persistência Atômica no Supabase**: Transações PostgreSQL via RPC atômica (`create_order_with_items`) garantindo integridade total do pedido e seus itens.
- 🔒 **Conformidade LGPD**: Mascaramento automático de telefones nos logs de auditoria (`5584******408`), política de privacidade e banner de consentimento.

---

## 🛡️ Arquitetura de Segurança e Anti-Adulteração

> **Princípio Fundamental**: *O frontend nunca é uma fonte confiável para preço, nome, subtotal, total ou status do pedido.*

1. **Contrato Estrito do Payload**:
   O cliente envia **apenas**:
   ```json
   {
     "items": [{ "id": "fm-gorgonzola", "quantity": 2 }],
     "customerPhone": "84988909408",
     "idempotencyKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   }
   ```
2. **Rejeição por `.strict()`**: Qualquer tentativa de injetar `price`, `name`, `total` ou `status` é rejeitada imediatamente pelo Zod (HTTP 400).
3. **Fonte de Verdade Oficial**: O backend consulta os dados do produto no catálogo oficial (`data/menu.ts`) e calcula o preço, subtotal e total no servidor.
4. **Limites de Payload e Rate Limiting**:
   - Tamanho do corpo limitado a 10KB (HTTP 413).
   - Limite de quantidade (1 a 50 por item, máximo 50 itens distintos).
   - Rate limiting por IP/telefone (máximo 10 requisições/minuto, HTTP 429).
5. **Idempotência**: Requisições repetidas com a mesma `idempotencyKey` retornam o pedido original sem duplicar registros no banco.

---

## 🏛️ Clean Architecture & Estrutura do Projeto

A aplicação segue rigorosamente a separação de responsabilidades em camadas desacopladas (`src/`):

```text
src/
├── domain/                         # Regras de Negócio e Entidades Puras
│   └── orders/
│       ├── entities/               # Order, OrderItem
│       ├── value-objects/          # Money (centavos), Phone (DDI 55), OrderCode (#WBT-XXXXXX)
│       └── repositories/           # Interfaces OrderRepository e ProductRepository
├── application/                    # Casos de Uso
│   └── orders/
│       └── create-order/           # CreateOrderUseCase
├── infrastructure/                 # Implementações Técnicas e Módulos Externos
│   ├── catalog/                    # MenuProductRepository (consulta data/menu.ts)
│   ├── messaging/                  # BotConversaMessageFormatter
│   ├── repositories/               # SupabaseOrderRepository & InMemoryOrderRepository
│   └── supabase/                   # ServerClient (Service Role Key exclusivo backend)
├── interfaces/                     # Controladores HTTP
│   └── http/
│       └── orders/
│           └── create/             # OrderController (Zod strict, 413, Rate Limiting)
└── shared/                         # Erros, Logger LGPD e Rate Limiter
    ├── errors/                     # DomainError, ProductNotFoundError, PersistenceError, etc.
    ├── rate-limit/                 # RateLimiter em memória
    └── utils/                      # Logger estruturado JSON
```

---

## 🛢️ Banco de Dados & Persistência Atômica no Supabase

O projeto inclui a migration SQL em `supabase/migrations/20260814_create_orders.sql`:

- **Tabela `orders`**: Armazena `id`, `order_code` (UNIQUE), `idempotency_key` (UNIQUE), `customer_phone`, `subtotal_cents`, `total_cents`, `total_items`, `status`, `created_at`.
- **Tabela `order_items`**: Armazena o snapshot comercial dos itens (`order_id`, `product_id`, `product_name`, `unit_price_cents`, `quantity`, `subtotal_cents`).
- **RPC PostgreSQL (`create_order_with_items`)**: Função atômica que insere a ordem e seus itens dentro de um único bloco de transação.
- **Resiliência / Fail-Safe**: Se a gravação no Supabase falhar, o servidor responde com **HTTP 503** e **jamais** gera o link do WhatsApp para garantir consistência.

---

## 🤖 Formatação para BotConversa & Agentes de IA

A mensagem enviada ao WhatsApp é gerada pelo `BotConversaMessageFormatter`:

```text
🍽️ *NOVO PEDIDO — WBT GOURMET*

━━━━━━━━━━━━━━━━━━
🧾 *PEDIDO #WBT-8F42A1*
━━━━━━━━━━━━━━━━━━

🛒 *ITENS*

1x Filé Mignon ao Molho de Gorgonzola
   R$ 45,00

2x Coca-Cola Original ou Zero
   R$ 7,00

━━━━━━━━━━━━━━━━━━
📦 *RESUMO*

Itens: 3
Subtotal: R$ 59,00
TOTAL: *R$ 59,00*
━━━━━━━━━━━━━━━━━━

👤 *CLIENTE*
WhatsApp: 5584988909408

🕐 Pedido recebido: 14/08/2026 08:48

🤖 *STATUS*
Aguardando confirmação do pagamento.

#PEDIDO_WBT_8F42A1
```

A URL final é montada usando `encodeURIComponent` sobre o texto formatado:
`https://wa.me/5584988909408?text=...`

---

## 🧪 Suíte de Testes Automatizados (TDD)

Executada via **Vitest**, a suíte contém **42 testes aprovados** com 100% de cobertura nos módulos críticos:

- **Domínio**: Testes unitários para `Money`, `Phone`, `OrderCode`, `Order` e `OrderItem`.
- **Caso de Uso**: Teste completo do `CreateOrderUseCase` com o repositório em memória.
- **Teste de Adulteração**: Injeção de `price: 0.01` rejeitada e precificação oficial mantida.
- **Idempotência**: Confirmação de reuso da ordem em requisições duplicadas.
- **Infraestrutura & HTTP**: Testes para `BotConversaMessageFormatter`, `RateLimiter`, `Logger` e controladores de rotas.

Para rodar os testes:
```bash
npm test
```

---

## 🔒 LGPD & Privacidade

- **Mascaramento de Dados**: Telefones são mascarados nos logs (`5584******408`).
- **Segredos Ocultos**: Chaves do Supabase e tokens são higienizados automaticamente pelo Logger (`[REDACTED]`).
- **Consentimento**: Banner e gerenciamento de preferências via `localStorage` em `/politica-de-privacidade`.

---

## 🛠️ Tecnologias Utilizadas

### **Backend & Arquitetura**
- **Next.js 16.3** (App Router & API Routes)
- **TypeScript 5**
- **Zod 4** (Validação estrita)
- **Supabase JS Client v2** (PostgreSQL RPC, RLS)
- **Vitest 4** (Runner de testes TDD)

### **Frontend & UI**
- **React 19.2**
- **Tailwind CSS v4** (`@theme` no CSS global)
- **Framer Motion 13** (Animações fluidas e gaveta do carrinho)
- **Zustand 5** (Gerenciamento de estado reativo)
- **Lucide React** (Ícones modernos)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** >= 18.x
- **npm** / **yarn** / **pnpm**

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

3. **Executar a suíte de testes:**
   ```bash
   npm test
   ```

4. **Verificar os tipos TypeScript e Linter:**
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

5. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. **Acessar no navegador:**
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

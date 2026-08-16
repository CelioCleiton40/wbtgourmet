# 🍽️ WBT Gourmet — Cardápio Digital & Sistema de Pedidos Seguro

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Stripe](https://img.shields.io/badge/Stripe-Checkout_Hosted-635BFF?style=for-the-badge&logo=stripe)
![Uber Direct](https://img.shields.io/badge/Uber_Direct-Delivery-000000?style=for-the-badge&logo=uber)
![Vitest](https://img.shields.io/badge/Vitest-98_Tests_Passed-6E9F18?style=for-the-badge&logo=vitest)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Zod](https://img.shields.io/badge/Zod-Security_Validation-3E67B1?style=for-the-badge)

Aplicação web moderna de cardápio digital, sistema transacional de pedidos seguro, integração com **Stripe Hosted Checkout**, **Uber Direct Delivery** e comunicação automatizada via WhatsApp / BotConversa para o **WBT Gourmet** (WBT Arena) em Mossoró-RN.

Desenvolvido com **Clean Architecture**, **TDD (Test-Driven Development)**, **Transactional Outbox Pattern Worker**, **Next.js 16 (App Router + Turbopack)**, **React 19**, **Tailwind CSS v4**, **Supabase (PostgreSQL RPC & RLS)**, **Zod** e **Vitest**.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [✨ Principais Funcionalidades](#-principais-funcionalidades)
- [🛡️ Arquitetura de Segurança do Checkout](#️-arquitetura-de-segurança-do-checkout)
- [🚗 Fluxo Transacional: Stripe Hosted Page + Uber Direct](#-fluxo-transacional-stripe-hosted-page--uber-direct)
- [🏛️ Clean Architecture & Estrutura do Projeto](#️-clean-architecture--estrutura-do-projeto)
- [🛢️ Banco de Dados & Outbox Pattern no Supabase](#️-banco-de-dados--outbox-pattern-no-supabase)
- [🤖 Formatação para BotConversa & Agentes de IA](#-formatação-para-botconversa--agentes-de-ia)
- [⚡ Desempenho & Benchmarks](#-desempenho--benchmarks)
- [🧪 Suíte de Testes Automatizados (98 Testes)](#-suíte-de-testes-automatizados-98-testes)
- [🔒 LGPD & Privacidade](#-lgpd--privacidade)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [🚀 Como Executar o Projeto](#-como-executar-o-projeto)
- [👨‍💻 Desenvolvedor](#-desenvolvedor)
- [📜 Licença](#-licença)

---

## 🔍 Visão Geral

O **WBT Gourmet** combina uma interface gastronômica impressionante com um backend resiliente construído sob os princípios da **Clean Architecture**, **SOLID** e **Transactional Outbox Pattern**.

O sistema desacopla o pagamento do envio da entrega. O cliente adiciona itens ao carrinho, calcula o frete em tempo real via **Uber Direct API**, realiza o pagamento seguro em página hospedada pelo **Stripe**, e o despacho do entregador é acionado assincronamente por um worker resiliente (`/api/crons/process-outbox`), garantindo zero perda de dados e idempotência total.

---

## ✨ Principais Funcionalidades

- 📱 **Cardápio Interativo Otimizado**: Navegação suave por categorias, badges gastronômicas, horários de disponibilidade e busca instantânea.
- 🛒 **Carrinho em Wizard de 2 Passos**:
  - **Passo 1**: Seleção de itens + WhatsApp para confirmação → criação da `Order` no servidor.
  - **Passo 2**: Endereço de entrega + cotação de frete Uber Direct → redirecionamento para o Stripe Hosted Checkout.
  - **Preservação do Carrinho**: O carrinho não é limpo ao ir para o Stripe; só é zerado após a confirmação real do pagamento.
- 💳 **Stripe Hosted Checkout Page**: O pagamento ocorre em página segura do Stripe. O backend valida a assinatura HMAC dos webhooks e checa o valor exato pago antes de confirmar o pedido.
- 🚚 **Cotação e Despacho Uber Direct**: Integração oficial com Uber Direct API para cotações dinâmicas por distância real, tratamento gracioso de raio de entrega (`DeliveryUndeliverableError`) e despacho automático via **Worker do Outbox Pattern** (`/api/crons/process-outbox`).
- 🔄 **Polling Ativo de Status (`/checkout/success`)**: Página de retorno com consulta dinâmica (`GET /api/orders/status?session_id=...`), exibindo confirmação e link de rastreio em tempo real.
- 💰 **Cálculo em Centavos Inteiros**: Representação monetária estrita via Value Object `Money`, eliminando erros de ponto flutuante.
- 🤖 **Integração BotConversa & WhatsApp**: Notificações formatadas e tag de identificação `#PEDIDO_WBT_XXXXXX` para leitura por robôs e humanos.
- ⚡ **Alta Performance**: Respostas de UseCases abaixo de **1ms**, bundle otimizado com `next/dynamic` e build 100% estático/dinâmico com Next.js Turbopack.

---

## 🛡️ Arquitetura de Segurança do Checkout

> **Invariante Fundamental**: *O frontend nunca é uma fonte confiável para preços, subtotais, totais, taxas de entrega ou URLs de retorno.*

1. **Payload Estrito no Servidor**:
   O cliente envia apenas as referências opacas:
   ```json
   {
     "orderId": "WBT-8F42A1",
     "idempotencyKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
   }
   ```
2. **Rejeição por `.strict()`**: Qualquer tentativa de enviar `total`, `price`, `successUrl` ou `cancelUrl` no body é rejeitada com HTTP 400.
3. **URLs Construídas no Servidor**: `success_url` e `cancel_url` usam a variável de ambiente `NEXT_PUBLIC_BASE_URL` configurada no servidor.
4. **Validação Financeira Estrita no Webhook**:
   Ao receber o webhook `checkout.session.completed`, o backend verifica:
   - `payment_status === 'paid'`
   - `session.amount_total === order.total_cents`
   - `currency === 'brl'`
   *Qualquer divergência gera um alerta de incidente e não confirma o pagamento.*
5. **Cotação de Frete Persistida**: A cotação da Uber Direct é salva no banco de dados com timestamp de expiração (`expiresAt`). Cotações expiradas (> 15 min) são rejeitadas (HTTP 410).

---

## 🚗 Fluxo Transacional: Stripe Hosted Page + Uber Direct

```text
[Cliente] Seleciona Itens + Informa WhatsApp
   │
   ▼
POST /api/orders/create ──► Backend calcula subtotal com preços oficiais
   │
   ▼
[Cliente] Digita Endereço ──► POST /api/deliveries/quote ──► Uber Direct API
   │                                                             │
   ▼                                                             ▼
Visualiza Frete ◄────────────────────────────── Persiste DeliveryQuote (expiresAt)
   │
   ▼
POST /api/payments/create-checkout-session (Servidor cria line_items do banco)
   │
   ▼
Redireciona para Stripe Hosted Checkout (Carrinho permanece salvo)
   │
   ├──────► [Cliente Cancela] ──► /checkout/cancel (Carrinho mantido intacto)
   │
   ▼
[Cliente Paga com Cartão]
   │
   ├──────► Stripe Webhook ──► POST /api/webhooks/stripe (valida HMAC + amount_total)
   │                               │
   │                               ├──► order_status = payment_confirmed
   │                               └──► outbox_events.insert('delivery.requested')
   │                                       │
   │                                       ▼
   │                                 Outbox Worker ──► Uber Direct createDelivery
   │
   ▼
Redireciona ──► /checkout/success?session_id=cs_...
   │
   ▼
Polling GET /api/orders/status?session_id=... ──► payment_confirmed ──► Limpa Carrinho + Rastreio Uber
```

---

## 🏛️ Clean Architecture & Estrutura do Projeto

A aplicação segue rigorosamente a separação de responsabilidades em camadas desacopladas em `src/`:

```text
src/
├── domain/                         # Regras de Negócio e Entidades Puras
│   ├── deliveries/                 # Delivery, DeliveryQuote, DeliveryGateway, DeliveryQuoteRepository
│   ├── orders/                     # Order, OrderItem, Money, Phone, OrderCode, OrderRepository
│   └── payments/                   # Payment, CheckoutSession, PaymentGateway, CheckoutSessionRepository
├── application/                    # Casos de Uso
│   ├── deliveries/                 # QuoteDeliveryUseCase, ProcessOutboxDeliveryUseCase, ProcessUberWebhookUseCase
│   ├── orders/                     # CreateOrderUseCase, GetOrderStatusUseCase
│   └── payments/                   # CreateCheckoutSessionUseCase, ProcessStripeWebhookUseCase, CreatePaymentIntentUseCase
├── infrastructure/                 # Implementações Técnicas e Módulos Externos
│   ├── catalog/                    # MenuProductRepository (consulta data/menu.ts)
│   ├── messaging/                  # BotConversaMessageFormatter
│   ├── repositories/               # Supabase & InMemory Repositories (Order, Quote, Session, Outbox)
│   ├── stripe/                     # StripePaymentGateway (Checkout Sessions & Webhook HMAC)
│   ├── supabase/                   # ServerClient (Service Role Key exclusivo backend)
│   └── uber-direct/                # UberDirectGateway & UberTokenProvider (OAuth Cache)
├── interfaces/                     # Controladores HTTP
│   └── http/orders/create/         # OrderController (Zod strict, Rate Limiting)
└── shared/                         # Erros, Logger LGPD e Rate Limiter
```

---

## 🛢️ Banco de Dados & Outbox Pattern no Supabase

As migrações SQL estão organizadas na pasta `supabase/migrations/`:

1. **`20260814_create_orders.sql`**: Tabelas `orders` e `order_items` com a RPC atômica `create_order_with_items`.
2. **`20260814_add_payments_deliveries_outbox.sql`**: Tabelas `payments`, `delivery_quotes`, `deliveries`, deduplicação de webhooks e `outbox_events`.
3. **`20260814_add_checkout_sessions_and_delivery_fee.sql`**: Tabela `checkout_sessions` com RLS e suporte a frete no pedido.

---

## ⚡ Desempenho & Benchmarks

Medido em ambiente de testes com **500 operações sequenciais**:

- ⚡ **`QuoteDeliveryUseCase`**: `0,62ms` / chamada (`1.608 ops/sec`)
- ⚡ **`CreateOrderUseCase`**: `0,58ms` / chamada (`1.703 ops/sec`)
- ⚡ **`CreateCheckoutSessionUseCase`**: `0,10ms` / chamada (`9.172 ops/sec`)
- ⚡ **`GetOrderStatusUseCase`**: `0,003ms` / chamada (`349.430 ops/sec`)
- 📦 **Next.js Production Build**: **17 páginas estáticas/dinâmicas compilaram com 0 erros em 51s**.

---

## 🧪 Suíte de Testes Automatizados (91 Testes)

Executada via **Vitest**, a suíte contém **91 testes aprovados (100% de sucesso)** distribuídos em 22 arquivos:

```text
 Test Files  22 passed (22)
      Tests  91 passed (91)
   Start at  16:51:35
   Duration  13.17s
```

### Principais Coberturas:
- **Sessões Stripe Hosted**: Validações de expirados, cancelados, pagamentos parciais e idempotência (`CreateCheckoutSessionUseCase`).
- **Webhooks Stripe & Uber**: Testes estritos de validação HMAC e idempotência de eventos (`ProcessStripeWebhookUseCase`).
- **Invariante Financeiro**: Garantia de que `total = subtotal + deliveryFeeCents`.
- **Cotação & Expiração**: Testes de expiração de frete em 15 min e vínculo imutável com `linkToOrder`.

Para rodar os testes:
```bash
npm test
```

---

## 🔒 LGPD & Privacidade

- **Mascaramento de Dados**: Telefones são mascarados automaticamente nos logs (`5584******408`).
- **Segredos Ocultos**: Chaves de API, webhooks e tokens são higienizados pelo `Logger` (`[REDACTED]`).
- **Políticas de Ignoração Git**: `.env.local`, `scratch/` e `.gemini/` estão listados no `.gitignore`.

---

## 🛠️ Tecnologias Utilizadas

### **Backend & Arquitetura**
- **Next.js 16.3** (App Router, Turbopack, API Routes)
- **TypeScript 5**
- **Zod 4** (Validação estrita de schemas)
- **Stripe Node SDK** (Hosted Checkout & Webhooks HMAC)
- **Uber Direct API** (OAuth 2.0 Client Credentials com cache de token)
- **Supabase JS Client v2** (PostgreSQL RPC, Row Level Security)
- **Vitest 4** (Runner de testes TDD)

### **Frontend & UI**
- **React 19.2**
- **Tailwind CSS v4** (`@theme` no CSS global)
- **Framer Motion 13** (Animações do carrinho e status de checkout)
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

3. **Configurar as variáveis de ambiente (`.env.local`):**
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   UBER_DIRECT_CLIENT_ID=...
   UBER_DIRECT_CLIENT_SECRET=...
   UBER_DIRECT_CUSTOMER_ID=...
   UBER_DIRECT_WEBHOOK_SIGNING_KEY=...
   ```

4. **Executar a suíte de testes:**
   ```bash
   npm test
   ```

5. **Testar o build de produção:**
   ```bash
   npm run build
   ```

6. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

7. **Acessar no navegador:**
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

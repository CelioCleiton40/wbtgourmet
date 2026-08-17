-- ============================================================================
-- WBT Gourmet - Schema SQL Hardened
-- PostgreSQL / Supabase
--
-- Objetivo:
--   - impedir acesso direto do cliente às tabelas sensíveis;
--   - impedir execução pública da RPC de criação de pedidos;
--   - eliminar SECURITY DEFINER desnecessário;
--   - validar integridade financeira e de itens no banco;
--   - validar status, moeda e dados críticos;
--   - reduzir risco de SQL/RPC abuse, IDOR e manipulação de valores.
--
-- IMPORTANTE:
--   Este banco deve ser acessado pelo backend/Edge Function usando
--   SUPABASE_SERVICE_ROLE_KEY. A service role NUNCA deve ir para o navegador.
-- ============================================================================

-- ============================================================================
-- 1. Tabela Principal de Pedidos (orders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    customer_phone TEXT NOT NULL,
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
    delivery_quote_id UUID,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    total_items INTEGER NOT NULL CHECK (total_items > 0),
    status TEXT NOT NULL DEFAULT 'pending_payment',
    raw_message TEXT,
    pickup_address_snapshot JSONB,
    dropoff_address_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT orders_status_chk CHECK (
        status IN (
            'pending_payment',
            'paid',
            'preparing',
            'ready',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'failed'
        )
    ),
    CONSTRAINT orders_phone_len_chk CHECK (length(btrim(customer_phone)) BETWEEN 8 AND 32),
    CONSTRAINT orders_order_code_len_chk CHECK (length(btrim(order_code)) BETWEEN 3 AND 64),
    CONSTRAINT orders_idempotency_key_len_chk CHECK (length(btrim(idempotency_key)) BETWEEN 8 AND 128)
);

-- ============================================================================
-- 2. Itens do Pedido
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 100),
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT order_items_product_id_chk CHECK (length(btrim(product_id)) BETWEEN 1 AND 128),
    CONSTRAINT order_items_product_name_chk CHECK (length(btrim(product_name)) BETWEEN 1 AND 200)
);

-- ============================================================================
-- 3. Cotações de Entrega
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'uber_direct',
    provider_quote_id TEXT NOT NULL,
    fee_cents INTEGER NOT NULL CHECK (fee_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT delivery_quotes_status_chk CHECK (status IN ('active', 'expired', 'used')),
    CONSTRAINT delivery_quotes_currency_chk CHECK (currency = 'BRL'),
    CONSTRAINT delivery_quotes_provider_chk CHECK (provider IN ('uber_direct')),
    CONSTRAINT delivery_quotes_provider_quote_id_chk CHECK (
        length(btrim(provider_quote_id)) BETWEEN 1 AND 255
    )
);

-- ============================================================================
-- 4. FK da cotação em orders
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_orders_delivery_quote'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_delivery_quote
        FOREIGN KEY (delivery_quote_id)
        REFERENCES public.delivery_quotes(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 5. Pagamentos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'stripe',
    provider_payment_id TEXT NOT NULL UNIQUE,
    checkout_session_id TEXT UNIQUE,
    checkout_session_status TEXT NOT NULL DEFAULT 'pending',
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_provider_chk CHECK (provider IN ('stripe')),
    CONSTRAINT payments_currency_chk CHECK (currency = 'BRL'),
    CONSTRAINT payments_status_chk CHECK (
        status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')
    ),
    CONSTRAINT payments_checkout_status_chk CHECK (
        checkout_session_status IN ('pending', 'open', 'complete', 'expired')
    )
);

-- ============================================================================
-- 6. Entregas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'uber_direct',
    provider_delivery_id TEXT UNIQUE,
    tracking_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    pickup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT deliveries_provider_chk CHECK (provider IN ('uber_direct')),
    CONSTRAINT deliveries_status_chk CHECK (
        status IN (
            'pending',
            'accepted',
            'pickup',
            'picked_up',
            'in_transit',
            'delivered',
            'cancelled',
            'failed'
        )
    )
);

-- ============================================================================
-- 7. Deduplicação de Webhooks Stripe
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT stripe_webhook_event_id_chk CHECK (length(btrim(event_id)) BETWEEN 1 AND 255),
    CONSTRAINT stripe_webhook_event_type_chk CHECK (length(btrim(event_type)) BETWEEN 1 AND 255)
);

-- ============================================================================
-- 8. Deduplicação de Webhooks Uber Direct
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uber_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uber_webhook_event_id_chk CHECK (length(btrim(event_id)) BETWEEN 1 AND 255),
    CONSTRAINT uber_webhook_event_type_chk CHECK (length(btrim(event_type)) BETWEEN 1 AND 255)
);

-- ============================================================================
-- 9. Outbox Pattern
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT outbox_status_chk CHECK (status IN ('pending', 'processing', 'processed', 'completed', 'failed')),
    CONSTRAINT outbox_attempts_chk CHECK (attempts >= 0 AND attempts <= 100)
);

-- ============================================================================
-- 10. Checkout Sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    stripe_session_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'brl',
    status TEXT NOT NULL DEFAULT 'open',
    success_url TEXT NOT NULL,
    cancel_url TEXT NOT NULL,
    delivery_quote_id UUID REFERENCES public.delivery_quotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT checkout_sessions_currency_chk CHECK (lower(currency) = 'brl'),
    CONSTRAINT checkout_sessions_status_chk CHECK (status IN ('open', 'complete', 'expired')),
    CONSTRAINT checkout_sessions_success_url_chk CHECK (length(btrim(success_url)) BETWEEN 1 AND 2048),
    CONSTRAINT checkout_sessions_cancel_url_chk CHECK (length(btrim(cancel_url)) BETWEEN 1 AND 2048)
);

-- ============================================================================
-- 11. Índices
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_session_id
    ON public.payments(checkout_session_id)
    WHERE checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_order_id
    ON public.delivery_quotes(order_id)
    WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_active
    ON public.delivery_quotes(order_id)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_provider_quote_id
    ON public.delivery_quotes(provider_quote_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_id ON public.deliveries(provider_delivery_id);
CREATE INDEX IF NOT EXISTS idx_outbox_events_status_available
    ON public.outbox_events(status, available_at);
CREATE INDEX IF NOT EXISTS idx_outbox_events_pending
    ON public.outbox_events(created_at)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_id ON public.checkout_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id
    ON public.checkout_sessions(stripe_session_id);

-- ============================================================================
-- 12. RPC SEGURA de criação de pedido
--
-- A RPC:
--   1) NÃO é SECURITY DEFINER;
--   2) rejeita payloads malformados;
--   3) valida quantidade de itens;
--   4) NÃO confia em subtotal/total enviados pelo cliente;
--   5) recalcula subtotal a partir dos itens;
--   6) recalcula taxa a partir da delivery quote;
--   7) valida expiração da cotação;
--   8) valida aritmética item x quantidade;
--   9) valida total_items;
--  10) grava tudo na mesma transação.
--
-- Ela deve ser chamada SOMENTE pelo backend com service_role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items(
    order_payload JSONB,
    items_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    new_order_id UUID;
    new_order JSONB;
    supplied_order_code TEXT;
    supplied_idempotency_key TEXT;
    supplied_customer_phone TEXT;
    supplied_status TEXT;
    supplied_raw_message TEXT;
    supplied_delivery_quote_id UUID;
    supplied_created_at TIMESTAMPTZ;

    calculated_subtotal BIGINT := 0;
    calculated_total BIGINT := 0;
    calculated_total_items INTEGER := 0;
    calculated_delivery_fee INTEGER := 0;

    item_rec RECORD;
    item JSONB;
    item_unit_price BIGINT;
    item_quantity INTEGER;
    item_subtotal BIGINT;
    quote_currency TEXT;
    quote_status TEXT;
    quote_expires_at TIMESTAMPTZ;
    quote_order_id UUID;
BEGIN
    -- ------------------------------------------------------------------------
    -- 12.1 Validação estrutural
    -- ------------------------------------------------------------------------
    IF order_payload IS NULL OR jsonb_typeof(order_payload) <> 'object' THEN
        RAISE EXCEPTION 'order_payload deve ser um objeto JSON'
            USING ERRCODE = '22023';
    END IF;

    IF items_payload IS NULL OR jsonb_typeof(items_payload) <> 'array' THEN
        RAISE EXCEPTION 'items_payload deve ser um array JSON'
            USING ERRCODE = '22023';
    END IF;

    IF jsonb_array_length(items_payload) < 1 OR jsonb_array_length(items_payload) > 100 THEN
        RAISE EXCEPTION 'O pedido deve possuir entre 1 e 100 itens'
            USING ERRCODE = '22023';
    END IF;

    supplied_order_code := NULLIF(btrim(order_payload->>'order_code'), '');
    supplied_idempotency_key := NULLIF(btrim(order_payload->>'idempotency_key'), '');
    supplied_customer_phone := NULLIF(btrim(order_payload->>'customer_phone'), '');
    supplied_status := COALESCE(NULLIF(btrim(order_payload->>'status'), ''), 'pending_payment');
    supplied_raw_message := order_payload->>'raw_message';

    IF supplied_order_code IS NULL OR length(supplied_order_code) > 64 THEN
        RAISE EXCEPTION 'order_code inválido'
            USING ERRCODE = '22023';
    END IF;

    IF supplied_idempotency_key IS NULL
       OR length(supplied_idempotency_key) < 8
       OR length(supplied_idempotency_key) > 128 THEN
        RAISE EXCEPTION 'idempotency_key inválido'
            USING ERRCODE = '22023';
    END IF;

    IF supplied_customer_phone IS NULL
       OR length(supplied_customer_phone) < 8
       OR length(supplied_customer_phone) > 32 THEN
        RAISE EXCEPTION 'customer_phone inválido'
            USING ERRCODE = '22023';
    END IF;

    IF supplied_status <> 'pending_payment' THEN
        RAISE EXCEPTION 'Somente pedidos novos podem ser criados com status pending_payment'
            USING ERRCODE = '22023';
    END IF;

    -- created_at é controlado pelo banco. O cliente não pode forjar data.
    supplied_created_at := NOW();

    -- ------------------------------------------------------------------------
    -- 12.2 Validação da delivery quote
    -- ------------------------------------------------------------------------
    IF NULLIF(btrim(order_payload->>'delivery_quote_id'), '') IS NOT NULL THEN
        BEGIN
            supplied_delivery_quote_id := (order_payload->>'delivery_quote_id')::UUID;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'delivery_quote_id inválido'
                USING ERRCODE = '22023';
        END;

        SELECT
            dq.fee_cents,
            dq.currency,
            dq.status,
            dq.expires_at,
            dq.order_id
        INTO
            calculated_delivery_fee,
            quote_currency,
            quote_status,
            quote_expires_at,
            quote_order_id
        FROM public.delivery_quotes dq
        WHERE dq.id = supplied_delivery_quote_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cotação de entrega não encontrada'
                USING ERRCODE = 'P0002';
        END IF;

        IF quote_order_id IS NOT NULL THEN
            RAISE EXCEPTION 'Cotação de entrega já vinculada a outro pedido'
                USING ERRCODE = '23505';
        END IF;

        IF quote_status <> 'active' OR quote_expires_at <= NOW() THEN
            RAISE EXCEPTION 'Cotação de entrega expirada ou indisponível'
                USING ERRCODE = '22023';
        END IF;

        IF quote_currency <> 'BRL' THEN
            RAISE EXCEPTION 'Moeda da cotação inválida'
                USING ERRCODE = '22023';
        END IF;
    ELSE
        supplied_delivery_quote_id := NULL;
    END IF;

    -- ------------------------------------------------------------------------
    -- 12.3 Recalcula os valores dos itens
    -- ------------------------------------------------------------------------
    FOR item_rec IN SELECT value FROM jsonb_array_elements(items_payload)
    LOOP
        item := item_rec.value;

        IF jsonb_typeof(item) <> 'object' THEN
            RAISE EXCEPTION 'Cada item deve ser um objeto JSON'
                USING ERRCODE = '22023';
        END IF;

        IF NULLIF(btrim(item->>'product_id'), '') IS NULL
           OR length(btrim(item->>'product_id')) > 128 THEN
            RAISE EXCEPTION 'product_id inválido'
                USING ERRCODE = '22023';
        END IF;

        IF NULLIF(btrim(item->>'product_name'), '') IS NULL
           OR length(btrim(item->>'product_name')) > 200 THEN
            RAISE EXCEPTION 'product_name inválido'
                USING ERRCODE = '22023';
        END IF;

        BEGIN
            item_unit_price := (item->>'unit_price_cents')::BIGINT;
            item_quantity := (item->>'quantity')::INTEGER;
            item_subtotal := (item->>'subtotal_cents')::BIGINT;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Preço, quantidade ou subtotal de item inválido'
                USING ERRCODE = '22023';
        END;

        IF item_unit_price < 0 OR item_unit_price > 2147483647 THEN
            RAISE EXCEPTION 'unit_price_cents fora do limite'
                USING ERRCODE = '22023';
        END IF;

        IF item_quantity <= 0 OR item_quantity > 100 THEN
            RAISE EXCEPTION 'quantity fora do limite'
                USING ERRCODE = '22023';
        END IF;

        IF item_subtotal <> item_unit_price * item_quantity THEN
            RAISE EXCEPTION 'Subtotal do item não corresponde ao preço x quantidade'
                USING ERRCODE = '22023';
        END IF;

        IF item_subtotal > 2147483647 THEN
            RAISE EXCEPTION 'Subtotal do item excede o limite suportado'
                USING ERRCODE = '22023';
        END IF;

        calculated_subtotal := calculated_subtotal + item_subtotal;
        calculated_total_items := calculated_total_items + item_quantity;

        IF calculated_subtotal > 2147483647 OR calculated_total_items > 2147483647 THEN
            RAISE EXCEPTION 'Totais do pedido excedem o limite suportado'
                USING ERRCODE = '22023';
        END IF;
    END LOOP;

    calculated_total := calculated_subtotal + calculated_delivery_fee;

    IF calculated_total > 2147483647 THEN
        RAISE EXCEPTION 'Total do pedido excede o limite suportado'
            USING ERRCODE = '22023';
    END IF;

    -- ------------------------------------------------------------------------
    -- 12.4 Criação atômica do pedido
    -- ------------------------------------------------------------------------
    INSERT INTO public.orders (
        order_code,
        idempotency_key,
        customer_phone,
        subtotal_cents,
        delivery_fee_cents,
        delivery_quote_id,
        total_cents,
        total_items,
        status,
        raw_message,
        created_at,
        updated_at
    )
    VALUES (
        supplied_order_code,
        supplied_idempotency_key,
        supplied_customer_phone,
        calculated_subtotal::INTEGER,
        calculated_delivery_fee,
        supplied_delivery_quote_id,
        calculated_total::INTEGER,
        calculated_total_items,
        'pending_payment',
        supplied_raw_message,
        supplied_created_at,
        supplied_created_at
    )
    RETURNING id INTO new_order_id;

    INSERT INTO public.order_items (
        order_id,
        product_id,
        product_name,
        unit_price_cents,
        quantity,
        subtotal_cents
    )
    SELECT
        new_order_id,
        btrim(elem.value->>'product_id'),
        btrim(elem.value->>'product_name'),
        (elem.value->>'unit_price_cents')::INTEGER,
        (elem.value->>'quantity')::INTEGER,
        (elem.value->>'subtotal_cents')::INTEGER
    FROM jsonb_array_elements(items_payload) AS elem(value);

    IF supplied_delivery_quote_id IS NOT NULL THEN
        UPDATE public.delivery_quotes
        SET
            order_id = new_order_id,
            status = 'used'
        WHERE id = supplied_delivery_quote_id;
    END IF;

    SELECT to_jsonb(o)
    INTO new_order
    FROM public.orders o
    WHERE o.id = new_order_id;

    RETURN new_order;
END;
$$;

-- ============================================================================
-- 13. Privilégios e RLS
--
-- Regra:
--   - anon/authenticated NÃO acessam tabelas de pedidos;
--   - anon/authenticated NÃO executam a RPC de criação;
--   - somente backend com service_role executa essa operação.
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uber_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Bloqueio explícito no nível de privilégio.
REVOKE ALL ON TABLE
    public.orders,
    public.order_items,
    public.payments,
    public.delivery_quotes,
    public.deliveries,
    public.stripe_webhook_events,
    public.uber_webhook_events,
    public.outbox_events,
    public.checkout_sessions
FROM anon, authenticated;

-- A service_role já possui Bypass RLS no Supabase, mas mantemos
-- concessão explícita para deixar a intenção de acesso inequívoca.
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE
    public.orders,
    public.order_items,
    public.payments,
    public.delivery_quotes,
    public.deliveries,
    public.stripe_webhook_events,
    public.uber_webhook_events,
    public.outbox_events,
    public.checkout_sessions
TO service_role;

-- Remover execução pública da função é FUNDAMENTAL.
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb)
TO service_role;

-- Não conceder função a anon/authenticated.
-- O frontend deve chamar uma API/Edge Function do backend.
-- A Edge Function usa SUPABASE_SERVICE_ROLE_KEY em ambiente servidor.

-- ============================================================================
-- 14. Políticas RLS mínimas
--
-- Não criamos políticas para anon/authenticated porque elas não devem
-- acessar pedidos diretamente. service_role bypassa RLS no Supabase.
-- ============================================================================

-- ============================================================================
-- 15. Proteções adicionais contra dados abusivos em funções futuras
-- ============================================================================
COMMENT ON FUNCTION public.create_order_with_items(jsonb, jsonb)
IS 'RPC interna do backend. Nunca expor ao cliente. Executar somente via service_role. Valores financeiros são recalculados no banco.';
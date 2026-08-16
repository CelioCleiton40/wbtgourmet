-- ====================================================================
-- WBT Gourmet - Schema SQL Completo (Executar no SQL Editor do Supabase)
-- ====================================================================

-- 1. Tabela Principal de Pedidos (orders)
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Itens do Pedido (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Cotações de Entrega (delivery_quotes)
CREATE TABLE IF NOT EXISTS public.delivery_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'uber_direct',
    provider_quote_id TEXT NOT NULL,
    fee_cents INTEGER NOT NULL CHECK (fee_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, expired, used
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar FK de delivery_quote_id em orders apontando para delivery_quotes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_delivery_quote'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT fk_orders_delivery_quote
        FOREIGN KEY (delivery_quote_id) REFERENCES public.delivery_quotes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Tabela de Pagamentos (payments)
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Entregas (deliveries)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'uber_direct',
    provider_delivery_id TEXT UNIQUE,
    tracking_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    pickup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de Deduplicação de Webhooks do Stripe (stripe_webhook_events)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabela de Deduplicação de Webhooks do Uber Direct (uber_webhook_events)
CREATE TABLE IF NOT EXISTS public.uber_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabela do Outbox Pattern (outbox_events)
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tabela de Checkout Sessions (checkout_sessions)
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Índices de Desempenho
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_session_id ON public.payments(checkout_session_id) WHERE checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_order_id ON public.delivery_quotes(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_active ON public.delivery_quotes(order_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_provider_quote_id ON public.delivery_quotes(provider_quote_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_id ON public.deliveries(provider_delivery_id);
CREATE INDEX IF NOT EXISTS idx_outbox_events_status_available ON public.outbox_events(status, available_at);
CREATE INDEX IF NOT EXISTS idx_outbox_events_pending ON public.outbox_events(created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_id ON public.checkout_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON public.checkout_sessions(stripe_session_id);

-- 11. Função Atômica PostgreSQL para Criação de Pedido com Itens
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    order_payload JSONB,
    items_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id UUID;
    new_order    JSONB;
BEGIN
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
        created_at
    )
    VALUES (
        order_payload->>'order_code',
        order_payload->>'idempotency_key',
        order_payload->>'customer_phone',
        (order_payload->>'subtotal_cents')::INTEGER,
        COALESCE((order_payload->>'delivery_fee_cents')::INTEGER, 0),
        CASE WHEN order_payload->>'delivery_quote_id' IS NOT NULL AND order_payload->>'delivery_quote_id' != ''
             THEN (order_payload->>'delivery_quote_id')::UUID
             ELSE NULL END,
        (order_payload->>'total_cents')::INTEGER,
        (order_payload->>'total_items')::INTEGER,
        COALESCE(order_payload->>'status', 'pending_payment'),
        order_payload->>'raw_message',
        COALESCE((order_payload->>'created_at')::TIMESTAMPTZ, NOW())
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
        (item->>'product_id'),
        (item->>'product_name'),
        (item->>'unit_price_cents')::INTEGER,
        (item->>'quantity')::INTEGER,
        (item->>'subtotal_cents')::INTEGER
    FROM jsonb_array_elements(items_payload) AS item;

    SELECT to_jsonb(o) INTO new_order
    FROM public.orders o WHERE o.id = new_order_id;

    RETURN new_order;
END;
$$;

-- 12. Habilitar RLS & Políticas para Service Role
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uber_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Orders') THEN
        CREATE POLICY "Service Role Full Access Orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Order Items') THEN
        CREATE POLICY "Service Role Full Access Order Items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Payments') THEN
        CREATE POLICY "Service Role Full Access Payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Delivery Quotes') THEN
        CREATE POLICY "Service Role Full Access Delivery Quotes" ON public.delivery_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Deliveries') THEN
        CREATE POLICY "Service Role Full Access Deliveries" ON public.deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Stripe Webhooks') THEN
        CREATE POLICY "Service Role Full Access Stripe Webhooks" ON public.stripe_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Uber Webhooks') THEN
        CREATE POLICY "Service Role Full Access Uber Webhooks" ON public.uber_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Outbox') THEN
        CREATE POLICY "Service Role Full Access Outbox" ON public.outbox_events FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role Full Access Checkout Sessions') THEN
        CREATE POLICY "Service Role Full Access Checkout Sessions" ON public.checkout_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ====================================================================
-- WBT Gourmet - Schema SQL: Payments, Deliveries, Webhooks & Outbox Pattern
-- ====================================================================

-- 1. Estender tabela orders para incluir frete e snapshots de endereço
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_fee_cents INTEGER DEFAULT 0 CHECK (delivery_fee_cents >= 0),
ADD COLUMN IF NOT EXISTS pickup_address_snapshot JSONB,
ADD COLUMN IF NOT EXISTS dropoff_address_snapshot JSONB;

-- 2. Tabela de Pagamentos (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'stripe',
    provider_payment_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- 4. Tabela de Entregas (deliveries)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'uber_direct',
    provider_delivery_id TEXT UNIQUE,
    tracking_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, quoted, scheduled, courier_assigned, pickup, in_transit, delivered, failed, cancelled
    pickup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Deduplicação de Webhooks do Stripe (stripe_webhook_events)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de Deduplicação de Webhooks do Uber Direct (uber_webhook_events)
CREATE TABLE IF NOT EXISTS public.uber_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Tabela do Outbox Pattern para Despacho Assíncrono (outbox_events)
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- ex: delivery.requested
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_id ON public.deliveries(provider_delivery_id);
CREATE INDEX IF NOT EXISTS idx_outbox_events_status_available ON public.outbox_events(status, available_at);

-- 9. Habilitar RLS em todas as novas tabelas
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uber_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access Payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Delivery Quotes" ON public.delivery_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Deliveries" ON public.deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Stripe Webhooks" ON public.stripe_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Uber Webhooks" ON public.uber_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Outbox" ON public.outbox_events FOR ALL TO service_role USING (true) WITH CHECK (true);

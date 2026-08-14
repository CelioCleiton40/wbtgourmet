-- ====================================================================
-- WBT Gourmet - Schema SQL para Gestão Transacional de Pedidos (Supabase)
-- ====================================================================

-- 1. Criar Tabela Principal de Pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    customer_phone TEXT NOT NULL,
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    total_items INTEGER NOT NULL CHECK (total_items > 0),
    status TEXT NOT NULL DEFAULT 'pending_payment',
    raw_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar Tabela de Itens do Pedido (order_items) - Snapshot do momento da compra
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

-- 3. Índices Estratégicos para Alta Performance de Consulta
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 4. Função/RPC PostgreSQL para Criação Atômica de Pedido com Itens
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    order_payload JSONB,
    items_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id UUID;
    item_elem JSONB;
BEGIN
    -- Inserir Pedido Principal
    INSERT INTO public.orders (
        order_code,
        idempotency_key,
        customer_phone,
        subtotal_cents,
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
        (order_payload->>'total_cents')::INTEGER,
        (order_payload->>'total_items')::INTEGER,
        COALESCE(order_payload->>'status', 'pending_payment'),
        order_payload->>'raw_message',
        COALESCE((order_payload->>'created_at')::TIMESTAMPTZ, NOW())
    )
    RETURNING id INTO new_order_id;

    -- Inserir os Itens do Pedido
    FOR item_elem IN SELECT * FROM jsonb_array_elements(items_payload)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            unit_price_cents,
            quantity,
            subtotal_cents
        )
        VALUES (
            new_order_id,
            item_elem->>'product_id',
            item_elem->>'product_name',
            (item_elem->>'unit_price_cents')::INTEGER,
            (item_elem->>'quantity')::INTEGER,
            (item_elem->>'subtotal_cents')::INTEGER
        );
    END LOOP;

    RETURN jsonb_build_object('id', new_order_id, 'order_code', order_payload->>'order_code');
END;
$$;

-- 5. Segurança & RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Permitir acesso via Service Role / Backend Administrativo exclusivamente
CREATE POLICY "Service Role Full Access Orders" ON public.orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access Order Items" ON public.order_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

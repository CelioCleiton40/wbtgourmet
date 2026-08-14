-- ====================================================================
-- WBT Gourmet - Migração: Checkout Sessions, Quote-Order Link, Delivery Fee
-- ====================================================================

-- 1. Adicionar campos de frete e cotação na tabela orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee_cents   INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  ADD COLUMN IF NOT EXISTS delivery_quote_id    UUID REFERENCES public.delivery_quotes(id) ON DELETE SET NULL;

-- 2. Adicionar checkout_session_id e checkout_session_status na tabela payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS checkout_session_id     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checkout_session_status TEXT NOT NULL DEFAULT 'pending';
  -- checkout_session_status: pending | open | complete | expired | failed

-- 3. Garantir que delivery_quotes tem os campos corretos
-- (criada na migração anterior — apenas adicionando índice de order_id se necessário)
CREATE INDEX IF NOT EXISTS idx_delivery_quotes_order_id
  ON public.delivery_quotes(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_quotes_provider_quote_id
  ON public.delivery_quotes(provider_quote_id);

-- 4. Índice para lookup de checkout_session no webhook e na página de sucesso
CREATE INDEX IF NOT EXISTS idx_payments_checkout_session_id
  ON public.payments(checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

-- 5. Tabela standalone de Checkout Sessions (para idempotência e polling)
--    Separada de payments para suportar o ciclo de vida independente da Session
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_session_id   TEXT NOT NULL UNIQUE,
  amount_cents        INTEGER NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL DEFAULT 'brl',
  status              TEXT NOT NULL DEFAULT 'open',
    -- open | complete | expired | failed
  success_url         TEXT NOT NULL,
  cancel_url          TEXT NOT NULL,
  delivery_quote_id   UUID REFERENCES public.delivery_quotes(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Índices da tabela checkout_sessions
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_id
  ON public.checkout_sessions(order_id);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id
  ON public.checkout_sessions(stripe_session_id);

-- 7. RLS — apenas service_role pode acessar (nunca anon/authenticated direto)
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access Checkout Sessions"
  ON public.checkout_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Atualizar função create_order_with_items para incluir delivery_fee_cents
--    (sobreescrita segura com OR REPLACE)
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
  -- Inserir pedido
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
    order_payload->>'status',
    order_payload->>'raw_message',
    COALESCE((order_payload->>'created_at')::TIMESTAMPTZ, NOW())
  )
  RETURNING id INTO new_order_id;

  -- Inserir itens
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

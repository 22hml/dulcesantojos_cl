-- ═══════════════════════════════════════════════════════════════
-- FIX CHECKOUT 403 — Ejecutar TODO este archivo en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE orders ADD COLUMN IF NOT EXISTS comuna TEXT;

-- Desbloquea pedidos: el checkout solo escribe desde el servidor (API)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ── Funciones del checkout ──

CREATE OR REPLACE FUNCTION create_order_for_checkout(
  p_delivery_type text,
  p_address text,
  p_comuna text,
  p_customer_name text,
  p_customer_phone text,
  p_subtotal integer,
  p_delivery_cost integer,
  p_total integer,
  p_items jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO orders (
    status, delivery_type, address, comuna,
    customer_name, customer_phone,
    subtotal, delivery_cost, total, items
  ) VALUES (
    'pending', p_delivery_type, p_address, p_comuna,
    p_customer_name, p_customer_phone,
    p_subtotal, p_delivery_cost, p_total, p_items
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION set_order_mp_preference(
  p_order_id integer,
  p_preference_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders SET mp_preference_id = p_preference_id WHERE id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_order_paid(
  p_order_id integer,
  p_payment_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders
  SET status = 'paid', mp_payment_id = p_payment_id
  WHERE id = p_order_id AND status = 'pending';
END;
$$;

-- Tarifa por comuna (opcional, para checkout)
CREATE OR REPLACE FUNCTION get_delivery_cost(p_comuna text)
RETURNS TABLE (delivery_cost integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dz.delivery_cost
  FROM delivery_zones dz
  WHERE dz.comuna = p_comuna AND dz.active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION create_order_for_checkout TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_order_mp_preference TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_order_paid TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_delivery_cost TO anon, authenticated, service_role;

-- Comunas: lectura pública (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'delivery_zones') THEN
    ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "delivery_zones public read" ON delivery_zones;
    CREATE POLICY "delivery_zones public read" ON delivery_zones
      FOR SELECT USING (active = true);
  END IF;
END $$;

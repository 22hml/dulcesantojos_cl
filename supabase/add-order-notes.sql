-- Observaciones del cliente en pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS observaciones TEXT;

CREATE OR REPLACE FUNCTION create_order_for_checkout(
  p_delivery_type text,
  p_address text,
  p_comuna text,
  p_customer_name text,
  p_customer_phone text,
  p_subtotal integer,
  p_delivery_cost integer,
  p_total integer,
  p_items jsonb,
  p_observaciones text DEFAULT NULL
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
    customer_name, customer_phone, observaciones,
    subtotal, delivery_cost, total, items
  ) VALUES (
    'pending', p_delivery_type, p_address, p_comuna,
    p_customer_name, p_customer_phone, p_observaciones,
    p_subtotal, p_delivery_cost, p_total, p_items
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_for_checkout TO anon, authenticated, service_role;

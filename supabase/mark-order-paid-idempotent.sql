-- Idempotencia webhook (estilo goncy: no duplicar si el mismo payment.id ya se procesó)
-- Ejecutar en Supabase SQL Editor

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
  IF EXISTS (
    SELECT 1 FROM orders
    WHERE mp_payment_id = p_payment_id AND status = 'paid'
  ) THEN
    RETURN;
  END IF;

  UPDATE orders
  SET status = 'paid', mp_payment_id = p_payment_id
  WHERE id = p_order_id AND status = 'pending';
END;
$$;

-- Productos (pastelería)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  unit TEXT DEFAULT 'unidad',
  stock INTEGER DEFAULT 0,
  category TEXT,
  mode TEXT DEFAULT 'pasteleria',
  image_url TEXT,
  highlight TEXT,
  hero_sort SMALLINT CHECK (hero_sort IS NULL OR (hero_sort >= 1 AND hero_sort <= 4)),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  delivery_type TEXT,
  address TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal INTEGER,
  delivery_cost INTEGER DEFAULT 0,
  total INTEGER,
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bajar stock al pagar
CREATE OR REPLACE FUNCTION decrease_stock()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE products
      SET stock = stock - (item->>'qty')::int
      WHERE id = (item->>'id')::int;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_paid
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrease_stock();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos publicos" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "orders insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Datos de ejemplo (opcional)
INSERT INTO products (name, description, price, unit, stock, category, mode, highlight, active) VALUES
  ('Torta tres leches', 'Bizcocho esponjoso bañado en tres leches.', 18990, 'unidad', 5, 'Tortas', 'pasteleria', 'Más pedida', true),
  ('Cheesecake frutos rojos', 'Base de galleta y coulis de frutos del bosque.', 14990, 'unidad', 8, 'Cheesecake', 'pasteleria', 'Nuevo', true),
  ('Brownie caja x6', 'Brownies húmedos con chocolate belga.', 9990, 'caja x6', 12, 'Brownies', 'pasteleria', NULL, true),
  ('Caja Negra 20cm', 'Caja cartón premium negro mate 20x20x15cm', 1990, 'c/u', 50, 'Cartón', 'shop', 'Premium', true),
  ('Caja con Visor 20cm', 'Caja con tapa acetato transparente 20x20x15cm', 2490, 'c/u', 30, 'Con visor', 'shop', 'Más pedida', true),
  ('Pack 10 Cajas Negras', '10 cajas negro mate 20cm. Precio mayorista', 17990, 'pack x10', 15, 'Pack', 'shop', 'Mayorista', true);

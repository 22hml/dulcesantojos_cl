-- Ejecutar en Supabase SQL Editor si ya creaste las tablas sin los productos shop
INSERT INTO products (name, description, price, unit, stock, category, mode, highlight, active) VALUES
  ('Caja Negra 20cm', 'Caja cartón premium negro mate 20x20x15cm', 1990, 'c/u', 50, 'Cartón', 'shop', 'Premium', true),
  ('Caja con Visor 20cm', 'Caja con tapa acetato transparente 20x20x15cm', 2490, 'c/u', 30, 'Con visor', 'shop', 'Más pedida', true),
  ('Pack 10 Cajas Negras', '10 cajas negro mate 20cm. Precio mayorista', 17990, 'pack x10', 15, 'Pack', 'shop', 'Mayorista', true)
ON CONFLICT DO NOTHING;

-- Tarifas de despacho por comuna
CREATE TABLE IF NOT EXISTS delivery_zones (
  id SERIAL PRIMARY KEY,
  comuna TEXT NOT NULL UNIQUE,
  region TEXT DEFAULT 'Región Metropolitana',
  delivery_cost INTEGER NOT NULL DEFAULT 2990,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_zones public read" ON delivery_zones
  FOR SELECT USING (active = true);

-- Pedidos: guardar comuna por separado (opcional si ya tienes orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comuna TEXT;

-- Comunas RM (ajusta precios en admin)
INSERT INTO delivery_zones (comuna, delivery_cost) VALUES
  ('Santiago', 2990),
  ('Providencia', 2990),
  ('Ñuñoa', 2990),
  ('Las Condes', 3490),
  ('Vitacura', 3490),
  ('La Reina', 3490),
  ('Macul', 2990),
  ('La Florida', 3490),
  ('Maipú', 3990),
  ('Puente Alto', 4490),
  ('San Miguel', 3290),
  ('Estación Central', 2990),
  ('Independencia', 2990),
  ('Recoleta', 3290),
  ('Quilicura', 3990),
  ('Peñalolén', 3490),
  ('San Bernardo', 4490),
  ('Huechuraba', 3490),
  ('Conchalí', 3290),
  ('Renca', 3490)
ON CONFLICT (comuna) DO NOTHING;

-- Bucket para fotos de productos (ejecutar en Storage o SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
-- ON CONFLICT DO NOTHING;

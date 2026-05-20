-- Casillas del hero: producto, foto libre o vacío
CREATE TABLE IF NOT EXISTS hero_slots (
  slot SMALLINT PRIMARY KEY CHECK (slot >= 1 AND slot <= 4),
  kind TEXT NOT NULL DEFAULT 'empty' CHECK (kind IN ('empty', 'product', 'custom')),
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  image_url TEXT,
  caption TEXT,
  alt_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hero_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_slots public read" ON hero_slots;
CREATE POLICY "hero_slots public read" ON hero_slots
  FOR SELECT USING (true);

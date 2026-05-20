-- Posición en el grid del hero (1–4). NULL = no aparece en el inicio.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hero_sort SMALLINT
  CHECK (hero_sort IS NULL OR (hero_sort >= 1 AND hero_sort <= 4));

CREATE INDEX IF NOT EXISTS products_hero_sort_idx ON products (hero_sort)
  WHERE hero_sort IS NOT NULL;

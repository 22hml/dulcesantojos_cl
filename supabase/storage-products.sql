-- Bucket público para fotos de productos (admin → subir imagen)
-- Ejecutar en Supabase: SQL Editor → New query → Run

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Lectura pública (catálogo y admin)
DROP POLICY IF EXISTS "products public read" ON storage.objects;
CREATE POLICY "products public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Subida desde el panel (service_role del backend ya puede; esto ayuda si usas otro cliente)
DROP POLICY IF EXISTS "products service upload" ON storage.objects;
CREATE POLICY "products service upload"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "products service update" ON storage.objects;
CREATE POLICY "products service update"
  ON storage.objects FOR UPDATE
  TO authenticated, service_role
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "products service delete" ON storage.objects;
CREATE POLICY "products service delete"
  ON storage.objects FOR DELETE
  TO authenticated, service_role
  USING (bucket_id = 'products');

-- Execute APENAS isto no Supabase SQL Editor (comentários no mural)

CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mural(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_post ON comentarios(post_id);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios_select" ON comentarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mural m
      JOIN usuarios u ON u.condominio_id = m.condominio_id
      WHERE m.id = comentarios.post_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "comentarios_insert" ON comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

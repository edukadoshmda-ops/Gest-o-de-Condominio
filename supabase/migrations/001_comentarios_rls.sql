-- ============================================
-- MIGRAÇÃO: Comentários no Mural + RLS
-- Execute no Supabase SQL Editor (uma seção por vez se der erro)
-- ============================================

-- 1. Tabela de comentários
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES mural(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_post ON comentarios(post_id);

-- 2. RLS na tabela comentarios
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

-- 3. RLS mural (execute se a tabela mural existir)
ALTER TABLE mural ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mural_select" ON mural;
CREATE POLICY "mural_select" ON mural FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM usuarios WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mural_insert" ON mural;
CREATE POLICY "mural_insert" ON mural FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "mural_update" ON mural;
CREATE POLICY "mural_update" ON mural FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "mural_delete" ON mural;
CREATE POLICY "mural_delete" ON mural FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. RLS faturas (execute se a tabela faturas existir)
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faturas_select" ON faturas;
CREATE POLICY "faturas_select" ON faturas FOR SELECT
  USING (
    condominio_id IN (
      SELECT condominio_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- 5. RLS usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT
  USING (
    id = auth.uid() OR
    condominio_id IN (
      SELECT condominio_id FROM usuarios WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "usuarios_update_self" ON usuarios;
CREATE POLICY "usuarios_update_self" ON usuarios FOR UPDATE
  USING (id = auth.uid());

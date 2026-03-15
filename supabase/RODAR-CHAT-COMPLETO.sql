-- ============================================
-- Script completo para o Chat funcionar
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Garantir que a tabela conversas existe
CREATE TABLE IF NOT EXISTS public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  img_url TEXT
);

-- 2. Garantir os 4 canais (Síndico, Portaria, Comercial, Diversos) com IDs fixos
INSERT INTO public.conversas (id, nome, ordem)
VALUES
  ('a0000001-0001-4000-8000-000000000001'::uuid, 'Síndico', 1),
  ('a0000001-0002-4000-8000-000000000002'::uuid, 'Portaria', 2),
  ('a0000001-0003-4000-8000-000000000003'::uuid, 'Comercial', 3),
  ('a0000001-0004-4000-8000-000000000004'::uuid, 'Diversos', 4)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem;

-- 3. Tabela mensagens (se não existir)
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remetente_nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_condo_conversa ON public.mensagens(condominio_id, conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON public.mensagens(created_at);

-- 4. RLS e funções
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversas_select" ON public.conversas;
CREATE POLICY "conversas_select" ON public.conversas FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT
  USING (condominio_id = public.get_my_condo());

DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT
  WITH CHECK (
    condominio_id = public.get_my_condo()
    AND remetente_id = auth.uid()
  );

DROP POLICY IF EXISTS "mensagens_delete" ON public.mensagens;
CREATE POLICY "mensagens_delete" ON public.mensagens FOR DELETE
  USING (
    remetente_id = auth.uid()
    OR (public.get_my_tipo() IN ('sindico', 'admin_master') AND condominio_id = public.get_my_condo())
  );

-- 5. Realtime para mensagens aparecerem em tempo real
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mensagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

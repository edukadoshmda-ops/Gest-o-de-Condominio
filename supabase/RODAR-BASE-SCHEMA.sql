-- ============================================
-- Esquema base: condominios e usuarios
-- Execute PRIMEIRO se você receber erro "relation usuarios does not exist"
-- Depois execute RODAR-CHAT-E-NOTIFICACOES-COMPLETO.sql
-- ============================================

-- 1. Tabela condominios
CREATE TABLE IF NOT EXISTS public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_acesso TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_vencimento DATE
);

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "condominios_select" ON public.condominios;
CREATE POLICY "condominios_select" ON public.condominios FOR SELECT USING (true);

DROP POLICY IF EXISTS "condominios_insert" ON public.condominios;
CREATE POLICY "condominios_insert" ON public.condominios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "condominios_update" ON public.condominios;
CREATE POLICY "condominios_update" ON public.condominios FOR UPDATE USING (true);

-- 2. Tabela usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'morador',
  ativo BOOLEAN DEFAULT true,
  unidade TEXT,
  bloco TEXT,
  foto_url TEXT,
  notificar_chat BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_usuarios_condominio ON public.usuarios(condominio_id);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Funções (precisam existir antes das políticas)
CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
  id = auth.uid()
  OR (condominio_id = public.get_my_condo())
);

DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (
  id = auth.uid()
  OR (public.get_my_tipo() IN ('sindico', 'admin_master', 'porteiro') AND condominio_id = public.get_my_condo())
);

DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE USING (
  id = auth.uid() OR public.get_my_tipo() = 'admin_master'
);

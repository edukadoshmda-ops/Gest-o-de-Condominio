-- ============================================
-- CORREÇÃO: Recursão infinita nas políticas de usuarios
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Criar funções SECURITY DEFINER (correm sem RLS, evitam recursão)
CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Remover políticas recursivas e recriar com as funções
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_self" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
  id = auth.uid()
  OR public.get_my_tipo() = 'admin_master'
  OR (public.get_my_tipo() IN ('sindico', 'porteiro') AND condominio_id = public.get_my_condo())
  OR (condominio_id = public.get_my_condo())
);

CREATE POLICY "usuarios_update_self" ON public.usuarios FOR UPDATE USING (
  id = auth.uid()
  OR public.get_my_tipo() = 'admin_master'
  OR (public.get_my_tipo() IN ('sindico', 'porteiro') AND condominio_id = public.get_my_condo())
);

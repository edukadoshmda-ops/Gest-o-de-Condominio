-- ============================================
-- Permitir síndico e admin_master inserirem faturas
-- Execute no Supabase SQL Editor se necessário
-- ============================================

-- Garantir funções auxiliares
CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Política INSERT: síndico e admin_master podem criar faturas do seu condomínio
DROP POLICY IF EXISTS "faturas_insert" ON public.faturas;
CREATE POLICY "faturas_insert" ON public.faturas FOR INSERT
  WITH CHECK (
    public.get_my_tipo() IN ('sindico', 'admin_master')
    AND (condominio_id IS NULL OR condominio_id = public.get_my_condo())
  );

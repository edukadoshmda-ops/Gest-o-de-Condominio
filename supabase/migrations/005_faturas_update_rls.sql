-- ============================================
-- Permitir confirmar pagamento (UPDATE em faturas)
-- Execute no Supabase SQL Editor
-- ============================================

-- Garantir coluna data_pagamento (se a tabela faturas já existir)
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Funções auxiliares (caso 002 não tenha sido executado)
CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Política UPDATE em faturas: morador atualiza a própria; síndico/admin atualiza do condomínio
DROP POLICY IF EXISTS "faturas_update" ON public.faturas;
CREATE POLICY "faturas_update" ON public.faturas FOR UPDATE
  USING (
    morador_id = auth.uid()
    OR (public.get_my_tipo() IN ('sindico', 'admin_master') AND condominio_id = public.get_my_condo())
  )
  WITH CHECK (true);

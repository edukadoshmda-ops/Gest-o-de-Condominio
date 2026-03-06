-- ============================================
-- Mensagens privadas (DM) entre moradores
-- Execute no Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.mensagens_privadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remetente_nome TEXT NOT NULL,
  destinatario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_privadas_lookup ON public.mensagens_privadas(condominio_id, remetente_id, destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_privadas_created ON public.mensagens_privadas(created_at);

ALTER TABLE public.mensagens_privadas ENABLE ROW LEVEL SECURITY;

-- Selecionar: usuário vê apenas mensagens onde ele é remetente ou destinatário, no seu condomínio
DROP POLICY IF EXISTS "mensagens_privadas_select" ON public.mensagens_privadas;
CREATE POLICY "mensagens_privadas_select" ON public.mensagens_privadas FOR SELECT
  USING (
    condominio_id = public.get_my_condo()
    AND (remetente_id = auth.uid() OR destinatario_id = auth.uid())
  );

-- Inserir: usuário envia apenas do seu condomínio e como remetente
DROP POLICY IF EXISTS "mensagens_privadas_insert" ON public.mensagens_privadas;
CREATE POLICY "mensagens_privadas_insert" ON public.mensagens_privadas FOR INSERT
  WITH CHECK (
    condominio_id = public.get_my_condo()
    AND remetente_id = auth.uid()
  );

-- Garantir função get_my_condo (pode já existir)
CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Deletar: apenas a própria mensagem
DROP POLICY IF EXISTS "mensagens_privadas_delete" ON public.mensagens_privadas;
CREATE POLICY "mensagens_privadas_delete" ON public.mensagens_privadas FOR DELETE
  USING (remetente_id = auth.uid());

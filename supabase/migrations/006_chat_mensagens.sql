-- ============================================
-- Chat: conversas e mensagens (24h por condomínio)
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Tabela de conversas (canais globais - compartilhados por todos os condomínios)
CREATE TABLE IF NOT EXISTS public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  img_url TEXT
);

-- Inserir conversas padrão (idempotente)
INSERT INTO public.conversas (id, nome, ordem, img_url)
SELECT 'a0000001-0001-4000-8000-000000000001'::uuid, 'Marcos (Torre B)', 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.conversas WHERE nome = 'Marcos (Torre B)');
INSERT INTO public.conversas (id, nome, ordem, img_url)
SELECT 'a0000001-0002-4000-8000-000000000002'::uuid, 'Grupo Comercial', 2, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.conversas WHERE nome = 'Grupo Comercial');
INSERT INTO public.conversas (id, nome, ordem, img_url)
SELECT 'a0000001-0003-4000-8000-000000000003'::uuid, 'Portaria Principal', 3, 'https://images.unsplash.com/photo-1610216705422-caa3fcb6d15d?w=100&h=100&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.conversas WHERE nome = 'Portaria Principal');
INSERT INTO public.conversas (id, nome, ordem, img_url)
SELECT 'a0000001-0004-4000-8000-000000000004'::uuid, 'Síndico', 4, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.conversas WHERE nome = 'Síndico');

-- 2. Tabela de mensagens
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

-- 3. RLS
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Todos podem ler conversas (canais globais)
DROP POLICY IF EXISTS "conversas_select" ON public.conversas;
CREATE POLICY "conversas_select" ON public.conversas FOR SELECT USING (true);

-- Funções auxiliares (reutilizando se existir)
CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Mensagens: usuário vê apenas do seu condomínio
DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT
  USING (condominio_id = public.get_my_condo());

-- Mensagens: usuário insere apenas no seu condomínio
DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT
  WITH CHECK (
    condominio_id = public.get_my_condo()
    AND remetente_id = auth.uid()
  );

-- Mensagens: usuário pode deletar a própria mensagem; síndico/admin deleta qualquer do condomínio
DROP POLICY IF EXISTS "mensagens_delete" ON public.mensagens;
CREATE POLICY "mensagens_delete" ON public.mensagens FOR DELETE
  USING (
    remetente_id = auth.uid()
    OR (public.get_my_tipo() IN ('sindico', 'admin_master') AND condominio_id = public.get_my_condo())
  );

-- 4. Função para limpar mensagens com mais de 24h (opcional: agendar via pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_mensagens_24h() RETURNS void AS $$
  DELETE FROM public.mensagens WHERE created_at < NOW() - INTERVAL '24 hours';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- Inserir usuário edukadosh@yahoo.com.br na tabela usuarios
-- Execute no Supabase: SQL Editor
-- UID do Dashboard: 32dd6900-7c6a-40a0-a1d7-3d95d2539f4f
-- ============================================

-- 1) Garantir que existe pelo menos um condomínio
INSERT INTO public.condominios (nome, codigo_acesso, status)
SELECT 'Condomínio Teste', 'TESTE', 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM public.condominios LIMIT 1);

-- 2) Inserir/atualizar perfil do usuário (vincula ao primeiro condomínio)
INSERT INTO public.usuarios (id, nome, tipo, condominio_id, ativo)
VALUES (
  '32dd6900-7c6a-40a0-a1d7-3d95d2539f4f'::uuid,
  'Eduardo',
  'sindico',
  (SELECT id FROM public.condominios ORDER BY 1 LIMIT 1),
  true
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  condominio_id = COALESCE(public.usuarios.condominio_id, EXCLUDED.condominio_id),
  ativo = true;

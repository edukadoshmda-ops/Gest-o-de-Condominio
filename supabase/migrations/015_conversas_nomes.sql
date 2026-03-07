-- ============================================
-- Atualizar nomes dos canais para o frontend
-- (Síndico, Portaria, Comercial, Diversos)
-- ============================================

UPDATE public.conversas SET nome = 'Síndico' WHERE id = 'a0000001-0001-4000-8000-000000000001'::uuid;
UPDATE public.conversas SET nome = 'Portaria' WHERE id = 'a0000001-0002-4000-8000-000000000002'::uuid;
UPDATE public.conversas SET nome = 'Comercial' WHERE id = 'a0000001-0003-4000-8000-000000000003'::uuid;
UPDATE public.conversas SET nome = 'Diversos' WHERE id = 'a0000001-0004-4000-8000-000000000004'::uuid;

-- ============================================
-- Adicionar coluna morador_id na tabela visitantes
-- Execute no Supabase SQL Editor
-- ============================================

ALTER TABLE public.visitantes 
ADD COLUMN IF NOT EXISTS morador_id uuid;

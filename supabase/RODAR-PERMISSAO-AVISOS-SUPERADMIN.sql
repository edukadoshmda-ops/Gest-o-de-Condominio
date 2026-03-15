-- ============================================
-- Permissão: edukadoshmda@gmail.com pode publicar avisos como síndico
-- Execute no Supabase SQL Editor
-- ============================================

-- Atualiza avisos_insert: permite sindico, admin_master e o email superadmin
DROP POLICY IF EXISTS "avisos_insert" ON public.avisos;
DROP POLICY IF EXISTS "avisos_all" ON public.avisos;

CREATE POLICY "avisos_insert" ON public.avisos
    FOR INSERT WITH CHECK (
        -- Síndico ou admin_master com condominio vinculado
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios
            WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master') AND condominio_id IS NOT NULL
        )
        OR
        -- Admin_master sem condominio (pode publicar em qualquer um)
        EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND tipo = 'admin_master')
        OR
        -- Superadmin por email (edukadoshmda@gmail.com)
        (auth.jwt() ->> 'email') = 'edukadoshmda@gmail.com'
    );

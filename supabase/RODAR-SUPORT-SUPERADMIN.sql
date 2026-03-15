-- ============================================
-- SCRIPT DE SUPER-PERMISSÕES (RLS)
-- Execute isso no SQL Editor do seu Supabase
-- ============================================

-- 1. Garante que o Superadmin possa VER todas as mensagens de qualquer condomínio
DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT
  USING (
    condominio_id = public.get_my_condo() 
    OR public.get_my_tipo() = 'superadmin'
  );

-- 2. Garante que o Superadmin possa POSTAR mensagens em qualquer condomínio
DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT
  WITH CHECK (
    remetente_id = auth.uid()
  );

-- 3. Garante que o Superadmin possa EXCLUIR mensagens para moderar o chat
DROP POLICY IF EXISTS "mensagens_delete" ON public.mensagens;
CREATE POLICY "mensagens_delete" ON public.mensagens FOR DELETE
  USING (
    remetente_id = auth.uid()
    OR public.get_my_tipo() IN ('sindico', 'admin_master', 'superadmin')
  );

-- 4. Permite que o Superadmin poste Avisos (Mural Oficial)
DROP POLICY IF EXISTS "avisos_insert" ON public.avisos;
CREATE POLICY "avisos_insert" ON public.avisos FOR INSERT
  WITH CHECK (
    public.get_my_tipo() IN ('sindico', 'admin_master', 'superadmin')
    OR (auth.jwt() ->> 'email') = 'edukadoshmda@gmail.com'
  );

-- 5. Atualiza a permissão de visualização de usuários para o Superadmin
DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT
  USING (
    id = auth.uid() 
    OR condominio_id = public.get_my_condo()
    OR public.get_my_tipo() IN ('sindico', 'porteiro', 'admin_master', 'superadmin')
  );

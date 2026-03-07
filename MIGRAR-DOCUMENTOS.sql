-- Cole no Supabase SQL Editor e execute para criar a tabela documentos.
-- https://supabase.com/dashboard > seu projeto > SQL Editor > New query
--
-- Para upload de arquivos: o app usa o bucket "fotos" com pasta documentos/.
-- Se o upload de PDF falhar, em Storage > fotos > Configuration inclua application/pdf nos tipos permitidos.

-- Garante que as funções auxiliares existam (podem já ter sido criadas por outras migrations)
CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE TABLE IF NOT EXISTS public.documentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    tipo text NOT NULL CHECK (tipo IN ('ata', 'regulamento')),
    titulo text NOT NULL,
    url text,
    arquivo_nome text,
    descricao text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_condominio ON public.documentos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON public.documentos(tipo);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_select" ON public.documentos;
CREATE POLICY "documentos_select" ON public.documentos FOR SELECT USING (
    condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master'
);

DROP POLICY IF EXISTS "documentos_insert" ON public.documentos;
CREATE POLICY "documentos_insert" ON public.documentos FOR INSERT WITH CHECK (
    public.get_my_tipo() IN ('sindico', 'admin_master') AND 
    (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master')
);

DROP POLICY IF EXISTS "documentos_update" ON public.documentos;
CREATE POLICY "documentos_update" ON public.documentos FOR UPDATE USING (
    public.get_my_tipo() IN ('sindico', 'admin_master') AND 
    (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master')
);

DROP POLICY IF EXISTS "documentos_delete" ON public.documentos;
CREATE POLICY "documentos_delete" ON public.documentos FOR DELETE USING (
    public.get_my_tipo() IN ('sindico', 'admin_master') AND 
    (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master')
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documentos' AND column_name = 'arquivo_nome') THEN
    ALTER TABLE public.documentos ADD COLUMN arquivo_nome text;
  END IF;
END $$;

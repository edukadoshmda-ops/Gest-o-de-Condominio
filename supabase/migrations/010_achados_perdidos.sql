-- Tabela Achados & Perdidos (se não existir)
CREATE TABLE IF NOT EXISTS public.achados_perdidos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    item text NOT NULL,
    tipo text NOT NULL,
    local text NOT NULL,
    status text DEFAULT 'Na Portaria',
    quem_reportou text,
    data date DEFAULT CURRENT_DATE,
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_achados_condominio ON public.achados_perdidos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_achados_tipo ON public.achados_perdidos(tipo);

ALTER TABLE public.achados_perdidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achados_select" ON public.achados_perdidos;
CREATE POLICY "achados_select" ON public.achados_perdidos FOR SELECT USING (
    condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master'
);

DROP POLICY IF EXISTS "achados_insert" ON public.achados_perdidos;
CREATE POLICY "achados_insert" ON public.achados_perdidos FOR INSERT WITH CHECK (
    condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master'
);

DROP POLICY IF EXISTS "achados_update" ON public.achados_perdidos;
CREATE POLICY "achados_update" ON public.achados_perdidos FOR UPDATE USING (
    condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master'
);

DROP POLICY IF EXISTS "achados_delete" ON public.achados_perdidos;
CREATE POLICY "achados_delete" ON public.achados_perdidos FOR DELETE USING (
    condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master'
);

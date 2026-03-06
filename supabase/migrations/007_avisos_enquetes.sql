-- ============================================
-- Tabelas: avisos do síndico e enquetes
-- Prerrogativa do síndico (e admin_master) criar/editar
-- Moradores do condomínio podem ler e votar
-- ============================================

-- Tabela avisos (avisos do síndico por condomínio)
CREATE TABLE IF NOT EXISTS public.avisos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    descricao text NOT NULL,
    tag text DEFAULT 'OFICIAL',
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_avisos_condominio ON public.avisos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_avisos_created_at ON public.avisos(created_at DESC);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avisos_select" ON public.avisos;
CREATE POLICY "avisos_select" ON public.avisos
    FOR SELECT USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "avisos_insert" ON public.avisos;
CREATE POLICY "avisos_insert" ON public.avisos
    FOR INSERT WITH CHECK (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master')
        )
    );

DROP POLICY IF EXISTS "avisos_update" ON public.avisos;
CREATE POLICY "avisos_update" ON public.avisos
    FOR UPDATE USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master')
        )
    );

DROP POLICY IF EXISTS "avisos_delete" ON public.avisos;
CREATE POLICY "avisos_delete" ON public.avisos
    FOR DELETE USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master')
        )
    );

-- Tabela enquetes (uma enquete ativa por condomínio; opcoes = [{ "label": "...", "votes": 0 }, ...])
CREATE TABLE IF NOT EXISTS public.enquetes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    opcoes jsonb NOT NULL DEFAULT '[]'::jsonb,
    ativa boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_enquetes_condominio_ativa ON public.enquetes(condominio_id, ativa);
CREATE INDEX IF NOT EXISTS idx_enquetes_created_at ON public.enquetes(created_at DESC);

ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquetes_select" ON public.enquetes;
CREATE POLICY "enquetes_select" ON public.enquetes
    FOR SELECT USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "enquetes_insert" ON public.enquetes;
CREATE POLICY "enquetes_insert" ON public.enquetes
    FOR INSERT WITH CHECK (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master')
        )
    );

DROP POLICY IF EXISTS "enquetes_update" ON public.enquetes;
CREATE POLICY "enquetes_update" ON public.enquetes
    FOR UPDATE USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "enquetes_delete" ON public.enquetes;
CREATE POLICY "enquetes_delete" ON public.enquetes
    FOR DELETE USING (
        condominio_id IN (
            SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() AND tipo IN ('sindico', 'admin_master')
        )
    );

-- Tabela para evitar voto duplicado (um usuário um voto por enquete)
CREATE TABLE IF NOT EXISTS public.enquete_votos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enquete_id uuid NOT NULL REFERENCES public.enquetes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opcao_index int NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(enquete_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enquete_votos_enquete ON public.enquete_votos(enquete_id);

ALTER TABLE public.enquete_votos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquete_votos_select" ON public.enquete_votos;
CREATE POLICY "enquete_votos_select" ON public.enquete_votos
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "enquete_votos_insert" ON public.enquete_votos;
CREATE POLICY "enquete_votos_insert" ON public.enquete_votos
    FOR INSERT WITH CHECK (user_id = auth.uid());

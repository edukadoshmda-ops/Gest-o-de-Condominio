CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Chamados (Manutenção)
CREATE TABLE IF NOT EXISTS public.chamados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberto',
    morador_id uuid,
    foto_url TEXT,
    comentarios JSONB[] DEFAULT '{}'::jsonb[],
    condominio_id uuid
);

-- Tabela de Reservas (Áreas Comuns)
CREATE TABLE IF NOT EXISTS public.reservas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    area_nome TEXT NOT NULL,
    data DATE NOT NULL,
    horario TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmada',
    morador_id uuid,
    condominio_id uuid
);

-- Tabela de Mural (Social Feed)
CREATE TABLE IF NOT EXISTS public.mural (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    autor TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    curtidas INTEGER DEFAULT 0,
    comentarios INTEGER DEFAULT 0,
    imagens TEXT[] DEFAULT '{}',
    morador_id uuid,
    condominio_id uuid
);

-- Tabela de Visitantes (Controle de Acesso)
CREATE TABLE IF NOT EXISTS public.visitantes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    relacao TEXT NOT NULL,
    placa_veiculo TEXT DEFAULT 'N/A',
    status TEXT NOT NULL DEFAULT 'Entrada Autorizada',
    morador_id uuid,
    condominio_id uuid
);

-- Tabela de Faturas (Financeiro)
CREATE TABLE IF NOT EXISTS public.faturas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    descricao TEXT NOT NULL,
    vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    data_pagamento DATE,
    morador_id uuid,
    documento_url TEXT,
    condominio_id uuid
);

-- Tabela de Avisos (Dashboard)
CREATE TABLE IF NOT EXISTS public.avisos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    tag TEXT DEFAULT 'OFICIAL',
    ativo BOOLEAN DEFAULT true,
    condominio_id uuid
);

-- Tabela de Enquetes (Dashboard)
CREATE TABLE IF NOT EXISTS public.enquetes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    opcoes JSONB NOT NULL,
    ativa BOOLEAN DEFAULT true,
    condominio_id uuid
);

-- Tabela de Encomendas (Dashboard)
CREATE TABLE IF NOT EXISTS public.encomendas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    local TEXT NOT NULL,
    codigo TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    morador_id uuid,
    condominio_id uuid
);

-- Inserindo alguns dados de exemplo (opcional, para testes iniciais)
-- Avisos
INSERT INTO public.avisos (titulo, descricao, tag) 
VALUES ('Manutenção Preventiva de Reservatórios', 'A área da piscina e reservatórios centrais passarão por higienização técnica programada neste final de semana para garantir a qualidade da água.', 'OFICIAL')
ON CONFLICT DO NOTHING;

-- Enquetes (Atenção ao formato JSONB)
INSERT INTO public.enquetes (titulo, opcoes, ativa) 
VALUES (
    'Revitalização da Fachada: Paleta de Cores 2024', 
    '[{"label": "Cinza Graphite", "value": 45, "color": "bg-primary"}, {"label": "Bege Areia", "value": 30, "color": "bg-slate-500"}, {"label": "Branco Neve", "value": 25, "color": "bg-slate-300"}]'::jsonb, 
    true
)
ON CONFLICT DO NOTHING;

-- Encomendas
INSERT INTO public.encomendas (local, codigo, status)
VALUES ('Portaria 1', 'REF: #882-941', 'Pendente')
ON CONFLICT DO NOTHING;

-- Faturas
INSERT INTO public.faturas (descricao, vencimento, valor, status, data_pagamento)
VALUES 
    ('Taxa Condominial Ref. Março', '2026-03-10', 540.00, 'Pendente', NULL),
    ('Taxa Condominial Ref. Fevereiro', '2026-02-10', 540.00, 'Pago', '2026-02-08')
ON CONFLICT DO NOTHING;

-- Habilitando RLS para todas as tabelas
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mural ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;

-- Tabela de Condominios (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_acesso TEXT UNIQUE NOT NULL,
  plano TEXT DEFAULT 'padrao',
  status TEXT DEFAULT 'ativo', -- ativo | suspenso
  max_usuarios INTEGER DEFAULT 150,
  data_vencimento DATE,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.condominios DISABLE ROW LEVEL SECURITY;

-- Função para verificar se o condomínio está ativo e dentro do prazo
CREATE OR REPLACE FUNCTION public.is_condominio_ativo(cid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.condominios
    WHERE id = cid 
    AND status = 'ativo' 
    AND (data_vencimento IS NULL OR data_vencimento >= CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela de Usuarios (Perfis vinculados ao Auth)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT,
  unidade TEXT,
  telefone TEXT,
  tipo TEXT DEFAULT 'morador', -- morador | sindico | admin_master
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Tabela de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  created_by uuid REFERENCES public.usuarios(id),
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Policies para Comunicados
DROP POLICY IF EXISTS "Comunicados access" ON public.comunicados;
CREATE POLICY "Comunicados access"
ON public.comunicados
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND (usuarios.tipo = 'admin_master' OR (public.comunicados.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id)))
  )
);

-- Policies para Reservas
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS morador_id uuid;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Reservas access" ON public.reservas;
CREATE POLICY "Reservas access"
ON public.reservas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND (usuarios.tipo = 'admin_master' OR (public.reservas.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id)))
  )
);

-- Policies para Usuarios (Corrigido para evitar recursão infinita)
CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Usuarios access" ON public.usuarios;
DROP POLICY IF EXISTS "Admin master acesso total usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Sindico update usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir insert do proprio perfil" ON public.usuarios;

CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
  id = auth.uid() OR 
  (auth.jwt() ->> 'email') = 'edukadoshmda@gmail.com' OR
  public.get_my_tipo() = 'admin_master' OR
  (public.get_my_tipo() = 'sindico' AND condominio_id = public.get_my_condo())
);

CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (
  id = auth.uid() OR 
  (auth.jwt() ->> 'email') = 'edukadoshmda@gmail.com' OR
  public.get_my_tipo() = 'admin_master' OR
  (public.get_my_tipo() = 'sindico' AND condominio_id = public.get_my_condo())
);

CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE USING (
  (auth.jwt() ->> 'email') = 'edukadoshmda@gmail.com' OR
  public.get_my_tipo() = 'admin_master'
);

-- Policies genéricas para acesso por condomínio ou admin_master
-- Chamados
-- Chamados
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS morador_id uuid;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Chamados access" ON public.chamados;
CREATE POLICY "Chamados access" ON public.chamados FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.chamados.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Mural
ALTER TABLE public.mural ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Mural access" ON public.mural;
CREATE POLICY "Mural access" ON public.mural FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.mural.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Visitantes
ALTER TABLE public.visitantes ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Visitantes access" ON public.visitantes;
CREATE POLICY "Visitantes access" ON public.visitantes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.visitantes.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Faturas
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Faturas access" ON public.faturas;
CREATE POLICY "Faturas access" ON public.faturas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.faturas.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Avisos
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Avisos access" ON public.avisos;
CREATE POLICY "Avisos access" ON public.avisos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.avisos.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Enquetes
ALTER TABLE public.enquetes ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Enquetes access" ON public.enquetes;
CREATE POLICY "Enquetes access" ON public.enquetes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.enquetes.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Encomendas
ALTER TABLE public.encomendas ADD COLUMN IF NOT EXISTS condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "Encomendas access" ON public.encomendas;
CREATE POLICY "Encomendas access" ON public.encomendas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.encomendas.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Tabela de Patrimonio (Ativos do Condomínio)
CREATE TABLE IF NOT EXISTS public.patrimonio (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    vida_util INTEGER DEFAULT 60, -- em meses
    data_aquisicao DATE NOT NULL,
    garantia DATE,
    status TEXT DEFAULT 'Ativo',
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE
);

-- Tabela de Checklists (Configuração)
CREATE TABLE IF NOT EXISTS public.patrimonio_checklists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    frequencia TEXT NOT NULL, -- Diária, Semanal, Mensal
    itens TEXT[] DEFAULT '{}',
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE
);

-- Tabela de Execuções de Checklist (Histórico)
CREATE TABLE IF NOT EXISTS public.patrimonio_execucoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checklist_id uuid REFERENCES public.patrimonio_checklists(id) ON DELETE CASCADE,
    usuario_id uuid REFERENCES public.usuarios(id),
    resumo_conformidade TEXT, -- Ex: "Conforme", "Irregular"
    detalhes JSONB, -- Array de resultados por item
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE
);

-- Habilitando RLS
ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrimonio_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrimonio_execucoes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Acesso ao Patrimonio" ON public.patrimonio;
DROP POLICY IF EXISTS "Patrimonio access" ON public.patrimonio;
CREATE POLICY "Patrimonio access" ON public.patrimonio FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

DROP POLICY IF EXISTS "Checklists access" ON public.patrimonio_checklists;
CREATE POLICY "Checklists access" ON public.patrimonio_checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio_checklists.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

DROP POLICY IF EXISTS "Execucoes access" ON public.patrimonio_execucoes;
CREATE POLICY "Execucoes access" ON public.patrimonio_execucoes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio_execucoes.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);


-- Tabela de Achados e Perdidos
CREATE TABLE IF NOT EXISTS public.achados_perdidos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    item TEXT NOT NULL,
    tipo TEXT NOT NULL, -- Achado | Perdido
    local TEXT NOT NULL,
    status TEXT DEFAULT 'Na Portaria',
    quem_reportou TEXT,
    data DATE DEFAULT CURRENT_DATE,
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE
);

ALTER TABLE public.achados_perdidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso aos Achados" ON public.achados_perdidos;
DROP POLICY IF EXISTS "Achados access" ON public.achados_perdidos;
CREATE POLICY "Achados access" ON public.achados_perdidos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.achados_perdidos.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Tabela de Patrimônio 
CREATE TABLE IF NOT EXISTS public.patrimonio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT DEFAULT 'Equipamentos',
    valor NUMERIC DEFAULT 0,
    vida_util INTEGER DEFAULT 60,
    data_aquisicao DATE,
    garantia DATE,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patrimonio access" ON public.patrimonio;
CREATE POLICY "Patrimonio access" ON public.patrimonio FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Adicionando as colunas caso a tabela já exista
ALTER TABLE public.patrimonio 
ADD COLUMN IF NOT EXISTS valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS vida_util INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS data_aquisicao DATE,
ADD COLUMN IF NOT EXISTS garantia DATE;

-- Tabela de Checklists de Manutenção para o Patrimônio
CREATE TABLE IF NOT EXISTS public.patrimonio_checklists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    frequencia TEXT DEFAULT 'Mensal',
    itens TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE public.patrimonio_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patrimonio checklists access" ON public.patrimonio_checklists;
CREATE POLICY "Patrimonio checklists access" ON public.patrimonio_checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio_checklists.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);

-- Tabela de Execuções dos Checklists
CREATE TABLE IF NOT EXISTS public.patrimonio_execucoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
    checklist_id uuid REFERENCES public.patrimonio_checklists(id) ON DELETE CASCADE,
    executor TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT now()
);
ALTER TABLE public.patrimonio_execucoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patrimonio execucoes access" ON public.patrimonio_execucoes;
CREATE POLICY "Patrimonio execucoes access" ON public.patrimonio_execucoes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND (usuarios.tipo = 'admin_master' OR (public.patrimonio_execucoes.condominio_id = usuarios.condominio_id AND public.is_condominio_ativo(usuarios.condominio_id))))
);
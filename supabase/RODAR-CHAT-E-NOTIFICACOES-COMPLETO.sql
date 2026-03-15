-- ============================================
-- Script completo: Chat + Notificações
-- Execute no Supabase SQL Editor (uma única vez)
-- Habilite pg_net: Database → Extensions → pg_net
-- ============================================

-- ========== PARTE 0: BASE (condominios e usuarios, se não existirem) ==========
CREATE TABLE IF NOT EXISTS public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_acesso TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_vencimento DATE
);

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'morador',
  ativo BOOLEAN DEFAULT true,
  unidade TEXT,
  bloco TEXT,
  foto_url TEXT,
  notificar_chat BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_usuarios_condominio ON public.usuarios(condominio_id);

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "condominios_select" ON public.condominios;
CREATE POLICY "condominios_select" ON public.condominios FOR SELECT USING (true);
DROP POLICY IF EXISTS "condominios_insert" ON public.condominios;
CREATE POLICY "condominios_insert" ON public.condominios FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "condominios_update" ON public.condominios;
CREATE POLICY "condominios_update" ON public.condominios FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "usuarios_select" ON public.usuarios;
CREATE POLICY "usuarios_select" ON public.usuarios FOR SELECT USING (
  id = auth.uid() OR condominio_id = public.get_my_condo()
  OR public.get_my_tipo() IN ('sindico', 'porteiro', 'admin_master')
);
DROP POLICY IF EXISTS "usuarios_insert" ON public.usuarios;
CREATE POLICY "usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "usuarios_update" ON public.usuarios;
CREATE POLICY "usuarios_update" ON public.usuarios FOR UPDATE USING (
  id = auth.uid() OR (public.get_my_tipo() IN ('sindico', 'admin_master', 'porteiro') AND condominio_id = public.get_my_condo())
);
DROP POLICY IF EXISTS "usuarios_delete" ON public.usuarios;
CREATE POLICY "usuarios_delete" ON public.usuarios FOR DELETE USING (id = auth.uid() OR public.get_my_tipo() = 'admin_master');

-- ========== PARTE 1: CHAT (Canais Síndico, Portaria, Comercial, Diversos) ==========

-- 1.1 Tabela conversas
CREATE TABLE IF NOT EXISTS public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  img_url TEXT
);

-- 1.2 Os 4 canais com IDs fixos
INSERT INTO public.conversas (id, nome, ordem)
VALUES
  ('a0000001-0001-4000-8000-000000000001'::uuid, 'Síndico', 1),
  ('a0000001-0002-4000-8000-000000000002'::uuid, 'Portaria', 2),
  ('a0000001-0003-4000-8000-000000000003'::uuid, 'Comercial', 3),
  ('a0000001-0004-4000-8000-000000000004'::uuid, 'Diversos', 4)
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem;

-- 1.3 Tabela mensagens
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

-- 1.4 Funções e RLS do chat
CREATE OR REPLACE FUNCTION public.get_my_condo() RETURNS uuid AS $$
  SELECT condominio_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_tipo() RETURNS text AS $$
  SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversas_select" ON public.conversas;
CREATE POLICY "conversas_select" ON public.conversas FOR SELECT USING (true);

DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT
  USING (condominio_id = public.get_my_condo());

DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT
  WITH CHECK (remetente_id = auth.uid());

DROP POLICY IF EXISTS "mensagens_delete" ON public.mensagens;
CREATE POLICY "mensagens_delete" ON public.mensagens FOR DELETE
  USING (
    remetente_id = auth.uid()
    OR (public.get_my_tipo() IN ('sindico', 'admin_master') AND condominio_id = public.get_my_condo())
  );

-- 1.5 Realtime para mensagens
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mensagens') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========== PARTE 2: NOTIFICAÇÕES ==========

-- 2.1 Tabela notificacoes
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('encomenda', 'reserva', 'aviso', 'mensagem')),
  titulo text NOT NULL,
  corpo text,
  lida boolean DEFAULT false,
  referencia_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON public.notificacoes(user_id, lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes(created_at DESC);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificacoes_select" ON public.notificacoes;
CREATE POLICY "notificacoes_select" ON public.notificacoes FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_update" ON public.notificacoes;
CREATE POLICY "notificacoes_update" ON public.notificacoes FOR UPDATE USING (user_id = auth.uid());

-- 2.2 Coluna notificar_chat em usuarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'notificar_chat') THEN
    ALTER TABLE public.usuarios ADD COLUMN notificar_chat boolean DEFAULT true;
  END IF;
END $$;

-- 2.3 Tabela push_subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_update" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());

-- ========== PARTE 3: TABELAS AUXILIARES (encomendas, reservas, avisos) ==========
-- Necessárias para os triggers de notificação; criadas se não existirem.

CREATE TABLE IF NOT EXISTS public.encomendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
  unidade text NOT NULL,
  bloco text,
  remetente text,
  descricao text,
  status text DEFAULT 'Pendente',
  recebedor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entregador_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data_entrega timestamptz
);
ALTER TABLE public.encomendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "encomendas_select" ON public.encomendas;
CREATE POLICY "encomendas_select" ON public.encomendas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND (u.condominio_id = encomendas.condominio_id))
);
DROP POLICY IF EXISTS "encomendas_insert" ON public.encomendas;
CREATE POLICY "encomendas_insert" ON public.encomendas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.condominio_id = condominio_id AND u.tipo IN ('sindico', 'porteiro', 'admin_master'))
);
DROP POLICY IF EXISTS "encomendas_update" ON public.encomendas;
CREATE POLICY "encomendas_update" ON public.encomendas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.condominio_id = encomendas.condominio_id AND u.tipo IN ('sindico', 'porteiro', 'admin_master'))
);

CREATE TABLE IF NOT EXISTS public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
  area_nome text NOT NULL,
  data date NOT NULL,
  horario text NOT NULL,
  status text DEFAULT 'Confirmada',
  morador_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservas_all" ON public.reservas;
CREATE POLICY "reservas_all" ON public.reservas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.condominio_id = reservas.condominio_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL,
  tag text DEFAULT 'OFICIAL'
);
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avisos_all" ON public.avisos;
CREATE POLICY "avisos_all" ON public.avisos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.condominio_id = avisos.condominio_id)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid())
);

-- ========== PARTE 4: TRIGGERS QUE CRIAM NOTIFICAÇÕES ==========

-- 4.1 Nova mensagem no chat → notifica usuários do condomínio
CREATE OR REPLACE FUNCTION public.notify_nova_mensagem() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT u.id FROM public.usuarios u
    WHERE u.condominio_id = NEW.condominio_id AND u.id != NEW.remetente_id
      AND COALESCE(u.notificar_chat, true) = true
  )
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (
      r.id, NEW.condominio_id, 'mensagem',
      'Nova mensagem em ' || COALESCE((SELECT nome FROM public.conversas WHERE id = NEW.conversa_id LIMIT 1), 'Chat'),
      LEFT(NEW.conteudo, 100), NEW.id, jsonb_build_object('remetente', NEW.remetente_nome, 'conversa_id', NEW.conversa_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_mensagem ON public.mensagens;
CREATE TRIGGER trg_notify_nova_mensagem AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_mensagem();

-- 4.2 Nova encomenda → notifica moradores da unidade
CREATE OR REPLACE FUNCTION public.notify_nova_encomenda() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT u.id FROM public.usuarios u
    WHERE u.condominio_id = NEW.condominio_id
      AND (u.unidade IS NULL OR u.unidade = NEW.unidade)
      AND (u.bloco IS NULL OR u.bloco = NEW.bloco)
  )
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (r.id, NEW.condominio_id, 'encomenda', 'Nova encomenda',
      COALESCE(NEW.remetente, '') || ': ' || LEFT(COALESCE(NEW.descricao, ''), 80),
      NEW.id, jsonb_build_object('unidade', NEW.unidade, 'bloco', NEW.bloco));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_encomenda ON public.encomendas;
CREATE TRIGGER trg_notify_nova_encomenda AFTER INSERT ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_encomenda();

-- 4.3 Nova reserva → notifica quem reservou
CREATE OR REPLACE FUNCTION public.notify_nova_reserva() RETURNS trigger AS $$
BEGIN
  IF NEW.morador_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (NEW.morador_id, NEW.condominio_id, 'reserva', 'Reserva confirmada',
      COALESCE(NEW.area_nome, 'Área') || ' em ' || COALESCE(NEW.data::text, '') || ' ' || COALESCE(NEW.horario, ''),
      NEW.id, jsonb_build_object('area_nome', NEW.area_nome, 'data', NEW.data, 'horario', NEW.horario));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_reserva ON public.reservas;
CREATE TRIGGER trg_notify_nova_reserva AFTER INSERT ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_reserva();

-- 4.4 Novo aviso → notifica todos do condomínio
CREATE OR REPLACE FUNCTION public.notify_novo_aviso() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT u.id FROM public.usuarios u WHERE u.condominio_id = NEW.condominio_id)
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (r.id, NEW.condominio_id, 'aviso', 'Aviso: ' || NEW.titulo,
      LEFT(NEW.descricao, 150), NEW.id, jsonb_build_object('tag', NEW.tag));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_novo_aviso ON public.avisos;
CREATE TRIGGER trg_notify_novo_aviso AFTER INSERT ON public.avisos
  FOR EACH ROW EXECUTE FUNCTION public.notify_novo_aviso();

-- ========== PARTE 5: WEBHOOK PARA PUSH (ENVIA PARA EDGE FUNCTION) ==========

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.webhook_notificacoes_to_send_push()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  func_url text := 'https://amgpwwdhqtoaxkrvakzg.supabase.co/functions/v1/send-push';
  payload jsonb;
BEGIN
  payload := jsonb_build_object('type', 'INSERT', 'table', 'notificacoes', 'schema', 'public', 'record', to_jsonb(NEW), 'old_record', null);
  PERFORM net.http_post(url := func_url, body := payload, headers := '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds := 5000);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'webhook_notificacoes_to_send_push: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "webhook_notificacoes_to_push" ON public.notificacoes;
CREATE TRIGGER "webhook_notificacoes_to_push" AFTER INSERT ON public.notificacoes
  FOR EACH ROW EXECUTE FUNCTION public.webhook_notificacoes_to_send_push();

-- ========== PARTE 6: REALTIME PARA NOTIFICAÇÕES ==========

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

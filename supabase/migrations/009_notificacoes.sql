-- ============================================
-- Sistema de Notificações
-- Tabela notificacoes + preferências + push subscriptions
-- Ligada a eventos: encomenda, reserva, aviso, nova mensagem
-- ============================================

-- 1. Tabela notificacoes (eventos do sistema)
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
CREATE POLICY "notificacoes_select" ON public.notificacoes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notificacoes_update" ON public.notificacoes;
CREATE POLICY "notificacoes_update" ON public.notificacoes
  FOR UPDATE USING (user_id = auth.uid());

-- Inserção apenas via triggers (funções SECURITY DEFINER); sem política INSERT para usuários

-- 2. Preferência "Notificar novas mensagens" (persistida no backend para Web Push)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'notificar_chat') THEN
    ALTER TABLE public.usuarios ADD COLUMN notificar_chat boolean DEFAULT true;
  END IF;
END $$;

-- 3. Tabela push_subscriptions (Web Push - assinaturas por dispositivo)
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
CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_update" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update" ON public.push_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_subscriptions_delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- 4. Funções para criar notificações (chamadas por triggers)

-- Notificação: nova mensagem no chat
CREATE OR REPLACE FUNCTION public.notify_nova_mensagem() RETURNS trigger AS $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT u.id
    FROM public.usuarios u
    WHERE u.condominio_id = NEW.condominio_id
      AND u.id != NEW.remetente_id
      AND COALESCE(u.notificar_chat, true) = true
  )
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (
      r.id, NEW.condominio_id, 'mensagem',
      'Nova mensagem em ' || (SELECT nome FROM public.conversas WHERE id = NEW.conversa_id LIMIT 1),
      LEFT(NEW.conteudo, 100), NEW.id,
      jsonb_build_object('remetente', NEW.remetente_nome, 'conversa_id', NEW.conversa_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: mensagens
DROP TRIGGER IF EXISTS trg_notify_nova_mensagem ON public.mensagens;
CREATE TRIGGER trg_notify_nova_mensagem
  AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_mensagem();

-- Notificação: nova encomenda (para o morador da unidade/bloco)
CREATE OR REPLACE FUNCTION public.notify_nova_encomenda() RETURNS trigger AS $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT u.id FROM public.usuarios u
    WHERE u.condominio_id = NEW.condominio_id
      AND (u.unidade IS NULL OR u.unidade = NEW.unidade)
      AND (u.bloco IS NULL OR u.bloco = NEW.bloco)
  )
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (
      r.id, NEW.condominio_id, 'encomenda',
      'Nova encomenda',
      COALESCE(NEW.remetente, '') || ': ' || LEFT(COALESCE(NEW.descricao, ''), 80),
      NEW.id, jsonb_build_object('unidade', NEW.unidade, 'bloco', NEW.bloco)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_encomenda ON public.encomendas;
CREATE TRIGGER trg_notify_nova_encomenda
  AFTER INSERT ON public.encomendas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_encomenda();

-- Notificação: nova reserva (confirmação para quem reservou)
CREATE OR REPLACE FUNCTION public.notify_nova_reserva() RETURNS trigger AS $$
BEGIN
  IF NEW.morador_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (
      NEW.morador_id, NEW.condominio_id, 'reserva',
      'Reserva confirmada',
      COALESCE(NEW.area_nome, 'Área') || ' em ' || COALESCE(NEW.data::text, '') || ' ' || COALESCE(NEW.horario, ''),
      NEW.id, jsonb_build_object('area_nome', NEW.area_nome, 'data', NEW.data, 'horario', NEW.horario)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_reserva ON public.reservas;
CREATE TRIGGER trg_notify_nova_reserva
  AFTER INSERT ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_reserva();

-- Notificação: novo aviso do síndico
CREATE OR REPLACE FUNCTION public.notify_novo_aviso() RETURNS trigger AS $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT u.id FROM public.usuarios u WHERE u.condominio_id = NEW.condominio_id
  )
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (
      r.id, NEW.condominio_id, 'aviso',
      'Aviso: ' || NEW.titulo,
      LEFT(NEW.descricao, 150), NEW.id,
      jsonb_build_object('tag', NEW.tag)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_novo_aviso ON public.avisos;
CREATE TRIGGER trg_notify_novo_aviso
  AFTER INSERT ON public.avisos
  FOR EACH ROW EXECUTE FUNCTION public.notify_novo_aviso();

-- As funções SECURITY DEFINER executam com privilégios do owner, permitindo INSERT via triggers

-- Realtime: habilitar para notificacoes (alertas em tempo real no app)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignora se publicação não existir (ex: local)
END $$;

-- ============================================
-- Rode este arquivo no Supabase SQL Editor
-- https://supabase.com/dashboard > SQL Editor > New query > Cole e Execute
-- ============================================

-- ========== 009_notificacoes ==========
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'notificar_chat') THEN
    ALTER TABLE public.usuarios ADD COLUMN notificar_chat boolean DEFAULT true;
  END IF;
END $$;

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

CREATE OR REPLACE FUNCTION public.notify_nova_mensagem() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT u.id FROM public.usuarios u WHERE u.condominio_id = NEW.condominio_id AND u.id != NEW.remetente_id AND COALESCE(u.notificar_chat, true) = true)
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (r.id, NEW.condominio_id, 'mensagem', 'Nova mensagem em ' || (SELECT nome FROM public.conversas WHERE id = NEW.conversa_id LIMIT 1), LEFT(NEW.conteudo, 100), NEW.id, jsonb_build_object('remetente', NEW.remetente_nome, 'conversa_id', NEW.conversa_id));
  END LOOP;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_notify_nova_mensagem ON public.mensagens;
CREATE TRIGGER trg_notify_nova_mensagem AFTER INSERT ON public.mensagens FOR EACH ROW EXECUTE FUNCTION public.notify_nova_mensagem();

CREATE OR REPLACE FUNCTION public.notify_nova_encomenda() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT u.id FROM public.usuarios u WHERE u.condominio_id = NEW.condominio_id AND (u.unidade IS NULL OR u.unidade = NEW.unidade) AND (u.bloco IS NULL OR u.bloco = NEW.bloco))
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (r.id, NEW.condominio_id, 'encomenda', 'Nova encomenda', COALESCE(NEW.remetente, '') || ': ' || LEFT(COALESCE(NEW.descricao, ''), 80), NEW.id, jsonb_build_object('unidade', NEW.unidade, 'bloco', NEW.bloco));
  END LOOP;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_notify_nova_encomenda ON public.encomendas;
CREATE TRIGGER trg_notify_nova_encomenda AFTER INSERT ON public.encomendas FOR EACH ROW EXECUTE FUNCTION public.notify_nova_encomenda();

CREATE OR REPLACE FUNCTION public.notify_nova_reserva() RETURNS trigger AS $$
BEGIN
  IF NEW.morador_id IS NOT NULL THEN
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (NEW.morador_id, NEW.condominio_id, 'reserva', 'Reserva confirmada', COALESCE(NEW.area_nome, 'Área') || ' em ' || COALESCE(NEW.data::text, '') || ' ' || COALESCE(NEW.horario, ''), NEW.id, jsonb_build_object('area_nome', NEW.area_nome, 'data', NEW.data, 'horario', NEW.horario));
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_notify_nova_reserva ON public.reservas;
CREATE TRIGGER trg_notify_nova_reserva AFTER INSERT ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.notify_nova_reserva();

CREATE OR REPLACE FUNCTION public.notify_novo_aviso() RETURNS trigger AS $$
DECLARE r record;
BEGIN
  FOR r IN (SELECT u.id FROM public.usuarios u WHERE u.condominio_id = NEW.condominio_id)
  LOOP
    INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
    VALUES (r.id, NEW.condominio_id, 'aviso', 'Aviso: ' || NEW.titulo, LEFT(NEW.descricao, 150), NEW.id, jsonb_build_object('tag', NEW.tag));
  END LOOP;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS trg_notify_novo_aviso ON public.avisos;
CREATE TRIGGER trg_notify_novo_aviso AFTER INSERT ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.notify_novo_aviso();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========== 010_achados_perdidos ==========
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
CREATE POLICY "achados_select" ON public.achados_perdidos FOR SELECT USING (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master');
DROP POLICY IF EXISTS "achados_insert" ON public.achados_perdidos;
CREATE POLICY "achados_insert" ON public.achados_perdidos FOR INSERT WITH CHECK (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master');
DROP POLICY IF EXISTS "achados_update" ON public.achados_perdidos;
CREATE POLICY "achados_update" ON public.achados_perdidos FOR UPDATE USING (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master');
DROP POLICY IF EXISTS "achados_delete" ON public.achados_perdidos;
CREATE POLICY "achados_delete" ON public.achados_perdidos FOR DELETE USING (condominio_id = public.get_my_condo() OR public.get_my_tipo() = 'admin_master');

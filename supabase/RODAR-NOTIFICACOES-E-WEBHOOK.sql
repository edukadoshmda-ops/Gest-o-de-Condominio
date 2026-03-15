-- Execute PRIMEIRO: cria notificacoes + push_subscriptions (se não existirem)
-- Depois cria o webhook. Execute no Supabase SQL Editor.
-- Requer: tabelas condominios e usuarios existentes. Habilite pg_net em Database → Extensions.

-- 1. Tabela notificacoes
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

-- 2. Tabela push_subscriptions
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

-- 3. Extensão pg_net e webhook
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.webhook_notificacoes_to_send_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  func_url text := 'https://amgpwwdhqtoaxkrvakzg.supabase.co/functions/v1/send-push';
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'notificacoes',
    'schema', 'public',
    'record', to_jsonb(NEW),
    'old_record', null
  );
  PERFORM net.http_post(
    url := func_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'webhook_notificacoes_to_send_push: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "webhook_notificacoes_to_push" ON public.notificacoes;
CREATE TRIGGER "webhook_notificacoes_to_push"
  AFTER INSERT ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.webhook_notificacoes_to_send_push();

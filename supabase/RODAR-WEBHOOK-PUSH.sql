-- Passo 6: Webhook notificacoes -> send-push
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor)
-- ANTES: habilite a extensão pg_net em Database → Extensions

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

-- ============================================
-- Notificações para DMs + Realtime mensagens_privadas
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Trigger: notificar destinatário quando receber DM
CREATE OR REPLACE FUNCTION public.notify_nova_mensagem_privada() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, condominio_id, tipo, titulo, corpo, referencia_id, metadata)
  SELECT
    NEW.destinatario_id,
    NEW.condominio_id,
    'mensagem',
    'Mensagem de ' || NEW.remetente_nome,
    LEFT(NEW.conteudo, 100),
    NEW.id,
    jsonb_build_object('remetente', NEW.remetente_nome, 'remetente_id', NEW.remetente_id, 'dm', true)
  FROM public.usuarios u
  WHERE u.id = NEW.destinatario_id
    AND COALESCE(u.notificar_chat, true) = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_nova_mensagem_privada ON public.mensagens_privadas;
CREATE TRIGGER trg_notify_nova_mensagem_privada
  AFTER INSERT ON public.mensagens_privadas
  FOR EACH ROW EXECUTE FUNCTION public.notify_nova_mensagem_privada();

-- 2. Realtime: habilitar mensagens_privadas para subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mensagens_privadas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_privadas;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

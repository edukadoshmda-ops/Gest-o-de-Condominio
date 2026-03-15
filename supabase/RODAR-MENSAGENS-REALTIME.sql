-- Execute no Supabase SQL Editor para habilitar Realtime nos canais de chat
-- (necessário para que novas mensagens apareçam em tempo real em Síndico, Portaria, Comercial, Diversos)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'mensagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

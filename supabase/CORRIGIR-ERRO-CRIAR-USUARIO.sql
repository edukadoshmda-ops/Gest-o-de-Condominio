-- ============================================
-- Corrigir: "Database error creating new user"
-- ============================================
-- Execute no Supabase: SQL Editor > New query
-- ============================================

-- ---------- PASSO A: Ver o que está em auth.users ----------
-- Rode isto e confira o resultado (triggers e funções):
SELECT
  t.tgname AS trigger_name,
  (p.pronamespace::regnamespace)::text AS func_schema,
  p.proname AS function_name,
  t.tgisinternal AS eh_interno
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' AND c.relname = 'users'
ORDER BY t.tgisinternal, t.tgname;

-- ---------- PASSO B: Gerar comandos DROP (só triggers NÃO internos) ----------
-- Rode isto; o resultado são linhas de SQL. Copie e execute essas linhas em outra query:
SELECT 'DROP TRIGGER IF EXISTS ' || quote_ident(t.tgname) || ' ON auth.users;' AS comando
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;

-- ---------- PASSO C: Remover triggers e funções comuns ----------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_new_user_created ON auth.users;
DROP TRIGGER IF EXISTS after_signup_create_profile ON auth.users;
DROP TRIGGER IF EXISTS after_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.on_auth_user_created() CASCADE;

-- ---------- PASSO D: REMOVER TODOS OS TRIGGERS NÃO-INTERNOS (use se C não resolveu) ----------
-- Rode este bloco inteiro de uma vez. Ele remove todos os triggers customizados em auth.users.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
    RAISE NOTICE 'Removido trigger: %', r.tgname;
  END LOOP;
END $$;

-- ---------- Onde mais verificar (se ainda der erro) ----------
-- 1) Auth Hooks: Dashboard > Authentication > Hooks
--    Se existir "Before user created" ou "After user created", desative temporariamente.
-- 2) Logs: Dashboard > Logs > Postgres (ou Auth). Tente criar o usuário de novo
--    e veja a mensagem exata do erro no log.
-- 3) Se o PASSO A listar outro trigger, rode no SQL Editor:
--    DROP TRIGGER IF EXISTS nome_que_apareceu ON auth.users;
--    DROP FUNCTION IF EXISTS schema.nome_da_funcao() CASCADE;

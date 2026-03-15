-- Define a senha do edukadoshmda@gmail.com como 123456.
-- Use se o usuário já existe mas o login diz "E-mail ou senha incorretos".
-- Cole no Supabase: SQL Editor > New query > Run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

UPDATE auth.users
SET encrypted_password = crypt('123456', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'edukadoshmda@gmail.com';

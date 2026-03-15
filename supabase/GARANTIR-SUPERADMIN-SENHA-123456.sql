-- Garante que edukadoshmda@gmail.com existe e a senha é 123456.
-- Se o usuário já existir, só atualiza a senha. Se não existir, cria.
-- Cole TODO no Supabase: SQL Editor > New query > Run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT := crypt('123456', gen_salt('bf'));
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'edukadoshmda@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw, updated_at = NOW()
    WHERE email = 'edukadoshmda@gmail.com';
    RAISE NOTICE 'Senha atualizada para 123456. Entre no app agora.';
    RETURN;
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'edukadoshmda@gmail.com',
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_user_id, v_user_id,
    format('{"sub": "%s", "email": "edukadoshmda@gmail.com"}', v_user_id)::jsonb,
    'email', v_user_id, NOW(), NOW(), NOW()
  );

  RAISE NOTICE 'Super admin criado. Entre no app com edukadoshmda@gmail.com e senha 123456';
END $$;

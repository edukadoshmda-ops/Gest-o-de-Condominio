# Criar usuário edukadoshmda@gmail.com (Super Admin)

Se aparecer **"Database error creating new user"** (no script ou no Dashboard), a causa costuma ser um **trigger** na tabela `auth.users` que falha ao criar o usuário.

## Corrigir o erro antes de criar o usuário

1. No **Supabase Dashboard**: **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/CORRIGIR-ERRO-CRIAR-USUARIO.sql`** do projeto.
3. Execute primeiro a query que **lista** os triggers em `auth.users`.
4. Depois execute as linhas que fazem **DROP TRIGGER** (removem os triggers comuns).
5. Tente criar o usuário de novo em **Authentication** → **Users** → **Add user**.

---

## Criar super admin com script (recomendado)

O script **`criar-superadmin.js`** cria o usuário `edukadoshmda@gmail.com` / senha `123456` já confirmado, usando a API Admin do Supabase.

1. No Supabase: **Settings** → **API** → copie a chave **service_role** (secret).
2. Crie um arquivo **`.env`** na raiz do projeto (se ainda não tiver) e adicione:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```
   (Ou use só no terminal, sem salvar no arquivo.)
3. Na raiz do projeto, rode:
   - **PowerShell:** `$env:SUPABASE_SERVICE_ROLE_KEY="sua_chave"; node criar-superadmin.js`
   - **Cmd:** `set SUPABASE_SERVICE_ROLE_KEY=sua_chave && node criar-superadmin.js`
4. Se aparecer "Database error", execute antes o **CORRIGIR-ERRO-CRIAR-USUARIO.sql** (passos C e D) no SQL Editor.

Depois, entre no app com **edukadoshmda@gmail.com** e senha **123456**. O app já trata esse e-mail como Super Admin.

---

## Criar o usuário no Dashboard (depois de corrigir)

## Passos

1. Acesse: **https://supabase.com/dashboard**
2. Abra o projeto: **ozwccrfzxsbsciobwhke** (Gestão de Condomínio)
3. No menu lateral: **Authentication** → **Users**
4. Clique em **"Add user"** → **"Create new user"**
5. Preencha:
   - **Email:** `edukadoshmda@gmail.com`
   - **Password:** `123456`
6. (Opcional) Se existir "Auto Confirm User", marque para não exigir confirmação por e-mail.
7. Clique em **"Create user"**.

Depois disso, entre no app com esse e-mail e senha. O sistema reconhece esse e-mail como **Super Admin** e permite acesso mesmo sem cadastro em condomínio.

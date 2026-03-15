# Login do super admin (edukadoshmda@gmail.com / 123456)

O usuário só funciona depois de criar a conta no Supabase. Use **uma** das opções abaixo.

---

## Opção A – Criar usuário direto no SQL (recomendado)

Não depende de trigger nem do script no PC. Cria o usuário direto nas tabelas `auth.users` e `auth.identities`.

1. Abra **Supabase Dashboard** → seu projeto → **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/CRIAR-SUPERADMIN-VIA-SQL.sql`** no seu projeto.
3. Copie **todo** o conteúdo (Ctrl+A, Ctrl+C).
4. Cole no SQL Editor e clique em **Run**.
5. Entre no app com **edukadoshmda@gmail.com** e senha **123456**.

---

## Opção B – Remover trigger e usar o script no PC

1. No Supabase: **SQL Editor** → cole e execute o conteúdo de **`supabase/RODAR-ANTES-DE-CRIAR-SUPERADMIN.sql`**.
2. No terminal, na pasta do projeto: `node criar-superadmin.js`.
3. Entre no app com **edukadoshmda@gmail.com** e senha **123456**.

Se ainda der "Database error", confira **Authentication** → **Hooks** e desative "Before user created" / "After user created".

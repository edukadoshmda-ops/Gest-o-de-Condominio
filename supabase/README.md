# Supabase - Migrations

## Como aplicar

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Copie o conteúdo de `migrations/001_comentarios_rls.sql`
4. Cole e execute

## O que a migração faz

- **Tabela `comentarios`**: armazena comentários dos posts do mural
- **RLS (Row Level Security)**: políticas de segurança para `comentarios`, `mural`, `faturas` e `usuarios`

> **Importante**: Se a tabela `mural` tiver estrutura diferente (ex: `id` não é UUID), ajuste o script antes de executar.

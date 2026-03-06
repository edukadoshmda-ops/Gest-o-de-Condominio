# Passo a passo: Notificações no dispositivo (Web Push)

## PASSO 1 — Chave VAPID no seu projeto (.env)

**Onde:** pasta do projeto → arquivo `.env`

**O quê:** Garantir que existe esta linha (já deve estar):

```
VITE_VAPID_PUBLIC_KEY=BAA0g1jJbit7u4cHWTrHa9SeycciinEXy2yUCb_QBIithquF0M04EzNzSDrR7TwQ-RbBq5agBFeeMWGdGA9lz88
```

**Como:** Abra o `.env` e confira. Se não existir, inclua essa linha.

---

## PASSO 2 — Tabela push_subscriptions no Supabase

**Onde:** Supabase Dashboard → **SQL Editor**

**O quê:** Criar a tabela `push_subscriptions` (se ainda não existir)

**Como:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query**
5. Cole o SQL abaixo e execute (**Run**):

```sql
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_select" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_insert" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_update" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "push_subscriptions_delete" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid());
```

---

## PASSO 3 — Deploy da Edge Function send-push

**Onde:** terminal (PowerShell ou CMD), na pasta do projeto

**O quê:** Publicar a função `send-push` no Supabase

**Como:**
1. Abra o terminal na pasta do projeto
2. Faça login (se ainda não fez): `supabase login`
3. Vincule o projeto (se ainda não fez): `supabase link --project-ref xarljytgieadligbrtzf`
4. Execute: `supabase functions deploy send-push`

---

## PASSO 4 — Secret VAPID na Edge Function

**Onde:** Supabase Dashboard → **Edge Functions** → **send-push**

**O quê:** Adicionar o secret com as chaves VAPID

**Como:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Menu lateral → **Edge Functions**
4. Clique em **send-push**
5. Aba **Manage secrets** (ou **Secrets**)
6. **Add new secret**
7. Nome: `VAPID_KEYS_JSON`
8. Valor (copie exatamente):

```
{"privateKey":"lCIvA0GD0VReiCvYBmLzAsB-XkzctdJnWufa8p28aI8","publicKey":"BAA0g1jJbit7u4cHWTrHa9SeycciinEXy2yUCb_QBIithquF0M04EzNzSDrR7TwQ-RbBq5agBFeeMWGdGA9lz88"}
```

9. Salvar

---

## PASSO 5 — Webhook para chamar a função

**Onde:** Supabase Dashboard → **Database** → **Webhooks**

**O quê:** Ao inserir uma linha em `notificacoes`, chamar a função `send-push`

**Como:**
1. Menu lateral → **Database** → **Webhooks**
2. **Create a new hook** (ou **Create webhook**)
3. **Name:** `notificacoes-to-push`
4. **Table:** `public.notificacoes`
5. **Events:** marque só **Insert**
6. **Type:** **Supabase Edge Function**
7. **Edge Function:** `send-push`
8. Salvar / **Create webhook**

---

## PASSO 6 — Rodar o app e ativar as notificações

**Onde:** seu app (navegador)

**O quê:** Reiniciar o app e ativar notificações

**Como:**
1. No terminal, pare o app (Ctrl+C) e rode de novo: `npm run dev`
2. Abra o app no navegador
3. Faça login
4. Vá ao **Mural** (feed principal)
5. Na sidebar direita (Conversas), clique no ícone de **engrenagem** (configurações)
6. Na janela "Configurações do Chat", clique em **"Ativar notificações no dispositivo (mesmo fechando o app)"**
7. Quando o navegador pedir, clique em **Permitir**

Se aparecer **"Notificações no dispositivo ativadas"**, está funcionando.

---

## Resumo da ordem

1. `.env` com `VITE_VAPID_PUBLIC_KEY`
2. Tabela `push_subscriptions` no Supabase (SQL Editor)
3. Deploy: `supabase functions deploy send-push`
4. Secret `VAPID_KEYS_JSON` em Edge Functions → send-push
5. Webhook: Database → Webhooks → `notificacoes` INSERT → função `send-push`
6. Reiniciar app e ativar notificações no chat

---

## Problemas comuns

| Sintoma | Solução |
|--------|---------|
| "Configure a chave VAPID no .env" | Confira o Passo 1 e reinicie o app |
| "Permissão negada" | Aceite as notificações nas configurações do site/navegador |
| "Erro ao registrar o serviço" | Use HTTPS ou localhost |
| Ativou mas não chega push | Verifique o Passo 4 (secret) e o Passo 5 (webhook) |

# Passos manuais: Notificações Push

Execute na ordem abaixo. A documentação completa está em [NOTIFICACOES.md](./NOTIFICACOES.md).

---

## 1. Chave VAPID no .env ✅
Verifique se seu `.env` contém:
```
VITE_VAPID_PUBLIC_KEY=BAA0g1jJbit7u4cHWTrHa9SeycciinEXy2yUCb_QBIithquF0M04EzNzSDrR7TwQ-RbBq5agBFeeMWGdGA9lz88
```

## 2. Tabela push_subscriptions
Execute no Supabase SQL Editor o conteúdo de `supabase/RODAR-PUSH-SUBSCRIPTIONS.sql`

## 3. Deploy da Edge Function
1. Abra o terminal **na pasta do projeto** (ex: `cd "D:\Users\eduka\Desktop\GESTÃO DE CONDOMNIO"`)
2. Pegue o project ref em Supabase Dashboard → Project Settings → General → Reference ID
3. Execute:
```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF_AQUI
npm run deploy-push
```

## 4. Secret VAPID na Edge Function
Supabase Dashboard → Edge Functions → send-push → Manage secrets

**Nome:** `VAPID_KEYS_JSON`  
**Valor:**
```json
{"privateKey":"lCIvA0GD0VReiCvYBmLzAsB-XkzctdJnWufa8p28aI8","publicKey":"BAA0g1jJbit7u4cHWTrHa9SeycciinEXy2yUCb_QBIithquF0M04EzNzSDrR7TwQ-RbBq5agBFeeMWGdGA9lz88"}
```

## 5. Webhook (opção A – SQL)
1. **Habilite pg_net:** Dashboard → Database → Extensions → procure "pg_net" → Enable
2. Execute no **SQL Editor** o conteúdo de `supabase/RODAR-WEBHOOK-PUSH.sql`

## 5. Webhook (opção B – Dashboard)
1. Dashboard → **Database** → **Webhooks** → Create webhook
2. **Name:** `notificacoes-to-push` | **Table:** `public.notificacoes`
3. **Events:** Insert | **Type:** Supabase Edge Function | **Function:** `send-push`

## 6. Testar
Reinicie o app, faça login, vá ao Mural e ative as notificações.

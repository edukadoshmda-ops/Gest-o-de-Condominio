/**
 * Edge Function: envia Web Push quando uma notificação é inserida.
 * Usa @negrel/webpush (compatível com Deno).
 *
 * CONFIGURAÇÃO:
 * 1. Gerar chaves: deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts
 * 2. Salvar em vapid.json; definir secret: VAPID_KEYS_JSON = conteúdo do arquivo (JSON)
 * 3. .env do cliente: VITE_VAPID_PUBLIC_KEY = chave pública (exportApplicationServerKey)
 * 4. Webhook: notificacoes INSERT -> send-push
 * 5. Deploy: supabase functions deploy send-push
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { ApplicationServer, importVapidKeys } from 'jsr:@negrel/webpush@0.5'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface Notificacao {
  id: string
  user_id: string
  tipo: string
  titulo: string
  corpo?: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Notificacao
  schema: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

let appServer: ApplicationServer | null = null
async function getAppServer(): Promise<ApplicationServer | null> {
  if (appServer) return appServer
  const json = Deno.env.get('VAPID_KEYS_JSON')
  if (!json) return null
  try {
    const keys = await importVapidKeys(typeof json === 'string' ? JSON.parse(json) : json)
    appServer = await ApplicationServer.new({
      contactInformation: Deno.env.get('VAPID_CONTACT') || 'mailto:admin@condominio.local',
      vapidKeys: keys,
    })
    return appServer
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const payload: WebhookPayload = await req.json()
    if (payload.type !== 'INSERT' || payload.table !== 'notificacoes') {
      return new Response(JSON.stringify({ error: 'Invalid webhook' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const as = await getAppServer()
    if (!as) {
      return new Response(
        JSON.stringify({ error: 'VAPID_KEYS_JSON not configured', sent: 0 }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const n = payload.record
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', n.user_id)

    if (error || !subs?.length) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, reason: 'no_subscriptions' }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const payload_msg = JSON.stringify({
      title: n.titulo,
      body: (n.corpo || '').slice(0, 200),
      tag: n.tipo,
      data: { id: n.id, tipo: n.tipo },
    })

    let sent = 0
    for (const sub of subs) {
      try {
        const subscriber = as.subscribe({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        })
        await subscriber.pushTextMessage(payload_msg, { urgency: 'high' })
        sent++
      } catch (e) {
        console.warn('Push failed:', sub.endpoint?.slice(0, 50), e)
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('send-push error:', e)
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})

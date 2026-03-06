import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

/**
 * Registra o Service Worker para push
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (e) {
    console.warn('Service Worker não registrado:', e)
    return null
  }
}

/**
 * Converte URL-safe base64 em Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/**
 * Solicita permissão e inscreve para Web Push
 * Salva a subscription em push_subscriptions
 * @param {string} userId
 * @param {ServiceWorkerRegistration} [reg] - Opcional: registration do SW (usa navigator.serviceWorker.ready se não informado)
 */
export async function subscribeToPush(userId, reg) {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY não configurada')
    return false
  }
  if (!userId) return false

  try {
    const registration = reg || (await navigator.serviceWorker.ready)
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const endpoint = sub.endpoint
    const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))))
    const auth = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))))

    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh, auth },
      { onConflict: 'user_id,endpoint' }
    )
    if (error) throw error
    return true
  } catch (e) {
    console.warn('Falha ao inscrever push:', e)
    return false
  }
}

/**
 * Ativa notificações push: pede permissão, registra SW, inscreve e salva.
 * Retorna { ok: boolean, reason?: string } para feedback ao usuário.
 */
export async function enablePushNotifications(userId) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, reason: 'navegador' }
  }
  if (!VAPID_PUBLIC_KEY.trim()) {
    return { ok: false, reason: 'vapid' }
  }
  if (!userId) return { ok: false, reason: 'usuario' }

  try {
    let perm = Notification.permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
    }
    if (perm !== 'granted') {
      return { ok: false, reason: 'negado' }
    }

    const reg = await registerServiceWorker()
    if (!reg) return { ok: false, reason: 'sw' }
    await reg.ready

    const ok = await subscribeToPush(userId, reg)
    return ok ? { ok: true } : { ok: false, reason: 'subscribe' }
  } catch (e) {
    console.warn('enablePushNotifications:', e)
    return { ok: false, reason: 'erro' }
  }
}

/**
 * Remove subscription atual (logout ou opt-out)
 */
export async function unsubscribePush(userId) {
  if (!userId) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      const { data } = await supabase.from('push_subscriptions').select('id').eq('user_id', userId).eq('endpoint', sub.endpoint)
      if (data?.length) await supabase.from('push_subscriptions').delete().eq('id', data[0].id)
    }
  } catch (e) {
    console.warn('Falha ao desinscrever push:', e)
  }
}

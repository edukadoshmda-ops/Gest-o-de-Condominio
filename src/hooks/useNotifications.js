import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook para notificações em tempo real.
 * - Escuta inserts em notificacoes para o user_id
 * - Sincroniza preferência notificar_chat com localStorage e backend
 * - Exibe toast quando chega notificação (se notificar_chat ativo)
 */
export function useNotifications(session, userProfile, { onNotify, toast } = {}) {
  const userId = session?.user?.id

  // Sincronizar preferência notificar_chat com backend ao montar
  useEffect(() => {
    if (!userId || !userProfile) return

    const stored = localStorage.getItem('chat_notificar_novas')
    const pref = stored !== 'false'

    if (userProfile.notificar_chat !== pref) {
      supabase
        .from('usuarios')
        .update({ notificar_chat: pref })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.warn('Erro ao atualizar notificar_chat:', error)
        })
    }
  }, [userId, userProfile])

  const updateNotificarChat = useCallback(
    async (value) => {
      if (!userId) return
      localStorage.setItem('chat_notificar_novas', value ? 'true' : 'false')
      const { error } = await supabase.from('usuarios').update({ notificar_chat: value }).eq('id', userId)
      if (error) console.warn('Erro ao atualizar notificar_chat:', error)
    },
    [userId]
  )

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new
          if (onNotify) onNotify(n)
          if (toast && n.tipo === 'mensagem') {
            const notificar = localStorage.getItem('chat_notificar_novas') !== 'false'
            if (notificar) {
              toast(`${n.titulo}: ${(n.corpo || '').slice(0, 60)}...`, 'info')
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onNotify, toast])

  return { updateNotificarChat }
}

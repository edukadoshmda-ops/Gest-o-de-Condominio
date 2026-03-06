import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    Bell,
    Package,
    Calendar,
    AlertCircle,
    MessageSquare,
    CheckCircle2,
    Loader2,
    ChevronRight,
    Trash2
} from 'lucide-react'

const TIPO_ICON = {
    encomenda: { Icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    reserva: { Icon: Calendar, color: 'text-green-500', bg: 'bg-green-500/10' },
    aviso: { Icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    mensagem: { Icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' },
}

const TIPO_ROTA = {
    encomenda: 'encomendas',
    reserva: 'reservas',
    aviso: 'mural',
    mensagem: 'mural',
}

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Agora'
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`
    return `Há ${Math.floor(diff / 86400)} dias`
}

export const CentroNotificacoes = ({ session, userProfile, setActiveTab }) => {
    const [notificacoes, setNotificacoes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todas')

    const fetchNotificacoes = async () => {
        if (!session?.user?.id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(100)
            if (error) throw error
            setNotificacoes(data || [])
        } catch (err) {
            console.error('Erro ao buscar notificações:', err)
            setNotificacoes([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchNotificacoes() }, [session?.user?.id])

    const marcarLida = async (id) => {
        try {
            await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
            setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
        } catch (e) { console.warn(e) }
    }

    const marcarTodasLidas = async () => {
        try {
            await supabase.from('notificacoes').update({ lida: true }).eq('user_id', session.user.id).eq('lida', false)
            setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
        } catch (e) { console.warn(e) }
    }

    const list = filtro === 'todas' ? notificacoes : notificacoes.filter(n => (filtro === 'lidas' && n.lida) || (filtro === 'nao_lidas' && !n.lida))
    const naoLidas = notificacoes.filter(n => !n.lida).length

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Centro de Notificações</h1>
                    <p className="text-slate-500 text-sm mt-1">{naoLidas} não lidas</p>
                </div>
                {naoLidas > 0 && (
                    <button
                        onClick={marcarTodasLidas}
                        className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            <div className="flex gap-2">
                {['todas', 'lidas', 'nao_lidas'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFiltro(f)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${filtro === f ? 'bg-primary text-white border-primary' : 'bg-surface border-card-border hover:border-primary/50'}`}
                    >
                        {f === 'todas' ? 'Todas' : f === 'lidas' ? 'Lidas' : 'Não lidas'}
                    </button>
                ))}
            </div>

            <div className="bg-surface rounded-3xl border border-card-border overflow-hidden shadow-xl">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <Bell size={48} className="mb-4 opacity-50" />
                        <p className="text-sm font-bold">Nenhuma notificação</p>
                    </div>
                ) : (
                    <div className="divide-y divide-card-border/50">
                        {list.map((n) => {
                            const cfg = TIPO_ICON[n.tipo] || TIPO_ICON.mensagem
                            const Icon = cfg.Icon
                            return (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors ${!n.lida ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`size-12 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                                        <Icon size={22} className={cfg.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold ${!n.lida ? 'text-slate-900' : 'text-slate-600'}`}>{n.titulo}</p>
                                        {n.corpo && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.corpo}</p>}
                                        <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                                        <div className="flex gap-3 mt-2">
                                            <button
                                                onClick={() => { setActiveTab?.(TIPO_ROTA[n.tipo]); marcarLida(n.id) }}
                                                className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                                            >
                                                Ver <ChevronRight size={12} className="inline" />
                                            </button>
                                            {!n.lida && (
                                                <button
                                                    onClick={() => marcarLida(n.id)}
                                                    className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700"
                                                >
                                                    <CheckCircle2 size={12} className="inline mr-0.5" /> Marcar lida
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

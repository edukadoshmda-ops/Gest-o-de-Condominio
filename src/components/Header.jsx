import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Menu, Search, X, Calendar, Package, AlertCircle, Palette, LogOut, Trash2, MessageSquare } from 'lucide-react'

const TIPO_ICON = { encomenda: Package, reserva: Calendar, aviso: AlertCircle, mensagem: MessageSquare }
const TIPO_ROTA = { encomenda: 'encomendas', reserva: 'reservas', aviso: 'mural', mensagem: 'mural' }

function formatNotifTime(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const s = Math.floor((now - d) / 1000)
    if (s < 60) return 'Agora'
    if (s < 3600) return `${Math.floor(s / 60)} min`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    return `${Math.floor(s / 86400)}d`
}

export const Header = ({ onOpenDrawer, session, setActiveTab, currentTheme, onThemeChange, onLogout, onSearch }) => {
    const [showNotifications, setShowNotifications] = useState(false)
    const [showThemes, setShowThemes] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [notifications, setNotifications] = useState([])
    const [loadingNotif, setLoadingNotif] = useState(true)

    useEffect(() => {
        if (!session?.user?.id) return
        const fetch = async () => {
            const { data } = await supabase
                .from('notificacoes')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10)
            setNotifications(data || [])
            setLoadingNotif(false)
        }
        fetch()
    }, [session?.user?.id, showNotifications])

    const marcarLida = async (id) => {
        await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    }

    const naoLidas = notifications.filter(n => !n.lida).length

    const themes = [
        { id: 'midnight', name: 'Midnight', color: 'bg-[#ec5b13]' },
        { id: 'ocean', name: 'Ocean', color: 'bg-[#0ea5e9]' },
        { id: 'emerald', name: 'Emerald', color: 'bg-[#d4af37]' },
        { id: 'sunset', name: 'Sunset', color: 'bg-[#f43f5e]' },
        { id: 'purple', name: 'Purple', color: 'bg-[#a855f7]' },
        { id: 'darkBlue', name: 'Azul Escuro', color: 'bg-[#38bdf8]' },
        { id: 'black', name: 'Preto', color: 'bg-[#facc15]' },
    ]

    const userEmail = session?.user?.email || 'Visitante'
    const initial = userEmail[0].toUpperCase()

    const handleDismiss = (id) => {
        marcarLida(id)
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            onSearch?.(searchTerm.trim())
        }
    }

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-card-border/50 px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
                    onClick={onOpenDrawer}
                >
                    <Menu size={24} />
                </button>

                <div className="flex items-center gap-2">
                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-wider">
                        {userEmail}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center bg-surface border border-card-border px-3 py-1.5 rounded-xl mr-2 focus-within:border-primary/50 transition-all">
                    <Search
                        size={16}
                        className={`${searchTerm ? 'text-primary' : 'text-slate-500'} mr-2 transition-colors`}
                    />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearch}
                        className="bg-transparent border-none text-xs text-slate-900 focus:ring-0 w-32 focus:w-48 transition-all outline-none"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowThemes(!showThemes)}
                        className={`size-10 flex items-center justify-center rounded-xl bg-surface border ${showThemes ? 'border-primary bg-primary/5' : 'border-card-border'
                            } hover:border-primary/50 text-slate-700 transition-all group`}
                    >
                        <Palette size={20} className={showThemes ? 'text-primary' : 'group-hover:text-primary'} />
                    </button>

                    {showThemes && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowThemes(false)}></div>
                            <div className="absolute right-0 mt-3 w-48 bg-surface border border-card-border rounded-3xl shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden p-2">
                                <div className="p-3 border-b border-card-border/50 mb-1">
                                    <h3 className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">
                                        Escolha o Tema
                                    </h3>
                                </div>
                                <div className="space-y-1">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                onThemeChange(t.id)
                                                setShowThemes(false)
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/[0.03] transition-all group ${currentTheme === t.id ? 'bg-white/[0.05]' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`size-3 rounded-full ${t.color} shadow-lg shadow-black/20`}
                                                ></div>
                                                <span
                                                    className={`text-xs font-bold ${currentTheme === t.id
                                                        ? 'text-primary'
                                                        : ['darkBlue', 'black'].includes(currentTheme)
                                                            ? 'text-slate-600 group-hover:text-primary'
                                                            : 'text-slate-600 group-hover:text-slate-900'
                                                        }`}
                                                >
                                                    {t.name}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`size-10 flex items-center justify-center rounded-xl bg-surface border ${showNotifications ? 'border-primary bg-primary/5' : 'border-card-border'
                            } hover:border-primary/50 text-slate-700 transition-all group`}
                    >
                        <Bell
                            size={20}
                            className={showNotifications ? 'text-primary' : 'group-hover:text-primary'}
                        />
                        {naoLidas > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full border-2 border-background px-1">
                                {naoLidas > 99 ? '99+' : naoLidas}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowNotifications(false)}
                            ></div>
                            <div className="absolute right-0 mt-3 w-80 bg-surface border border-card-border rounded-3xl shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                <div className="p-4 border-b border-card-border/50 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-slate-900 font-bold text-sm">Notificações</h3>
                                        {notifications.length > 0 && (
                                            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{notifications.length}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="divide-y divide-card-border/30 max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {loadingNotif ? (
                                        <div className="p-8 text-center"><div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center">
                                            <Bell size={32} className="text-slate-200 mb-3" />
                                            <p className="text-slate-500 text-xs font-medium">Você não tem novas notificações.</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const Icon = TIPO_ICON[n.tipo] || MessageSquare
                                            const route = TIPO_ROTA[n.tipo] || 'mural'
                                            const colorClass = n.tipo === 'encomenda' ? 'text-blue-500 bg-blue-500/10' : n.tipo === 'reserva' ? 'text-green-500 bg-green-500/10' : n.tipo === 'aviso' ? 'text-orange-500 bg-orange-500/10' : 'text-violet-500 bg-violet-500/10'
                                            const [ic, bg] = colorClass.split(' ')
                                            return (
                                                <div key={n.id} className={`p-4 hover:bg-white/[0.02] transition-colors group flex items-start gap-2 ${!n.lida ? 'bg-primary/5' : ''}`}>
                                                    <div className={`size-10 rounded-xl ${bg} flex items-center justify-center shrink-0 border border-white/5`}>
                                                        <Icon size={18} className={ic} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-slate-900 text-xs font-bold leading-none">{n.titulo}</p>
                                                            <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-2">{formatNotifTime(n.created_at)}</span>
                                                        </div>
                                                        {n.corpo && <p className="text-slate-600 text-[11px] leading-tight mb-2 line-clamp-2">{n.corpo}</p>}
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => { setActiveTab?.(route); setShowNotifications(false); marcarLida(n.id); }} className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">Ver Detalhes</button>
                                                            {!n.lida && <button onClick={() => handleDismiss(n.id)} className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900">Marcar lida</button>}
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => handleDismiss(n.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 shrink-0" title="Remover"><Trash2 size={16} /></button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveTab?.('notificacoes')
                                        setShowNotifications(false)
                                    }}
                                    className="w-full p-4 bg-white/[0.03] text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-900 hover:bg-white/[0.05] transition-all border-t border-card-border/50"
                                >
                                    Ver Todas as Notificações
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="size-10 rounded-xl bg-slate-300 border-2 border-card-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all"
                    >
                        <span className="text-slate-700 font-black text-lg">{initial}</span>
                    </button>
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                            <div className="absolute right-0 mt-2 w-48 bg-surface border border-card-border rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => { setActiveTab?.('perfil'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 hover:bg-white/5 text-sm font-bold"
                                >
                                    <span>Meu Perfil</span>
                                </button>
                                <button
                                    onClick={() => { onLogout?.(); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-500/10 text-sm font-bold border-t border-card-border/50"
                                >
                                    <LogOut size={16} /> Sair
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}


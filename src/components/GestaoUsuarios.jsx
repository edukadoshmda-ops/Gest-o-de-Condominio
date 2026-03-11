import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    Users,
    Search,
    ShieldAlert,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    XCircle,
    UserCircle,
    Building2,
    UserCog,
    Trash2
} from 'lucide-react'

export const GestaoUsuarios = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchUsuarios()
    }, [])

    const fetchUsuarios = async () => {
        setLoading(true)
        try {
            const query = supabase
                .from('usuarios')
                .select('*')

            // O síndico só deve ver pessoas do próprio condomínio
            if (userProfile?.tipo === 'sindico') {
                query.eq('condominio_id', userProfile.condominio_id)
            }

            const { data, error } = await query.order('nome', { ascending: true })

            if (error) throw error
            setUsuarios(data || [])
        } catch (error) {
            console.error('Erro ao buscar usuários:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateUser = async (id, field, value) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error

            setUsuarios(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u))
        } catch (error) {
            toast(`Erro ao atualizar ${field}: ` + error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleExcluirUsuario = async (u) => {
        if (u.id === session?.user?.id) {
            toast('Você não pode excluir seu próprio perfil.', 'error')
            return
        }
        if (u.tipo === 'admin_master' && userProfile?.tipo !== 'admin_master') {
            toast('Apenas um administrador pode excluir outro admin.', 'error')
            return
        }
        if (!confirm(`Excluir o usuário "${u.nome || u.email}"? Ele perderá o acesso ao app.`)) return
        setUpdating(true)
        try {
            const { error } = await supabase.from('usuarios').delete().eq('id', u.id)
            if (error) throw error
            setUsuarios(prev => prev.filter(x => x.id !== u.id))
            toast('Usuário excluído.', 'success')
        } catch (err) {
            toast('Erro ao excluir: ' + (err.message || 'Tente novamente.'), 'error')
        } finally {
            setUpdating(false)
        }
    }

    const filteredUsuarios = usuarios.filter(u =>
        u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.unidade?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getTipoBadge = (tipo) => {
        switch (tipo) {
            case 'sindico':
                return <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max"><ShieldCheck size={12} /> Síndico</span>
            case 'porteiro':
                return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max"><UserCog size={12} /> Porteiro</span>
            case 'admin_master':
                return <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max"><ShieldAlert size={12} /> Admin</span>
            default:
                return <span className="bg-slate-500/10 text-slate-600 border border-card-border px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max"><UserCircle size={12} /> Morador</span>
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-slate-900 text-3xl font-black tracking-tight mb-2">Gestão de Perfis</h2>
                    <p className="text-slate-500 text-sm font-medium">Controle os acessos, cargos e permissões dos usuários do seu condomínio.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar morador ou unidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 bg-surface border border-card-border rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 shadow-xl"
                    />
                </div>
            </div>

            {/* Listagem */}
            <div className="bg-surface rounded-3xl border border-card-border overflow-hidden shadow-2xl relative">
                {updating && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                        <thead>
                            <tr className="border-b border-card-border/50 bg-white/[0.02]">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Papel (Cargo)</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acesso do App</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border/30">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></td></tr>
                            ) : filteredUsuarios.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                            ) : filteredUsuarios.map((u) => {
                                // Evitar que o síndico rebaixe o admin master (caso misturado)
                                const isAdminMaster = u.tipo === 'admin_master';
                                // Evitar que o próprio usuário se bloqueie
                                const isSelf = u.id === session?.user?.id;

                                return (
                                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="theme-icon-box size-10 rounded-full bg-slate-200 border border-card-border flex items-center justify-center text-slate-600 font-bold uppercase shrink-0">
                                                    {u.nome ? u.nome[0] : '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm">{u.nome || 'Sem Nome'}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">{u.telefone || 'Sem telefone'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-background px-3 py-1.5 rounded-lg border border-card-border text-xs font-bold text-slate-700">
                                                {u.unidade || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {isAdminMaster ? (
                                                getTipoBadge(u.tipo)
                                            ) : (
                                                <select
                                                    value={u.tipo}
                                                    onChange={(e) => handleUpdateUser(u.id, 'tipo', e.target.value)}
                                                    disabled={isSelf || updating}
                                                    className={`bg-surface border border-card-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer
                                                        ${isSelf ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
                                                    `}
                                                >
                                                    <option value="morador">Morador</option>
                                                    <option value="porteiro">Porteiro</option>
                                                    <option value="sindico">Síndico</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {isAdminMaster ? (
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={14} /> Intocável</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateUser(u.id, 'ativo', !u.ativo)}
                                                        disabled={isSelf || updating}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all
                                                            ${u.ativo ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500'}
                                                            ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                        title={u.ativo ? "Clique para Bloquear" : "Clique para Liberar"}
                                                    >
                                                        {u.ativo ? <><CheckCircle2 size={14} /> Ativo</> : <><XCircle size={14} /> Bloqueado</>}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {(u.id !== session?.user?.id) && (u.tipo !== 'admin_master' || userProfile?.tipo === 'admin_master') && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleExcluirUsuario(u)}
                                                    disabled={updating}
                                                    className="p-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                    title="Excluir usuário"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
} 

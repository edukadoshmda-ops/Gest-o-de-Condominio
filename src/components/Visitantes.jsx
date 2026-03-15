import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    UserPlus,
    History,
    Search,
    ChevronRight,
    Clock,
    ShieldCheck,
    ShieldAlert,
    Smartphone,
    QrCode,
    X,
    Loader2,
    Trash2
} from 'lucide-react'

export const Visitantes = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [visitantes, setVisitantes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedPass, setSelectedPass] = useState(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        nome: '',
        relacao: 'Familiar',
        placa_veiculo: ''
    })

    useEffect(() => {
        if (session?.user) {
            fetchVisitantes()
        } else {
            setLoading(false)
        }
    }, [userProfile, session])

    const fetchVisitantes = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })

            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }

            // Moradores só veem suas próprias solicitações de visitantes
            if (userProfile?.tipo === 'morador') {
                query = query.eq('morador_id', session?.user?.id)
            }

            const { data, error } = await query

            if (error) throw error
            setVisitantes(data || [])
        } catch (error) {
            console.error('Erro ao buscar visitantes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.nome) return

        if (!userProfile?.condominio_id) {
            toast('Seu perfil não está vinculado a um condomínio. Entre em contato com o administrador.', 'error')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('visitantes')
                .insert([
                    {
                        nome: formData.nome,
                        relacao: formData.relacao,
                        placa_veiculo: formData.placa_veiculo || 'N/A',
                        status: 'Entrada Autorizada',
                        morador_id: session?.user?.id,
                        condominio_id: userProfile.condominio_id
                    }
                ])

            if (error) throw error

            setShowModal(false)
            setFormData({ nome: '', relacao: 'Familiar', placa_veiculo: '' })
            fetchVisitantes()
        } catch (error) {
            console.error('Erro ao salvar visitante:', error)
            toast(`Falha ao adicionar visitante: ${error.message || 'Verifique sua conexão.'}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Deseja realmente revogar o acesso deste visitante?')) return

        try {
            const { error } = await supabase
                .from('visitantes')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchVisitantes()
        } catch (error) {
            console.error('Erro ao excluir visitante:', error)
            toast('Falha ao excluir o registro.', 'error')
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const today = new Date()

        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()

        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

        if (isToday) return `Hoje, ${time}`
        return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${time}`
    }

    // Passes ativos: vamos pegar os primeiros que não estão expirados, ou simular visualmente com base na relação
    const passesAtivos = visitantes.filter(v => v.status !== 'Acesso Expirado').slice(0, 4)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

            {/* Modal de Novo Visitante */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface border border-card-border rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute right-4 top-4 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-black text-slate-900 mb-1">Novo Visitante</h3>
                        <p className="text-sm text-slate-600 mb-6">Preencha os dados para liberar a entrada.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Relação</label>
                                    <select
                                        value={formData.relacao}
                                        onChange={(e) => setFormData({ ...formData, relacao: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    >
                                        <option value="Familiar">Familiar</option>
                                        <option value="Amigo">Amigo</option>
                                        <option value="Serviço">Serviço/Entrega</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Placa (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.placa_veiculo}
                                        onChange={(e) => setFormData({ ...formData, placa_veiculo: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all uppercase"
                                        placeholder="ABC-1234"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Liberar Acesso'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-slate-900 text-2xl font-black tracking-tight mb-2">Controle de Acesso</h2>
                    <p className="text-slate-500 text-sm font-medium">Libere visitas e consulte o histórico de entradas.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                >
                    <UserPlus size={20} /> Liberar Novo Visitante
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Active QR Codes / Passes */}
                    <div className="flex items-center gap-2 px-1">
                        <Smartphone className="text-primary" size={20} />
                        <h3 className="text-slate-900 font-bold text-lg">Passes Ativos gerados recentemente</h3>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                            <Loader2 className="animate-spin text-primary mb-4" size={32} />
                            <p className="text-sm font-medium">Carregando...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {passesAtivos.length === 0 ? (
                                <div className="col-span-2 text-center py-6 border border-dashed border-card-border rounded-3xl text-slate-500">
                                    Nenhum passe ativo no momento.
                                </div>
                            ) : passesAtivos.map((pass, i) => (
                                <div key={pass.id || i} className="bg-surface rounded-3xl border border-card-border p-6 hover:border-primary/30 transition-all group cursor-pointer overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-3">
                                        <QrCode size={40} className="text-slate-900/5 group-hover:text-primary/10 transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="theme-icon-box size-12 rounded-2xl bg-slate-100 border border-card-border flex items-center justify-center">
                                            {pass.relacao === 'Serviço' ? (
                                                <Clock className="text-primary" size={24} />
                                            ) : (
                                                <ShieldCheck className="text-green-500" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold truncate max-w-[150px]">{pass.nome}</p>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{pass.relacao}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-card-border/50">
                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                            Entrada: {formatDate(pass.created_at)}
                                        </span>
                                        <button
                                            onClick={() => setSelectedPass(pass)}
                                            className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Histórico Recente */}
                    <section className="bg-surface rounded-3xl border border-card-border overflow-hidden mt-6">
                        <div className="p-6 border-b border-card-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="text-primary" size={18} />
                                <h3 className="text-slate-900 font-bold">Histórico Recente</h3>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input type="text" placeholder="Buscar nome..." className="bg-background border border-card-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-primary outline-none w-32 md:w-48 transition-all" />
                            </div>
                        </div>
                        <div className="divide-y divide-card-border/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading && visitantes.length === 0 ? (
                                <div className="p-6 text-center text-slate-300">Carregando...</div>
                            ) : visitantes.length === 0 ? (
                                <div className="p-6 text-center text-slate-300">Nenhum registro encontrado.</div>
                            ) : visitantes.map((visit, i) => (
                                <div key={visit.id || i} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="theme-icon-box size-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:text-primary transition-colors uppercase">
                                            {visit.nome ? visit.nome[0] : '?'}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 text-sm font-bold">{visit.nome}</p>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                {formatDate(visit.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${visit.status === 'Acesso Expirado'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-green-500/10 text-green-500 border-green-500/20'
                                                }`}>
                                                {visit.status || 'Ativo'}
                                            </span>
                                            {visit.placa_veiculo && visit.placa_veiculo !== 'N/A' && (
                                                <span className="text-[10px] text-slate-600 font-mono italic">{visit.placa_veiculo}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(visit.id)}
                                            className="text-slate-600 hover:text-red-500 transition-colors p-2"
                                            title="Revogar Acesso"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Security / Tips */}
                <div className="space-y-6">
                    <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 space-y-4">
                        <ShieldAlert className="text-primary" size={32} />
                        <h4 className="text-slate-900 font-bold text-lg leading-tight">Dicas de Segurança</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">Nunca compartilhe seu QR Code de acesso com pessoas desconhecidas fora da lista de convidados.</p>
                        <ul className="space-y-3 pt-4">
                            {[
                                'Verifique a placa do veículo',
                                'Acompanhe o status em tempo real',
                                'Notifique a portaria em atrasos',
                            ].map((tip, i) => (
                                <li key={i} className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                                    <span className="size-1 bg-primary rounded-full"></span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            {/* Modal Detalhes do Visitante */}
            {selectedPass && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedPass(null)}>
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-slate-900 font-bold text-xl">{selectedPass.nome}</h3>
                                <p className="text-slate-500 text-xs uppercase font-bold mt-1">{selectedPass.relacao}</p>
                            </div>
                            <button onClick={() => setSelectedPass(null)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-background rounded-2xl p-4 border border-card-border">
                                <p className="text-slate-500 text-[10px] font-black uppercase">Entrada autorizada em</p>
                                <p className="text-slate-900 font-bold">{formatDate(selectedPass.created_at)}</p>
                            </div>
                            {selectedPass.placa_veiculo && selectedPass.placa_veiculo !== 'N/A' && (
                                <div className="bg-background rounded-2xl p-4 border border-card-border">
                                    <p className="text-slate-500 text-[10px] font-black uppercase">Placa do veículo</p>
                                    <p className="text-slate-900 font-mono font-bold">{selectedPass.placa_veiculo}</p>
                                </div>
                            )}
                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase ${selectedPass.status === 'Acesso Expirado' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{selectedPass.status || 'Ativo'}</span>
                        </div>
                        <button onClick={() => setSelectedPass(null)} className="w-full mt-6 py-3 rounded-2xl bg-primary text-white font-black text-sm uppercase">Fechar</button>
                    </div>
                </div>
            )}

        </div>
    )
}

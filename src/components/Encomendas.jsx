import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { traduzirErro } from '../lib/erros'
import { useToast } from '../lib/toast'
import {
    Package,
    Search,
    Clock,
    CheckCircle2,
    Plus,
    X,
    Loader2,
    MapPin,
    Building2,
    ArrowRight
} from 'lucide-react'

export const Encomendas = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [encomendas, setEncomendas] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('Pendente')

    const [formData, setFormData] = useState({
        unidade: '',
        bloco: '',
        remetente: '',
        descricao: ''
    })

    const isStaff = userProfile?.tipo === 'sindico' || userProfile?.tipo === 'porteiro' || userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin'

    useEffect(() => {
        if (session?.user) {
            fetchEncomendas()
        } else {
            setLoading(false)
        }
    }, [userProfile, session])

    const fetchEncomendas = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('encomendas')
                .select('*')
                .order('created_at', { ascending: false })

            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }

            // Moradores só veem suas próprias encomendas (baseado na unidade)
            // Como não temos a unidade obrigatória no perfil ainda, vamos assumir que o staff vê tudo
            if (!isStaff && userProfile?.unidade) {
                query = query.eq('unidade', userProfile.unidade)
                if (userProfile?.bloco) {
                    query = query.eq('bloco', userProfile.bloco)
                }
            }

            const { data, error } = await query

            if (error) throw error
            setEncomendas(data || [])
        } catch (error) {
            console.error('Erro ao buscar encomendas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { error } = await supabase
                .from('encomendas')
                .insert({
                    condominio_id: userProfile.condominio_id,
                    unidade: formData.unidade,
                    bloco: formData.bloco,
                    remetente: formData.remetente,
                    descricao: formData.descricao,
                    status: 'Pendente',
                    recebedor_id: userProfile.id
                })

            if (error) throw error

            setShowModal(false)
            setFormData({ unidade: '', bloco: '', remetente: '', descricao: '' })
            fetchEncomendas()
        } catch (error) {
            toast('Erro ao registrar encomenda: ' + traduzirErro(error.message), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleMarcarEntregue = async (id) => {
        if (!confirm('Confirmar entrega desta encomenda ao morador?')) return;

        try {
            const { error } = await supabase
                .from('encomendas')
                .update({
                    status: 'Entregue',
                    data_entrega: new Date().toISOString(),
                    entregador_id: userProfile.id
                })
                .eq('id', id)

            if (error) throw error
            fetchEncomendas()
        } catch (error) {
            toast('Erro ao atualizar status: ' + traduzirErro(error.message), 'error')
        }
    }

    const filteredEncomendas = encomendas.filter(e => e.status === activeTab && (
        e.unidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.remetente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    ))

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-slate-900 text-3xl font-black tracking-tight mb-2">Portaria / Encomendas</h2>
                    <p className="text-slate-500 text-sm font-medium">Controle de recebimento e entrega de pacotes.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar unidade, nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-surface/50 border border-card-border p-3 pl-12 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                    {isStaff && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                            Registrar Pacote
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-card-border">
                <button
                    onClick={() => setActiveTab('Pendente')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'Pendente' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Aguardando Retirada
                </button>
                <button
                    onClick={() => setActiveTab('Entregue')}
                    className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${activeTab === 'Entregue' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Histórico de Entregas
                </button>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-sm font-medium">Carregando encomendas...</p>
                </div>
            ) : filteredEncomendas.length === 0 ? (
                <div className="bg-surface/30 border border-card-border border-dashed p-12 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-card-border/30 rounded-full flex items-center justify-center mb-4">
                        <Package className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-slate-900 text-lg font-bold mb-2">Nenhuma encomenda por aqui.</h3>
                    <p className="text-slate-500 text-sm max-w-sm">Use o campo de busca ou registre uma nova chegada na portaria.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEncomendas.map((item) => (
                        <div key={item.id} className="bg-surface border border-card-border p-5 rounded-2xl hover:border-primary/30 transition-colors group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex bg-slate-200/50 rounded-lg p-2 items-center gap-3 w-fit border border-slate-300/50">
                                    <Building2 size={16} className="text-primary" />
                                    <div>
                                        <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Destino</div>
                                        <div className="text-slate-900 font-black">Apt {item.unidade} {item.bloco ? ` - Bloco ${item.bloco}` : ''}</div>
                                    </div>
                                </div>
                                {item.status === 'Pendente' ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                                        <Clock size={12} /> Na Portaria
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                                        <CheckCircle2 size={12} /> Entregue
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div>
                                    <div className="text-sm font-bold text-slate-900 mb-1">{item.descricao || 'Pacote Standard'}</div>
                                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                                        <MapPin size={12} />
                                        Remetente: {item.remetente || 'Não informado'}
                                    </div>
                                </div>

                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-background p-2 rounded border border-card-border">
                                    <Clock size={12} />
                                    Chegou: {new Date(item.created_at).toLocaleString('pt-BR')}
                                </div>

                                {item.status === 'Entregue' && (
                                    <div className="text-xs text-emerald-500/80 font-medium flex items-center gap-1.5 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                        <CheckCircle2 size={12} />
                                        Entregue: {new Date(item.data_entrega).toLocaleString('pt-BR')}
                                    </div>
                                )}
                            </div>

                            {item.status === 'Pendente' && isStaff && (
                                <button
                                    onClick={() => handleMarcarEntregue(item.id)}
                                    className="w-full bg-slate-200 hover:bg-emerald-600 hover:text-slate-900 border border-slate-300 hover:border-emerald-500 text-slate-700 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                                >
                                    Confirmar Entrega
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-card-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center p-6 border-b border-card-border bg-slate-200/20">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Novo Pacote</h3>
                                <p className="text-xs text-slate-600 font-medium mt-1">Registre a chegada na portaria.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-slate-900 transition-colors bg-slate-200 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Unidade / Apt</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.unidade}
                                        onChange={e => setFormData({ ...formData, unidade: e.target.value })}
                                        className="w-full bg-background border border-card-border p-3 rounded-xl text-slate-900 focus:border-primary transition-colors"
                                        placeholder="Ex: 502"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Bloco (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.bloco}
                                        onChange={e => setFormData({ ...formData, bloco: e.target.value })}
                                        className="w-full bg-background border border-card-border p-3 rounded-xl text-slate-900 focus:border-primary transition-colors"
                                        placeholder="Ex: B"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Remetente (Loja/Pessoa)</label>
                                <input
                                    type="text"
                                    value={formData.remetente}
                                    onChange={e => setFormData({ ...formData, remetente: e.target.value })}
                                    className="w-full bg-background border border-card-border p-3 rounded-xl text-slate-900 focus:border-primary transition-colors"
                                    placeholder="Ex: MercadoLivre, Sedex..."
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Descrição Curta</label>
                                <input
                                    type="text"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full bg-background border border-card-border p-3 rounded-xl text-slate-900 focus:border-primary transition-colors"
                                    placeholder="Ex: Caixa grande, Envelope..."
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold p-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    Registrar Chegada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

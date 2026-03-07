import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    Users,
    Building2,
    ShieldAlert,
    CheckCircle2,
    Search,
    Calendar,
    Clock,
    Filter,
    ArrowRight,
    Loader2,
    X,
    AlertTriangle,
    Mail,
    Phone,
    UserCircle,
    Copy,
    RefreshCw,
    FileText,
    ShieldCheck,
    Edit3,
    Check,
    Trash2,
    Plus,
    Key,
    LogIn,
} from 'lucide-react'

export const AdminMaster = ({ session, userProfile, setUserProfile, setActiveTab }) => {
    const { toast } = useToast()
    const [condominios, setCondominios] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCondo, setSelectedCondo] = useState(null)
    const [editData, setEditData] = useState({ nome: '', codigo_acesso: '' })
    const [isEditingData, setIsEditingData] = useState(false)
    const [stats, setStats] = useState({ total: 0, ativos: 0, suspensos: 0, faturamento: 0 })
    const [updating, setUpdating] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newCondoData, setNewCondoData] = useState({ nome: '', codigo_acesso: '' })
    const [confirmDelete, setConfirmDelete] = useState(null)

    const hoje = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [condoRes, faturasRes] = await Promise.all([
                supabase.from('condominios').select('*').order('nome', { ascending: true }),
                supabase.from('faturas').select('*, condominios(nome)').order('vencimento', { ascending: false })
            ])

            if (condoRes.error) throw condoRes.error
            if (faturasRes.error) throw faturasRes.error

            setCondominios(condoRes.data || [])

            // Calc stats
            const ativos = condoRes.data.filter(c => c.status === 'ativo' && (!c.data_vencimento || c.data_vencimento >= hoje)).length
            const suspensos = condoRes.data.length - ativos
            const fat = (faturasRes.data || [])
                .filter(f => f.status === 'Pago')
                .reduce((acc, curr) => acc + Number(curr.valor), 0)

            setStats({ total: condoRes.data.length, ativos, suspensos, faturamento: fat })
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id, newStatus) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('condominios')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            setCondominios(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
            if (selectedCondo && selectedCondo.id === id) {
                setSelectedCondo({ ...selectedCondo, status: newStatus })
            }
        } catch (error) {
            toast('Erro ao atualizar status: ' + error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleSaveBasicData = async () => {
        if (!selectedCondo) return
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('condominios')
                .update({
                    nome: editData.nome,
                    codigo_acesso: editData.codigo_acesso.toUpperCase()
                })
                .eq('id', selectedCondo.id)

            if (error) throw error

            setCondominios(prev => prev.map(c => c.id === selectedCondo.id ? { ...c, ...editData, codigo_acesso: editData.codigo_acesso.toUpperCase() } : c))
            setSelectedCondo({ ...selectedCondo, ...editData, codigo_acesso: editData.codigo_acesso.toUpperCase() })
            setIsEditingData(false)
            toast('Dados atualizados com sucesso!', 'success')
        } catch (error) {
            toast('Erro ao atualizar dados: ' + error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleUpdateDate = async (id, newDate) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('condominios')
                .update({ data_vencimento: newDate })
                .eq('id', id)

            if (error) throw error

            setCondominios(prev => prev.map(c => c.id === id ? { ...c, data_vencimento: newDate } : c))
            if (selectedCondo && selectedCondo.id === id) {
                setSelectedCondo({ ...selectedCondo, data_vencimento: newDate })
            }
            toast('Validade atualizada!', 'success')
        } catch (error) {
            toast('Erro ao atualizar validade: ' + error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const handleEnterCondo = (condo) => {
        if (!setUserProfile || !setActiveTab) {
            toast("Acesso direto não configurado. Volte ao app principal.", "info");
            return;
        }

        setUserProfile(prev => ({
            ...prev,
            condominio_id: condo.id,
            condominios: condo
        }));
        setActiveTab('inicio');
    }

    const handleDeleteCondo = async (id, nome) => {
        setUpdating(true)
        setConfirmDelete(null)
        try {
            const { error } = await supabase.rpc('delete_condominio', { p_condo_id: id })

            if (error) throw error

            // Verifica se realmente excluiu (evita reaparecer ao atualizar)
            const { data: verifica } = await supabase.from('condominios').select('id').eq('id', id).maybeSingle()
            if (verifica) {
                throw new Error('A exclusão não foi confirmada. Pode haver dependências no banco. Tente no Supabase SQL Editor: DELETE FROM condominios WHERE id = \'' + id + '\'')
            }

            setCondominios(prev => prev.filter(c => c.id !== id))
            if (selectedCondo?.id === id) setSelectedCondo(null)
            setConfirmDelete(null)
            toast('Condomínio excluído com sucesso!', 'success')
            await fetchData()
        } catch (error) {
            const msg = error?.message || 'Tente novamente.'
            const hint = msg.includes('does not exist') || msg.includes('não exist')
                ? ' Execute no Supabase (SQL Editor) o arquivo supabase/RODAR-FUNCAO-EXCLUIR-CONDOMINIO.sql'
                : ''
            toast('Erro ao excluir: ' + msg + hint, 'error')
            setConfirmDelete({ id, nome })
        } finally {
            setUpdating(false)
        }
    }

    const handleCreateCondo = async (e) => {
        e.preventDefault()
        if (!newCondoData.nome || !newCondoData.codigo_acesso) return

        setUpdating(true)
        try {
            const { data, error } = await supabase
                .from('condominios')
                .insert([
                    {
                        nome: newCondoData.nome,
                        codigo_acesso: newCondoData.codigo_acesso.toUpperCase(),
                        status: 'ativo'
                    }
                ])
                .select()
                .single()

            if (error) throw error

            setCondominios(prev => [data, ...prev])
            setShowCreateModal(false)
            setNewCondoData({ nome: '', codigo_acesso: '' })
            toast('Condomínio criado com sucesso!', 'success')
            fetchData() // Refresh stats
        } catch (error) {
            toast('Erro ao criar condomínio: ' + error.message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    const filteredCondos = condominios.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo_acesso.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Sem data'
        const [year, month, day] = dateStr.split('-')
        return `${day}/${month}/${year}`
    }

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Nav Master */}
            <header className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center">
                                <img src="/logo.png" alt="Gestor360 Logo" className="h-[42px] object-contain" />
                            </div>
                            <h2 className="text-slate-900 text-3xl font-black tracking-tight">Painel Root</h2>
                        </div>
                        <p className="text-slate-500 text-sm font-medium ml-1">Central de Controle e Faturamento Global</p>
                    </div>

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-surface p-6 rounded-3xl border border-card-border group hover:border-primary/30 transition-all">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Clientes</p>
                        <p className="text-slate-900 text-2xl font-black">{stats.total}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-3xl border border-card-border group hover:border-green-500/30 transition-all">
                        <p className="text-green-500/50 text-[10px] font-black uppercase tracking-widest mb-1">Status Ativo</p>
                        <p className="text-green-500 text-2xl font-black">{stats.ativos}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-3xl border border-card-border group hover:border-red-500/30 transition-all">
                        <p className="text-red-500/50 text-[10px] font-black uppercase tracking-widest mb-1">Status Bloqueado</p>
                        <p className="text-red-500 text-2xl font-black">{stats.suspensos}</p>
                    </div>
                    <div className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary/10 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 size-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <p className="text-slate-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Receita Confirmada</p>
                        <p className="text-slate-900 text-2xl font-black">{formatCurrency(stats.faturamento)}</p>
                    </div>
                </div>
            </header>

            {(
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Listagem */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-surface border border-card-border rounded-2xl pl-12 pr-4 py-4 text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 shadow-xl"
                                />
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-primary text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={18} /> Novo Condomínio
                            </button>
                        </div>

                        <div className="bg-surface rounded-3xl border border-card-border overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-sans">
                                    <thead>
                                        <tr className="border-b border-card-border/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Condomínio</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-card-border/30">
                                        {loading ? (
                                            <tr><td colSpan="4" className="px-6 py-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></td></tr>
                                        ) : filteredCondos.map((condo) => {
                                            const isExpired = condo.data_vencimento && condo.data_vencimento < hoje;
                                            const isSuspended = condo.status === 'suspenso';

                                            return (
                                                <tr
                                                    key={condo.id}
                                                    onClick={() => {
                                                        setSelectedCondo(condo);
                                                        setEditData({ nome: condo.nome, codigo_acesso: condo.codigo_acesso });
                                                        setIsEditingData(false);
                                                    }}
                                                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors group ${selectedCondo?.id === condo.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-slate-200 flex items-center justify-center border border-card-border">
                                                                <Building2 size={18} className="text-slate-600" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 text-sm">{condo.nome}</span>
                                                                <span className="text-[9px] text-slate-600 font-mono">ID: {condo.id.slice(0, 8)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-mono ${isExpired ? 'text-red-400' : 'text-slate-600'}`}>{formatDate(condo.data_vencimento)}</span>
                                                            {isExpired && <span className="text-[8px] text-red-500 font-black uppercase">Vencido</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 font-black uppercase text-[10px]">
                                                        {isSuspended ? (
                                                            <span className="text-red-500 flex items-center gap-1.5"><ShieldAlert size={12} /> Manual</span>
                                                        ) : isExpired ? (
                                                            <span className="text-amber-500 flex items-center gap-1.5"><Clock size={12} /> Automático</span>
                                                        ) : (
                                                            <span className="text-green-500 flex items-center gap-1.5"><CheckCircle2 size={12} /> Liberado</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleEnterCondo(condo)
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-green-500 transition-colors hover:bg-green-500/10 rounded-lg"
                                                                title="Acessar Condomínio"
                                                            >
                                                                <LogIn size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedCondo(condo)
                                                                    setEditData({ nome: condo.nome, codigo_acesso: condo.codigo_acesso })
                                                                    setIsEditingData(true)
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                                                                title="Editar"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setConfirmDelete({ id: condo.id, nome: condo.nome })
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes e Ações */}
                    <div className="space-y-6">
                        {selectedCondo ? (
                            <div className="bg-surface rounded-[40px] border border-card-border p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Editor de Condomínio</p>
                                        <h3 className="text-slate-900 text-xl font-black">{selectedCondo.nome}</h3>
                                    </div>
                                    <button onClick={() => setSelectedCondo(null)} className="text-slate-600 hover:text-slate-900 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Cadastro Básico */}
                                    <div className="bg-background/50 border border-card-border rounded-3xl p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Informações Cadastrais</p>
                                            <button
                                                onClick={() => setIsEditingData(!isEditingData)}
                                                className="text-primary p-2 hover:bg-primary/10 rounded-xl transition-all"
                                            >
                                                {isEditingData ? <X size={16} /> : <Edit3 size={16} />}
                                            </button>
                                        </div>

                                        {isEditingData ? (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Nome do Condomínio</label>
                                                    <input
                                                        type="text"
                                                        value={editData.nome}
                                                        onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSaveBasicData}
                                                    disabled={updating}
                                                    className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    {updating ? <Loader2 className="animate-spin" size={14} /> : <><Check size={14} /> Aplicar Alterações</>}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-600">Status Atual</span>
                                                    <span className={`text-[10px] font-black uppercase ${selectedCondo.status === 'ativo' ? 'text-green-500' : 'text-red-500'}`}>{selectedCondo.status}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Licença e Validade */}
                                    <div className="bg-background/50 border border-card-border rounded-3xl p-6 space-y-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Controle de Validade (Bloqueio Aut.)</p>
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-slate-100 rounded-xl border border-card-border">
                                                <Calendar size={18} className="text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    value={selectedCondo.data_vencimento || ''}
                                                    onChange={(e) => handleUpdateDate(selectedCondo.id, e.target.value)}
                                                    className="bg-transparent text-slate-900 font-black text-lg outline-none w-full"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Acesso Rápido */}
                                    <div className="space-y-3 pt-6 border-t border-card-border/50">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gerenciamento</p>
                                        <button
                                            onClick={() => handleEnterCondo(selectedCondo)}
                                            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-xs font-black uppercase tracking-widest"
                                        >
                                            <LogIn size={18} />
                                            Acessar Painel do Condomínio
                                        </button>
                                    </div>

                                    {/* Ações de Bloqueio Manual */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bloqueio Manual</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                disabled={updating || selectedCondo.status === 'ativo'}
                                                onClick={() => handleUpdateStatus(selectedCondo.id, 'ativo')}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${selectedCondo.status === 'ativo' ? 'bg-green-500/10 border-green-500/50 text-green-500 shadow-lg shadow-green-500/10' : 'bg-background border-card-border text-slate-500 hover:border-green-500/30'}`}
                                            >
                                                <CheckCircle2 size={24} />
                                                <span className="text-[10px] font-black uppercase">Liberar</span>
                                            </button>

                                            <button
                                                disabled={updating || selectedCondo.status === 'suspenso'}
                                                onClick={() => handleUpdateStatus(selectedCondo.id, 'suspenso')}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${selectedCondo.status === 'suspenso' ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-lg shadow-red-500/10' : 'bg-background border-card-border text-slate-500 hover:border-red-500/30'}`}
                                            >
                                                <ShieldAlert size={24} />
                                                <span className="text-[10px] font-black uppercase">Suspender</span>
                                            </button>
                                        </div>

                                        {/* Perigo: Exclusão */}
                                        <div className="pt-6 border-t border-card-border/50">
                                            <button
                                                disabled={updating}
                                                onClick={() => setConfirmDelete({ id: selectedCondo.id, nome: selectedCondo.nome })}
                                                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/50 transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Trash2 size={16} />
                                                Excluir Condomínio Permanentemente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface/50 rounded-[40px] border border-card-border border-dashed p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl h-[400px]">
                                <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 border border-card-border">
                                    <Building2 size={40} />
                                </div>
                                <div className="max-w-[200px]">
                                    <h4 className="text-slate-900 font-bold opacity-50">Gestão Master</h4>
                                    <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-2 leading-relaxed">Selecione um cliente para editar dados, renovar licenças ou bloquear acesso.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Novo Condomínio */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface border border-card-border rounded-[40px] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="absolute right-6 top-6 text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-full border border-card-border hover:border-slate-300"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-8">
                                <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                    <Building2 size={32} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">Novo Condomínio</h3>
                                <p className="text-sm text-slate-500 font-medium">Cadastre uma nova unidade no sistema.</p>
                            </div>

                            <form onSubmit={handleCreateCondo} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Condomínio</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={newCondoData.nome}
                                            onChange={(e) => setNewCondoData({ ...newCondoData, nome: e.target.value })}
                                            className="w-full bg-background border border-card-border rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Ex: Edifício Solar da Alvorada"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Código de Acesso Único</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={newCondoData.codigo_acesso}
                                            onChange={(e) => setNewCondoData({ ...newCondoData, codigo_acesso: e.target.value.toUpperCase() })}
                                            className="w-full bg-background border border-card-border rounded-2xl pl-12 pr-4 py-4 text-sm font-mono text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                            placeholder="EX: SOLAR2024"
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-medium ml-1">Este código será usado pelos moradores para se cadastrarem.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                                >
                                    {updating ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Confirmar Cadastro
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Modal de Confirmação de Exclusão */}
            {
                confirmDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface border border-red-500/20 rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
                            <div className="size-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Excluir Condomínio?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">
                                Você está prestes a apagar <strong>{confirmDelete.nome}</strong> permanentemente. Todos os dados (moradores, finanças, ocorrencias) serão apagados. Deseja continuar?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    disabled={updating}
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 bg-background border border-card-border text-slate-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={updating}
                                    onClick={() => handleDeleteCondo(confirmDelete.id, confirmDelete.nome)}
                                    className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center"
                                >
                                    {updating ? <Loader2 className="animate-spin" size={18} /> : 'Sim, Excluir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

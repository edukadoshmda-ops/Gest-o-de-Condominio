import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    Wrench,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Image as ImageIcon,
    Loader2,
    X,
    Camera,
    Trash2
} from 'lucide-react'

const statusBadgeStyles = {
    'Aberto': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'ABERTO': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Em Andamento': 'bg-primary/10 text-primary border-primary/20',
    'Concluído': 'bg-green-500/10 text-green-500 border-green-500/20',
}
const priorityBadgeStyles = {
    'Baixa': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Média': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Alta': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Alta (Urgente)': 'bg-red-500/10 text-red-500 border-red-500/20',
}
const priorityLabelStyles = {
    'Baixa': 'text-slate-400',
    'Média': 'text-amber-500',
    'Alta': 'text-red-500',
    'Alta (Urgente)': 'text-red-500',
}

const ChamadoCard = ({ title, date, status, priority, category, foto_url, descricao, onViewDetails, onDelete }) => {
    const safeStatus = status || 'Aberto'
    const safePriority = priority || 'Baixa'

    return (
        <div className="bg-surface rounded-3xl border border-card-border p-6 hover:border-primary/30 transition-all group cursor-pointer h-full flex flex-col justify-between overflow-hidden relative">
            {foto_url && (
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none overflow-hidden blur-[2px] rounded-bl-full group-hover:opacity-30 group-hover:blur-sm transition-all duration-500">
                    <img src={foto_url} alt="Fundo" className="w-full h-full object-cover" />
                </div>
            )}
            <div className="z-10 relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="theme-icon-box size-10 rounded-xl bg-slate-100 border border-card-border flex items-center justify-center shrink-0">
                            <Wrench className="text-primary group-hover:rotate-12 transition-transform" size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{category}</span>
                            <h4 className="text-slate-900 font-bold text-sm leading-tight line-clamp-2">{title}</h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Excluir chamado"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border whitespace-nowrap ${statusBadgeStyles[safeStatus] || statusBadgeStyles['Aberto']}`}>
                            {safeStatus}
                        </span>
                    </div>
                </div>
            </div>

            {foto_url && (
                <div className="mt-2 mb-4 rounded-xl overflow-hidden border border-card-border h-32 relative group/img z-10 transition-all">
                    <img src={foto_url} alt="Foto do chamado" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-slate-900 font-bold flex items-center gap-1">
                        <Camera size={12} /> Foto Anexa
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-card-border/50 z-10 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 font-bold">{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className={priorityLabelStyles[safePriority] || priorityLabelStyles['Baixa']} />
                        <span className={`text-[10px] font-bold ${priorityLabelStyles[safePriority] || priorityLabelStyles['Baixa']}`}>{safePriority.replace(' (Urgente)', '')}</span>
                    </div>
                </div>
                <button
                    onClick={() => onViewDetails?.()}
                    className="text-primary p-1 hover:bg-primary/10 rounded-lg transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    )
}

export const Chamados = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [showNewForm, setShowNewForm] = useState(false)
    const [selectedChamado, setSelectedChamado] = useState(null)
    const [chamados, setChamados] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [filtroStatus, setFiltroStatus] = useState('Todos')
    const [searchTerm, setSearchTerm] = useState('')

    // Estados para upload de foto
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const fileInputRef = React.useRef(null)

    const [formData, setFormData] = useState({
        categoria: 'Hidráulica',
        prioridade: 'Baixa',
        titulo: '',
        descricao: ''
    })

    useEffect(() => {
        if (session?.user) {
            fetchChamados()
        } else {
            setLoading(false)
        }
    }, [userProfile?.condominio_id, session?.user?.id])

    const fetchChamados = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('chamados')
                .select('*')
                .order('created_at', { ascending: false })

            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }

            // Filtro por morador (privacidade)
            if (userProfile?.tipo === 'morador') {
                query = query.eq('morador_id', session?.user?.id)
            }

            const { data, error } = await query

            if (error) throw error
            setChamados(data || [])
        } catch (error) {
            console.error('Erro ao buscar chamados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadImage = async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${session?.user?.id || 'public'}/${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('fotos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('fotos')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (error) {
            console.error('Erro no upload da foto:', error)
            return null
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.titulo.trim() || !formData.descricao.trim()) return

        setSaving(true)
        try {
            let uploadedFotoUrl = null;
            if (imageFile) {
                uploadedFotoUrl = await uploadImage(imageFile);
            }

            const { error } = await supabase
                .from('chamados')
                .insert([
                    {
                        titulo: formData.titulo,
                        descricao: formData.descricao,
                        categoria: formData.categoria,
                        prioridade: formData.prioridade,
                        foto_url: uploadedFotoUrl,
                        status: 'Aberto',
                        morador_id: session?.user?.id,
                        condominio_id: userProfile?.condominio_id || (chamados.length > 0 ? chamados[0].condominio_id : null)
                    }
                ])

            if (error) {
                console.error("Erro do Supabase:", error);
                throw error;
            }

            setShowNewForm(false)
            setFormData({ categoria: 'Hidráulica', prioridade: 'Baixa', titulo: '', descricao: '' })
            setImageFile(null)
            setImagePreview(null)
            fetchChamados()
        } catch (error) {
            console.error('Erro ao salvar chamado:', error)
            toast(`Falha ao criar chamado: ${error.message || 'Verifique sua conexão.'}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const now = new Date()
        const isToday = d.toDateString() === now.toDateString()
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        if (isToday) return `Hoje, ${time}`
        return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${time}`
    }

    const handleDeleteChamado = async (chamado) => {
        if (!confirm('Deseja realmente excluir este chamado?')) return
        try {
            const { error } = await supabase.from('chamados').delete().eq('id', chamado.id)
            if (error) throw error
            toast('Chamado excluído.', 'success')
            setChamados(prev => prev.filter(c => c.id !== chamado.id))
            if (selectedChamado?.id === chamado.id) setSelectedChamado(null)
        } catch (err) {
            toast(`Falha ao excluir: ${err.message || 'Tente novamente.'}`, 'error')
        }
    }

    // Filtragem local
    const filteredChamados = chamados.filter(c => {
        const matchesSearch = c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filtroStatus === 'Todos') return matchesSearch;
        if (filtroStatus === 'Abertos') return matchesSearch && c.status === 'Aberto';
        if (filtroStatus === 'Em Progresso') return matchesSearch && c.status === 'Em Andamento';
        if (filtroStatus === 'Concluídos') return matchesSearch && c.status === 'Concluído';
        return matchesSearch;
    });

    const percentualResolvidos = chamados.length > 0
        ? Math.round((chamados.filter(c => c.status === 'Concluído').length / chamados.length) * 100)
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-slate-900 text-2xl font-black tracking-tight mb-2">Manutenção e Chamados</h2>
                    <p className="text-slate-500 text-sm font-medium">Gerencie suas solicitações de reparo e serviços.</p>
                </div>
                <button
                    onClick={() => setShowNewForm(true)}
                    className="flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full md:w-auto"
                >
                    <Plus size={20} /> Novo Chamado
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters/Stats Sidebar */}
                <div className="space-y-6">
                    <div className="bg-surface rounded-3xl border border-card-border p-6 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar chamado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background border border-card-border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status</label>
                            <div className="space-y-2">
                                {['Todos', 'Abertos', 'Em Progresso', 'Concluídos'].map((f) => {
                                    const count = f === 'Todos' ? chamados.length :
                                        f === 'Abertos' ? chamados.filter(c => c.status === 'Aberto').length :
                                            f === 'Em Progresso' ? chamados.filter(c => c.status === 'Em Andamento').length :
                                                chamados.filter(c => c.status === 'Concluído').length;

                                    const isActive = filtroStatus === f;

                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setFiltroStatus(f)}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group
                                                ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-white/5 text-slate-300 hover:text-slate-100 border border-transparent'}`}
                                        >
                                            {f}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg transition-colors
                                                ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-300 group-hover:bg-white/15'}`}>
                                                {count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex items-center gap-4">
                        <div>
                            <p className="text-slate-900 font-bold text-lg leading-tight">{percentualResolvidos}%</p>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-tight">Resolvidos<br />este mês</p>
                        </div>
                    </div>
                </div>

                {/* Chamados Grid */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <Loader2 className="animate-spin text-primary mb-4" size={40} />
                            <p className="text-sm font-medium">Carregando chamados...</p>
                        </div>
                    ) : filteredChamados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-surface border border-card-border border-dashed rounded-3xl text-slate-300">
                            <Wrench size={48} className="text-slate-400 mb-4 opacity-60" />
                            <p className="text-sm font-medium">Nenhum chamado encontrado.</p>
                            {searchTerm || filtroStatus !== 'Todos' ? (
                                <button onClick={() => { setSearchTerm(''); setFiltroStatus('Todos') }} className="mt-4 text-xs font-bold text-primary hover:underline">Limpar filtros</button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredChamados.map((chamado, i) => (
                                <ChamadoCard
                                    key={chamado.id || i}
                                    title={chamado.titulo}
                                    descricao={chamado.descricao}
                                    date={formatDate(chamado.created_at)}
                                    status={chamado.status}
                                    priority={chamado.prioridade}
                                    category={chamado.categoria}
                                    foto_url={chamado.foto_url}
                                    onViewDetails={() => setSelectedChamado(chamado)}
                                    onDelete={() => handleDeleteChamado(chamado)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detalhes Chamado */}
            {selectedChamado && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedChamado(null)}>
                    <div className="bg-surface w-full max-w-lg rounded-[40px] border border-card-border p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-500">{selectedChamado.categoria}</span>
                                <h3 className="text-slate-900 font-bold text-xl mt-1">{selectedChamado.titulo}</h3>
                            </div>
                            <button onClick={() => setSelectedChamado(null)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        {selectedChamado.foto_url && (
                            <img src={selectedChamado.foto_url} alt="Chamado" className="w-full h-48 object-cover rounded-2xl border border-card-border mb-6" />
                        )}
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selectedChamado.descricao}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${statusBadgeStyles[selectedChamado.status] || statusBadgeStyles['Aberto']}`}>{selectedChamado.status || 'Aberto'}</span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${priorityBadgeStyles[selectedChamado.prioridade] || priorityBadgeStyles['Baixa']}`}>{selectedChamado.prioridade || 'Baixa'}</span>
                            <span className="text-slate-500 text-xs font-bold">{formatDate(selectedChamado.created_at)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal / Form Overlay */}
            {showNewForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-xl rounded-[40px] border border-card-border p-8 md:p-12 space-y-8 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-slate-900 text-2xl font-black tracking-tight">Novo Chamado</h3>
                                <p className="text-slate-500 text-sm font-medium">Preencha os detalhes da sua solicitação.</p>
                            </div>
                            <button onClick={() => setShowNewForm(false)} className="size-10 absolute right-8 top-8 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white hover:bg-white/5 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none appearance-none transition-all"
                                    >
                                        <option>Hidráulica</option>
                                        <option>Elétrica</option>
                                        <option>Civil / Pintura</option>
                                        <option>Gás</option>
                                        <option>Climatização</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prioridade</label>
                                    <select
                                        value={formData.prioridade}
                                        onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none appearance-none transition-all"
                                    >
                                        <option>Baixa</option>
                                        <option>Média</option>
                                        <option>Alta (Urgente)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Título do Chamado</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                    placeholder="Ex: Vazamento no banheiro social"
                                    className="w-full bg-background border border-card-border rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição</label>
                                <textarea
                                    rows="4"
                                    required
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Descreva o problema em detalhes..."
                                    className="w-full bg-background border border-card-border rounded-2xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                ></textarea>
                            </div>

                            {imagePreview && (
                                <div className="space-y-2 relative">
                                    <div className="w-full h-32 rounded-2xl overflow-hidden border border-card-border relative group">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="bg-red-500 text-slate-900 p-2 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">{imageFile?.name}</p>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                {!imagePreview && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full sm:flex-1 flex items-center justify-center gap-2 py-4 bg-background border border-dashed border-card-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-all group"
                                    >
                                        <ImageIcon size={18} className="group-hover:scale-110 transition-transform" /> Anexar Foto do Problema
                                    </button>
                                )}
                                <button type="submit" disabled={saving} className="w-full sm:flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Solicitação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

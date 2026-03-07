import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    Box,
    Plus,
    Search,
    Filter,
    MoreVertical,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Eye,
    ChevronRight,
    Camera,
    Save,
    X,
    ClipboardList,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    Printer,
    FileSpreadsheet,
    Loader2
} from 'lucide-react'

// --- Sub-Components ---

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => (
    <div className="bg-surface rounded-3xl border border-card-border p-6 shadow-xl relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/5 rounded-full -translate-y-12 translate-x-12 blur-3xl`}></div>
        <div className="flex items-start justify-between relative mb-4">
            <div className={`size-12 rounded-2xl bg-${color}/10 border border-${color}/20 flex items-center justify-center text-${color}`}>
                <Icon size={24} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="relative">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-2xl font-black text-slate-900 mb-1">{value}</h3>
            <p className="text-slate-600 text-[10px] font-medium italic">{subValue}</p>
        </div>
    </div>
)

const CategoryBadge = ({ category }) => {
    const colors = {
        'Móveis': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'Equipamentos': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Eletrônicos': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'Imóveis': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'Veículos': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        'Outros': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    }
    const color = colors[category] || colors['Outros']
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${color}`}>
            {category}
        </span>
    )
}

// --- Main Module ---

export const Patrimonio = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [activeSubTab, setActiveSubTab] = useState('dashboard')
    const [assets, setAssets] = useState([])
    const [checklists, setChecklists] = useState([])
    const [executions, setExecutions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddAsset, setShowAddAsset] = useState(false)
    const [showAddChecklist, setShowAddChecklist] = useState(false)
    const [executingChecklist, setExecutingChecklist] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAsset, setSelectedAsset] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [assetFormData, setAssetFormData] = useState({
        nome: '',
        categoria: 'Equipamentos',
        valor: '',
        vida_util: 60,
        data_aquisicao: new Date().toISOString().split('T')[0],
        garantia: '',
        status: 'Ativo'
    })
    const [checklistFormData, setChecklistFormData] = useState({
        titulo: '',
        frequencia: 'Semanal',
        itens: ['']
    })

    useEffect(() => {
        fetchAllData()
    }, [activeSubTab])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            if (activeSubTab === 'dashboard' || activeSubTab === 'list') {
                const [assetRes, execRes] = await Promise.all([
                    supabase.from('patrimonio').select('*').order('created_at', { ascending: false }),
                    supabase.from('patrimonio_execucoes').select('*, patrimonio_checklists(titulo)').order('created_at', { ascending: false }).limit(50)
                ])
                if (!assetRes.error) setAssets(assetRes.data || [])
                if (!execRes.error) setExecutions(execRes.data || [])
            }
            if (activeSubTab === 'checklists') {
                const { data, error } = await supabase
                    .from('patrimonio_checklists')
                    .select('*')
                    .order('created_at', { ascending: false })
                if (!error) setChecklists(data || [])
            }
            if (activeSubTab === 'reports') {
                const { data, error } = await supabase
                    .from('patrimonio_execucoes')
                    .select('*, patrimonio_checklists(titulo)')
                    .order('created_at', { ascending: false })
                if (!error) setExecutions(data || [])
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAsset = async () => {
        if (!assetFormData.nome || !assetFormData.valor) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('patrimonio')
                .insert([{
                    ...assetFormData,
                    condominio_id: userProfile?.condominio_id
                }])
            if (error) throw error
            setShowAddAsset(false)
            setAssetFormData({
                nome: '',
                categoria: 'Equipamentos',
                valor: '',
                vida_util: 60,
                data_aquisicao: new Date().toISOString().split('T')[0],
                garantia: '',
                status: 'Ativo'
            })
            fetchAllData()
        } catch (error) {
            toast('Erro ao salvar patrimônio: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveChecklist = async () => {
        if (!checklistFormData.titulo || !checklistFormData.itens.filter(i => i.trim() !== '').length) {
            toast('Preencha o título e pelo menos um item da verificação.', 'error')
            return
        }
        setSaving(true)
        try {
            const itensValidos = checklistFormData.itens.filter(i => i.trim() !== '')
            const { error } = await supabase
                .from('patrimonio_checklists')
                .insert([{
                    titulo: checklistFormData.titulo,
                    frequencia: checklistFormData.frequencia,
                    itens: itensValidos,
                    condominio_id: userProfile?.condominio_id
                }])
            if (error) throw error
            setShowAddChecklist(false)
            setChecklistFormData({ titulo: '', frequencia: 'Semanal', itens: [''] })
            fetchAllData()
        } catch (error) {
            toast('Erro ao criar checklist: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAsset = async (id) => {
        if (!window.confirm('Deseja realmente remover este item do patrimônio?')) return
        try {
            const { error } = await supabase
                .from('patrimonio')
                .delete()
                .eq('id', id)
            if (error) throw error
            fetchAllData()
        } catch (error) {
            toast('Erro ao excluir: ' + error.message, 'error')
        }
    }

    const handleViewAsset = (asset) => {
        setSelectedAsset(asset)
        setShowDetailModal(true)
    }

    const handleExport = async (type) => {
        const list = filteredAssets.length > 0 ? filteredAssets : assets
        if (list.length === 0) {
            toast('Nenhum item para exportar.', 'info')
            return
        }
        try {
            const t = (type || '').toLowerCase()
            if (t === 'pdf') {
                const doc = new jsPDF()
                doc.setFontSize(18)
                doc.text('Relatório de Patrimônio', 20, 20)
                doc.setFontSize(10)
                doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 20, 28)
                let y = 40
                doc.setFontSize(9)
                list.forEach((a, i) => {
                    if (y > 270) { doc.addPage(); y = 20 }
                    doc.text(`${i + 1}. ${a.nome || '-'}`, 20, y)
                    doc.text(`   Categoria: ${a.categoria || '-'} | Valor: R$ ${Number(a.valor || 0).toFixed(2)} | Status: ${a.status || '-'}`, 20, y + 5)
                    y += 14
                })
                doc.save('Patrimonio.pdf')
                toast('PDF exportado com sucesso!', 'success')
            } else {
                const header = ['Nome', 'Categoria', 'Valor', 'Status', 'Data Aquisição']
                const rows = list.map(a => [
                    a.nome || '',
                    a.categoria || '',
                    Number(a.valor || 0).toFixed(2),
                    a.status || '',
                    (a.data_aquisicao || a.data || '').toString()
                ])
                const csv = [header.join(';'), ...rows.map(r => r.join(';'))].join('\n')
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'Patrimonio.csv'
                a.click()
                URL.revokeObjectURL(url)
                toast('Planilha exportada com sucesso!', 'success')
            }
        } catch (err) {
            toast('Erro ao exportar: ' + (err.message || 'Tente novamente.'), 'error')
        }
    }

    const calculateDepreciation = (asset) => {
        const acquisitionDate = new Date(asset.data_aquisicao || asset.data)
        const now = new Date()
        const monthsPassed = (now.getFullYear() - acquisitionDate.getFullYear()) * 12 + (now.getMonth() - acquisitionDate.getMonth())
        const lifeUtil = asset.vida_util || 60
        const monthlyDepreciation = asset.valor / lifeUtil
        const totalDepreciation = Math.min(asset.valor, monthsPassed * monthlyDepreciation)
        return {
            accumulated: totalDepreciation,
            currentValue: asset.valor - totalDepreciation
        }
    }

    const filteredAssets = assets.filter(a =>
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    // Dados reais calculados a partir dos ativos
    const totalPatrimonio = assets.reduce((acc, a) => acc + Number(a.valor || 0), 0)
    const totalDepreciacao = assets.reduce((acc, a) => acc + calculateDepreciation(a).accumulated, 0)
    const emManutencao = assets.filter(a => (a.status || '').toLowerCase().includes('manutencao')).length
    const hoje = new Date()
    const em30Dias = new Date(hoje)
    em30Dias.setDate(em30Dias.getDate() + 30)
    const garantiasVencer = assets.filter(a => {
        const g = a.garantia
        if (!g) return false
        const d = new Date(g)
        return d >= hoje && d <= em30Dias
    }).length

    const alertasReais = [
        ...assets.filter(a => (a.status || '').toLowerCase().includes('manutencao')).map(a => ({
            item: a.nome,
            action: 'Em manutenção',
            date: '—',
            status: 'pendente',
            type: 'Manutenção'
        })),
        ...assets.filter(a => {
            const g = a.garantia
            if (!g) return false
            const d = new Date(g)
            return d >= hoje && d <= em30Dias
        }).map(a => {
            const dias = Math.ceil((new Date(a.garantia) - hoje) / (1000 * 60 * 60 * 24))
            return {
                item: a.nome,
                action: `Garantia expira em ${dias} dia(s)`,
                date: new Date(a.garantia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                status: 'vencendo',
                type: 'Garantia'
            }
        })
    ]

    const categoriasParaChart = (() => {
        const total = totalPatrimonio || 1
        const porCat = {}
        assets.forEach(a => {
            const c = a.categoria || 'Outros'
            porCat[c] = (porCat[c] || 0) + Number(a.valor || 0)
        })
        const cores = { 'Equipamentos': 'bg-primary', 'Móveis': 'bg-blue-500', 'Eletrônicos': 'bg-purple-500', 'Imóveis': 'bg-emerald-500', 'Veículos': 'bg-pink-500' }
        return Object.entries(porCat).map(([label, valor]) => ({
            label,
            value: Math.round((valor / total) * 100),
            color: cores[label] || 'bg-slate-500'
        })).sort((a, b) => b.value - a.value)
    })()

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Patrimônio Total"
                    value={formatCurrency(totalPatrimonio)}
                    subValue="Investimento acumulado"
                    icon={TrendingUp}
                    color="primary"
                />
                <StatCard
                    title="Depreciação"
                    value={formatCurrency(totalDepreciacao)}
                    subValue="Valor contábil reduzido"
                    icon={BarChart3}
                    color="orange"
                />
                <StatCard
                    title="Em Manutenção"
                    value={emManutencao}
                    subValue="Itens indisponíveis"
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Garantias à Vencer"
                    value={garantiasVencer}
                    subValue="Próximos 30 dias"
                    icon={ShieldCheck}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Items / Alerts */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-surface rounded-3xl border border-card-border p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-slate-900 text-lg font-bold">Alertas e Manutenções</h3>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Status em tempo real</p>
                            </div>
                            <button className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {alertasReais.length === 0 ? (
                                <p className="text-slate-500 text-sm py-8 text-center">Nenhum alerta no momento. Os avisos surgem automaticamente para itens em manutenção ou com garantia prestes a vencer.</p>
                            ) : alertasReais.map((alert, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-background border border-card-border rounded-2xl hover:border-primary/30 transition-all group">
                                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${alert.status === 'pendente' ? 'bg-orange-500/10 text-orange-500' :
                                        alert.status === 'vencendo' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        <Clock size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-slate-900 text-sm">{alert.item}</p>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">{alert.date}</span>
                                        </div>
                                        <p className="text-slate-600 text-xs font-medium">{alert.action}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-600 group-hover:text-primary transition-colors">
                                        {alert.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Categories Chart Placeholder */}
                <div className="space-y-6">
                    <div className="bg-surface rounded-3xl border border-card-border p-8 shadow-xl overflow-hidden relative">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-slate-900 text-sm font-black uppercase tracking-widest">Distribuição</h3>
                            <BarChart3 className="text-primary" size={20} />
                        </div>

                        <div className="space-y-5">
                            {categoriasParaChart.length === 0 ? (
                                <p className="text-slate-500 text-sm py-6 text-center">Nenhum item cadastrado. Adicione patrimônio para ver a distribuição por categoria.</p>
                            ) : categoriasParaChart.map((cat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-slate-600 uppercase">{cat.label}</span>
                                        <span className="text-slate-900">{cat.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-card-border">
                                        <div className={`${cat.color} h-full transition-all duration-1000`} style={{ width: `${cat.value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-card-border flex items-center justify-center">
                            <button onClick={() => setActiveSubTab('list')} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                VER LISTA COMPLETA <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderAssetList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface p-6 rounded-3xl border border-card-border shadow-xl">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar patrimônio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-background border border-card-border rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 border-l-4 border-l-transparent focus:border-l-primary"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowAddAsset(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                        <Plus size={18} /> NOVO ITEM
                    </button>
                    <button onClick={() => handleExport('excel')} className="size-12 flex items-center justify-center bg-surface border border-card-border rounded-2xl text-slate-600 hover:text-green-400 hover:border-green-400 transition-all">
                        <FileSpreadsheet size={20} />
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-hidden bg-surface rounded-[40px] border border-card-border shadow-2xl relative">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-card-border bg-white/[0.02]">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patrimônio</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Atual</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Garantia</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border/50">
                        {filteredAssets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-white/[0.01] transition-colors group">
                                <td className="px-8 py-6">
                                    <div>
                                        <p className="text-slate-900 font-bold text-sm mb-0.5">{asset.nome}</p>
                                        <p className="text-slate-500 text-[10px] font-mono">ID: PT-{String(asset.id).padStart(4, '0')}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <CategoryBadge category={asset.categoria} />
                                </td>
                                <td className="px-8 py-6">
                                    <div>
                                        <p className="text-slate-900 font-black text-sm">R$ {calculateDepreciation(asset).currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <p className="text-red-400/60 text-[10px] font-bold">-{Math.round((calculateDepreciation(asset).accumulated / asset.valor) * 100)}% Depreciação</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
                                        <ShieldCheck size={14} className={new Date(asset.garantia) < new Date() ? 'text-red-500' : 'text-emerald-500'} />
                                        {new Date(asset.garantia).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${asset.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {asset.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleViewAsset(asset)}
                                            className="size-9 bg-white/5 border border-card-border rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAsset(asset.id)}
                                            className="size-9 bg-white/5 border border-card-border rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 transition-all"
                                            title="Excluir"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="lg:hidden space-y-4 pb-20">
                {filteredAssets.map((asset) => (
                    <div key={asset.id} className="bg-surface rounded-3xl border border-card-border p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-900 font-black text-base">{asset.nome}</p>
                                <p className="text-slate-500 text-[10px] font-mono mt-0.5">PT-{String(asset.id).padStart(4, '0')}</p>
                            </div>
                            <CategoryBadge category={asset.categoria} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-card-border/50">
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Atual</p>
                                <p className="text-slate-900 font-black text-sm">R$ {calculateDepreciation(asset).currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Garantia</p>
                                <p className="text-slate-700 text-xs font-bold">{new Date(asset.garantia).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button className="flex-1 py-3 bg-white/5 border border-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600">Ver Detalhes</button>
                            <button className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl text-primary"><MoreVertical size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderChecklists = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-surface p-6 rounded-3xl border border-card-border shadow-xl">
                <div>
                    <h3 className="text-slate-900 text-lg font-bold">Listas de Verificação</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão de inspeções periódicas</p>
                </div>
                <button onClick={() => setShowAddChecklist(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
                    <Plus size={18} /> CRIAR CHECKLIST
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(checklists.length > 0 ? checklists : []).map((check) => (
                    <div key={check.id} className="bg-surface rounded-3xl border border-card-border p-8 shadow-xl hover:border-primary/30 transition-all flex flex-col group relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

                        <div className="flex justify-between items-start mb-6 relative">
                            <div className="size-14 rounded-2xl bg-white/5 border border-card-border flex items-center justify-center text-slate-600 group-hover:text-primary transition-all group-hover:scale-110">
                                <ClipboardList size={28} />
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${check.frequencia === 'Diária' ? 'bg-emerald-500/10 text-emerald-500' :
                                check.frequencia === 'Semanal' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                {check.frequencia}
                            </span>
                        </div>

                        <h4 className="text-slate-900 text-lg font-bold mb-2 group-hover:text-primary transition-colors">{check.titulo}</h4>
                        <p className="text-slate-500 text-xs font-medium mb-6">{check.itens.length} pontos de verificação configurados.</p>

                        <div className="mt-auto space-y-3 pt-6 border-t border-card-border/50">
                            <button
                                onClick={() => setExecutingChecklist(check)}
                                className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                            >
                                EXECUTAR AGORA
                            </button>
                            <div className="flex gap-2">
                                <button className="flex-1 py-3 bg-white/5 border border-card-border rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-all">Editar</button>
                                <button className="flex-1 py-3 bg-white/5 border border-card-border rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-all">Histórico</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const renderRelatorios = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patrimonio Valuation Report */}
                <div className="bg-surface rounded-3xl border border-card-border p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
                    <FileText className="text-primary mb-6" size={40} />
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Relatório Patrimonial</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-10">
                        Visão detalhada de valor total, depreciação acumulada por categoria e valor residual atualizado para balanços.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => handleExport('pdf')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-slate-900 transition-all">
                            <Download size={16} /> DOWNLOAD PDF
                        </button>
                        <button onClick={() => handleExport('excel')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-900 transition-all">
                            <FileSpreadsheet size={16} /> EXCEL (XLSX)
                        </button>
                    </div>
                </div>

                {/* Execution History Report */}
                <div className="bg-surface rounded-3xl border border-card-border p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Relatório de Execuções</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-10">
                        Histórico completo de checklists executados, conformidade por equipe e identificação de problemas recorrentes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => handleExport('pdf')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-slate-900 transition-all">
                            <Download size={16} /> DOWNLOAD PDF
                        </button>
                        <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 border border-card-border text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">
                            <Printer size={16} /> IMPRIMIR TODAS
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity - dados reais */}
            <div className="bg-surface rounded-[40px] border border-card-border p-8 shadow-2xl">
                <h3 className="text-slate-900 text-sm font-black uppercase tracking-widest mb-8">Atividades Recentes</h3>
                <div className="space-y-4">
                    {(() => {
                        const atividades = [
                            ...assets.map(a => ({
                                action: `Item cadastrado: ${a.nome || 'Sem nome'}`,
                                created_at: a.created_at,
                                result: 'Novo Item',
                                status: 'info'
                            })),
                            ...executions.map(e => ({
                                action: e.patrimonio_checklists?.titulo ? `Checklist: ${e.patrimonio_checklists.titulo}` : 'Execução de checklist',
                                created_at: e.created_at,
                                result: e.resumo_conformidade || 'Concluído',
                                status: (e.resumo_conformidade || '').toLowerCase().includes('conforme') ? 'success' : 'warning'
                            }))
                        ]
                            .sort((a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0)))
                            .slice(0, 5)
                            .map(x => ({ ...x, date: x.created_at ? new Date(x.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' }))
                        if (atividades.length === 0) {
                            return <p className="text-slate-500 text-sm py-6 text-center">Nenhuma atividade recente. Cadastre itens ou execute checklists para registrar o histórico.</p>
                        }
                        return atividades.map((log, i) => (
                            <div key={i} className="flex items-center gap-4 p-5 bg-background border border-card-border rounded-2xl">
                                <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">{(log.action || 'A')[0]}</div>
                                <div className="flex-1">
                                    <p className="text-slate-900 text-sm font-bold">{log.action}</p>
                                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider mt-0.5">{log.date}</p>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                    log.status === 'info' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                    {log.result}
                                </span>
                            </div>
                        ))
                    })()}
                </div>
            </div>
        </div>
    )

    // --- Execution Modal (Mobile Optimization) ---
    const renderExecutionFlow = () => {
        if (!executingChecklist) return null
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] animate-in slide-in-from-right duration-300">
                <div className="h-full flex flex-col max-w-2xl mx-auto w-full bg-surface border-x border-card-border">
                    <header className="p-6 border-b border-card-border flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-xl z-10">
                        <div>
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">Execução de Checklist</p>
                            <h2 className="text-slate-900 text-xl font-black">{executingChecklist.titulo}</h2>
                        </div>
                        <button
                            onClick={() => setExecutingChecklist(null)}
                            className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                        {executingChecklist.itens.map((item, i) => (
                            <div key={i} className="space-y-4 pb-8 border-b border-card-border/50">
                                <div className="flex items-start gap-4">
                                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0">{i + 1}</div>
                                    <p className="text-slate-900 font-bold text-lg leading-tight">{item}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-background border border-card-border cursor-pointer has-[:checked]:border-emerald-500/50 has-[:checked]:bg-emerald-500/5 transition-all group">
                                        <input type="radio" name={`item-${i}`} className="hidden peer" />
                                        <div className="size-6 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all">
                                            <CheckCircle2 size={14} className="text-slate-900" />
                                        </div>
                                        <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest peer-checked:text-emerald-500">Conforme</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-background border border-card-border cursor-pointer has-[:checked]:border-red-500/50 has-[:checked]:bg-red-500/5 transition-all group">
                                        <input type="radio" name={`item-${i}`} className="hidden peer" />
                                        <div className="size-6 rounded-lg border-2 border-slate-300 flex items-center justify-center peer-checked:bg-red-500 peer-checked:border-red-500 transition-all">
                                            <AlertTriangle size={14} className="text-slate-900" />
                                        </div>
                                        <span className="text-slate-600 font-black text-[10px] uppercase tracking-widest peer-checked:text-red-500">Irregular</span>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    <textarea
                                        placeholder="Observações (opcional)"
                                        className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[80px]"
                                    ></textarea>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-dashed border-slate-600 rounded-xl text-slate-600 hover:text-slate-900 transition-all text-[10px] font-black uppercase">
                                        <Camera size={14} /> Adicionar Foto
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-card-border bg-surface/90 backdrop-blur-md fixed bottom-0 left-0 right-0 max-w-2xl mx-auto">
                        <button
                            disabled={saving}
                            onClick={async () => {
                                setSaving(true)
                                try {
                                    const { error } = await supabase
                                        .from('patrimonio_execucoes')
                                        .insert([{
                                            checklist_id: executingChecklist.id,
                                            usuario_id: session?.user?.id,
                                            resumo_conformidade: 'Conforme', // Simplificado para este MVP
                                            detalhes: { data: new Date().toISOString(), status: 'Finalizado' },
                                            condominio_id: userProfile?.condominio_id
                                        }])
                                    if (error) throw error
                                    toast('Checklist enviado com sucesso!', 'success')
                                    setExecutingChecklist(null)
                                    fetchAllData()
                                } catch (error) {
                                    toast('Erro ao salvar execução: ' + error.message, 'error')
                                } finally {
                                    setSaving(false)
                                }
                            }}
                            className="w-full py-5 bg-primary text-white rounded-[24px] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> FINALIZAR INSPEÇÃO</>}
                        </button>
                    </div>

                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] animate-pulse">Carregando Módulo de Patrimônio</p>
            </div>
        )
    }

    return (
        <div className="pb-20">
            {/* Header / Sub-Nav */}
            <div className="mb-10 space-y-8">
                <div className="flex items-center gap-5">
                    <div className="size-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                        <Box size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Patrimônio <span className="text-primary">&</span> Manutenção</h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium mt-1 uppercase tracking-[0.1em]">Gestão de ativos e controle de inspeções periódicas</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-surface/50 p-1.5 rounded-2xl border border-card-border w-fit">
                    {[
                        { id: 'dashboard', label: 'Visão Geral', icon: BarChart3 },
                        { id: 'list', label: 'Itens (Ativos)', icon: Box },
                        { id: 'checklists', label: 'Checklists', icon: ClipboardList },
                        { id: 'reports', label: 'Relatórios', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            {activeSubTab === 'dashboard' && renderDashboard()}
            {activeSubTab === 'list' && renderAssetList()}
            {activeSubTab === 'checklists' && renderChecklists()}
            {activeSubTab === 'reports' && renderRelatorios()}

            {/* Modal de Detalhes do Ativo */}
            {showDetailModal && selectedAsset && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-2xl rounded-[40px] border border-card-border p-8 md:p-12 animate-in zoom-in-95 duration-300 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowDetailModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><X size={20} /></button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Box size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedAsset.nome}</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">PT-{String(selectedAsset.id).padStart(4, '0').slice(-4)} • {selectedAsset.categoria}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor de Aquisição</p>
                                    <p className="text-slate-900 text-xl font-black">{formatCurrency(selectedAsset.valor)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Depreciação Acumulada</p>
                                    <p className="text-red-400 text-xl font-black">{formatCurrency(calculateDepreciation(selectedAsset).accumulated)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Atual (Residual)</p>
                                    <p className="text-emerald-400 text-2xl font-black">{formatCurrency(calculateDepreciation(selectedAsset).currentValue)}</p>
                                </div>
                            </div>
                            <div className="space-y-6 border-l border-card-border pl-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data da Compra</p>
                                    <p className="text-slate-900 font-bold">{new Date(selectedAsset.data_aquisicao || selectedAsset.data).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Garantia até</p>
                                    <p className={`${new Date(selectedAsset.garantia) < new Date() ? 'text-red-400' : 'text-slate-900'} font-bold`}>{selectedAsset.garantia ? new Date(selectedAsset.garantia).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vida Útil Estimada</p>
                                    <p className="text-slate-900 font-bold">{selectedAsset.vida_util || 60} meses</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowDetailModal(false)} className="flex-1 py-4 bg-white/5 border border-card-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all">Fechar</button>
                            <button onClick={() => { handleDeleteAsset(selectedAsset.id); setShowDetailModal(false); }} className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-slate-900 transition-all">Excluir Item</button>
                        </div>
                    </div>
                </div>
            )}
            {renderExecutionFlow()}

            {/* Add Asset Modal (Static Placeholder) */}
            {showAddAsset && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-xl rounded-[40px] border border-card-border p-8 md:p-12 animate-in zoom-in-95 duration-300 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowAddAsset(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><X size={20} /></button>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Novo Patrimônio</h2>
                        <p className="text-slate-500 text-sm font-medium mb-10">Preencha os dados do novo ativo para controle.</p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Item</label>
                                    <input
                                        type="text"
                                        value={assetFormData.nome}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, nome: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Ex: Ar Condicionado"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                                    <select
                                        value={assetFormData.categoria}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, categoria: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                                    >
                                        <option>Equipamentos</option>
                                        <option>Móveis</option>
                                        <option>Eletrônicos</option>
                                        <option>Imóveis</option>
                                        <option>Veículos</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor de Aquisição</label>
                                    <input
                                        type="number"
                                        value={assetFormData.valor}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, valor: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data de Compra</label>
                                    <input
                                        type="date"
                                        value={assetFormData.data_aquisicao}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, data_aquisicao: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento Garantia</label>
                                    <input
                                        type="date"
                                        value={assetFormData.garantia}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, garantia: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vida Útil (Meses)</label>
                                    <input
                                        type="number"
                                        value={assetFormData.vida_util}
                                        onChange={(e) => setAssetFormData({ ...assetFormData, vida_util: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="60"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveAsset}
                                disabled={saving}
                                className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : 'SALVAR NO PATRIMÔNIO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Checklist Modal */}
            {showAddChecklist && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-xl rounded-[40px] border border-card-border p-8 md:p-12 animate-in zoom-in-95 duration-300 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowAddChecklist(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><X size={20} /></button>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Nova Lista de Verificação</h2>
                        <p className="text-slate-500 text-sm font-medium mb-10">Configure as rotinas de inspeção do seu patrimônio.</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título do Checklist</label>
                                <input
                                    type="text"
                                    value={checklistFormData.titulo}
                                    onChange={(e) => setChecklistFormData({ ...checklistFormData, titulo: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Ex: Inspeção Semanal Elétrica"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frequência</label>
                                <select
                                    value={checklistFormData.frequencia}
                                    onChange={(e) => setChecklistFormData({ ...checklistFormData, frequencia: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                                >
                                    <option>Diária</option>
                                    <option>Semanal</option>
                                    <option>Quinzenal</option>
                                    <option>Mensal</option>
                                    <option>Semestral</option>
                                </select>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-card-border/50">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                                    <span>Pontos de Verificação</span>
                                    <button
                                        onClick={() => setChecklistFormData({ ...checklistFormData, itens: [...checklistFormData.itens, ''] })}
                                        className="text-primary hover:text-slate-900 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Adicionar Item
                                    </button>
                                </label>

                                {checklistFormData.itens.map((item, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => {
                                                const newItens = [...checklistFormData.itens]
                                                newItens[idx] = e.target.value
                                                setChecklistFormData({ ...checklistFormData, itens: newItens })
                                            }}
                                            className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-primary"
                                            placeholder={`Item ${idx + 1}...`}
                                        />
                                        <button
                                            onClick={() => {
                                                const newItens = checklistFormData.itens.filter((_, i) => i !== idx)
                                                setChecklistFormData({ ...checklistFormData, itens: newItens })
                                            }}
                                            className="px-4 py-3 border border-card-border rounded-xl text-slate-500 hover:text-red-500 hover:border-red-500/50 transition-colors bg-white/5"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSaveChecklist}
                                disabled={saving}
                                className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : 'SALVAR CHECKLIST'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

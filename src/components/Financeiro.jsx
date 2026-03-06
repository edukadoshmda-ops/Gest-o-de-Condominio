import React, { useState, useEffect } from 'react'
import { jsPDF } from "jspdf"
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import * as XLSX from 'xlsx'
import {
    Eye,
    Printer,
    Download,
    History,
    FileBarChart,
    CalendarDays,
    CheckCircle2,
    Loader2,
    X,
    FileText,
    Users,
    Plus
} from 'lucide-react'

export const Financeiro = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [faturas, setFaturas] = useState([])
    const [usuariosCondo, setUsuariosCondo] = useState([])
    const [loading, setLoading] = useState(true)
    const isAdmin = userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master'
    const [processing, setProcessing] = useState(false)
    const [showFiltros, setShowFiltros] = useState(false)
    const [filtroStatus, setFiltroStatus] = useState('Todos')
    const [filtroDataInicio, setFiltroDataInicio] = useState('')
    const [filtroDataFim, setFiltroDataFim] = useState('')
    const [processingLabel, setProcessingLabel] = useState('')
    const [downloadSuccess, setDownloadSuccess] = useState(false)
    const [editingVencimentoId, setEditingVencimentoId] = useState(null)
    const [editingVencimentoVal, setEditingVencimentoVal] = useState('')
    const [showNovaFatura, setShowNovaFatura] = useState(false)
    const [novaFatura, setNovaFatura] = useState({ descricao: '', vencimento: '', valor: '', morador_id: '' })
    const [salvandoFatura, setSalvandoFatura] = useState(false)

    useEffect(() => {
        fetchFaturas()
        if (isAdmin && userProfile?.condominio_id) fetchUsuariosCondo()
    }, [userProfile?.condominio_id, isAdmin])

    const fetchUsuariosCondo = async () => {
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('condominio_id', userProfile?.condominio_id)
            setUsuariosCondo(data || [])
        } catch (e) {
            console.error('Erro ao buscar usuários:', e)
        }
    }

    const fetchFaturas = async () => {
        try {
            let query = supabase
                .from('faturas')
                .select('*')
                .order('vencimento', { ascending: false })

            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }
            if (!isAdmin && session?.user?.id) {
                query = query.eq('morador_id', session.user.id)
            }

            const { data, error } = await query

            if (error) throw error
            setFaturas(data || [])
        } catch (error) {
            console.error('Erro ao buscar faturas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = (label, actionType = 'boleto', data = null) => {
        setProcessingLabel(label)
        setProcessing(true)
        setDownloadSuccess(false)

        setTimeout(() => {
            try {
                const doc = new jsPDF()
                doc.setFont("helvetica")

                if (actionType === 'boleto') {
                    doc.setFontSize(22)
                    doc.setTextColor(0, 0, 0)
                    doc.text("Boleto Bancário - Gestão de Condomínio", 20, 30)

                    doc.setFontSize(12)
                    doc.text(`Beneficiário: Condomínio Cyber`, 20, 50)
                    doc.text(`Pagador: ${userProfile?.nome || session?.user?.email || 'Condômino'}`, 20, 60)

                    if (data) {
                        doc.text(`Referência: ${data.descricao}`, 20, 70)
                        doc.text(`Vencimento: ${formatDate(data.vencimento)}`, 20, 80)
                        doc.text(`Valor: ${formatCurrency(data.valor)}`, 20, 90)
                    } else {
                        // Total pendente boleto
                        const pendentesTotal = faturasDisplay.filter(f => f.status === 'Pendente' || f.status === 'Vencido').reduce((acc, curr) => acc + Number(curr.valor), 0)
                        doc.text(`Referência: Boleto Geral (Total Pendente)`, 20, 70)
                        doc.text(`Vencimento: Próximo Útil`, 20, 80)
                        doc.text(`Valor: ${formatCurrency(pendentesTotal)}`, 20, 90)
                    }

                    doc.setFontSize(10)
                    doc.text("Código de Barras Fictício:", 20, 110)
                    doc.setFontSize(14)
                    doc.text("34191.09008 00000.000000 00000.000000 1 000000000000", 20, 120)

                    if (actionType === 'visualizar_boleto') {
                        const pdfBlob = doc.output('blob');
                        const url = URL.createObjectURL(pdfBlob);
                        window.open(url, '_blank');
                    } else if (actionType === 'imprimir') {
                        const pdfBlob = doc.output('blob');
                        const url = URL.createObjectURL(pdfBlob);
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = url;
                        document.body.appendChild(iframe);
                        iframe.onload = () => {
                            iframe.contentWindow?.print();
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(url);
                            }, 1000);
                        };
                    } else {
                        doc.save(data ? `Boleto_${data.id || 'Cobrança'}.pdf` : "Boleto_Atual.pdf");
                    }
                } else if (actionType === 'relatorio') {
                    doc.setFontSize(18)
                    doc.text("Relatório Financeiro do Período", 20, 30)
                    doc.setFontSize(12)
                    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 20, 40)

                    const pendentesTotal = faturasDisplay.filter(f => f.status === 'Pendente' || f.status === 'Vencido').reduce((acc, curr) => acc + Number(curr.valor), 0)
                    doc.text(`Total Pendente: ${formatCurrency(pendentesTotal)}`, 20, 50)

                    let y = 70
                    doc.setFontSize(14)
                    doc.text("Cobranças / Faturas:", 20, y)
                    y += 10
                    doc.setFontSize(10)
                    faturasDisplay.forEach((fat) => {
                        if (y > 270) {
                            doc.addPage()
                            y = 20
                        }
                        doc.text(`${formatDate(fat.vencimento)} - ${fat.descricao} - ${formatCurrency(fat.valor)} - Status: ${fat.status}`, 20, y)
                        y += 10
                    })

                    doc.save("Relatorio_Financeiro.pdf")
                }

                setDownloadSuccess(true)
            } catch (error) {
                console.error("Erro ao gerar documento", error)
                toast("Erro ao processar o arquivo.", "error")
            } finally {
                setTimeout(() => {
                    setProcessing(false)
                    setDownloadSuccess(false)
                }, 2000)
            }
        }, 1500)
    }

    // Dados reais do Supabase (sem dados demo)
    const faturasBase = faturas
    const faturasDisplay = faturasBase.filter(f => {
        if (filtroStatus !== 'Todos' && f.status !== filtroStatus) return false
        if (filtroDataInicio && (f.vencimento || '').split('T')[0] < filtroDataInicio) return false
        if (filtroDataFim && (f.vencimento || '').split('T')[0] > filtroDataFim) return false
        return true
    })

    const getStatusStyle = (status) => {
        if (status === 'Pago') return { color: 'text-green-500', bg: 'bg-green-500/10' }
        if (status === 'Pendente') return { color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
        if (status === 'Vencido') return { color: 'text-red-500', bg: 'bg-red-500/10' }
        return { color: 'text-slate-500', bg: 'bg-slate-500/10' }
    }

    const handleSalvarVencimento = async (faturaId, novaData) => {
        if (!novaData) return
        if (!isFaturaReal({ id: faturaId })) {
            toast('Esta cobrança é apenas demonstrativa. Cadastre faturas reais no Supabase para editar vencimento.', 'error')
            setEditingVencimentoId(null)
            return
        }
        try {
            const { error } = await supabase
                .from('faturas')
                .update({ vencimento: novaData })
                .eq('id', faturaId)
            if (error) throw error
            toast('Data de vencimento atualizada.', 'success')
            setEditingVencimentoId(null)
            fetchFaturas()
        } catch (err) {
            toast(`Falha ao atualizar: ${err.message || 'Tente novamente.'}`, 'error')
        }
    }

    const isFaturaReal = (item) => {
        const id = item?.id
        if (id == null) return false
        const s = String(id)
        return s.length === 36 && s.includes('-') && /^[0-9a-f-]{36}$/i.test(s)
    }

    const handleConfirmarPagamento = async (item) => {
        if (item.status === 'Pago') return
        if (!isFaturaReal(item)) {
            toast('Esta cobrança é apenas demonstrativa. Cadastre faturas reais no Supabase para confirmar pagamentos.', 'error')
            return
        }
        if (!confirm(`Confirmar pagamento de ${item.descricao} - ${formatCurrency(item.valor)}?`)) return
        try {
            const hoje = new Date().toISOString().split('T')[0]
            const { error } = await supabase
                .from('faturas')
                .update({ status: 'Pago', data_pagamento: hoje })
                .eq('id', item.id)
            if (error) throw error
            toast('Pagamento confirmado com sucesso!', 'success')
            fetchFaturas()
        } catch (err) {
            toast(`Falha ao confirmar: ${err.message || 'Tente novamente.'}`, 'error')
        }
    }

    const handleSalvarFatura = async () => {
        const { descricao, vencimento, valor } = novaFatura
        const valorNum = parseFloat(String(valor || '0').replace(',', '.'))
        if (!descricao?.trim() || !vencimento) {
            toast('Preencha descrição e vencimento.', 'error')
            return
        }
        if (isNaN(valorNum) || valorNum <= 0) {
            toast('Informe um valor válido maior que zero.', 'error')
            return
        }
        if (userProfile?.tipo === 'sindico' && !userProfile?.condominio_id) {
            toast('Seu perfil precisa estar vinculado a um condomínio. Verifique em Configurações.', 'error')
            return
        }
        setSalvandoFatura(true)
        try {
            const payload = {
                descricao: descricao.trim(),
                vencimento,
                valor: valorNum,
                status: 'Pendente',
                condominio_id: userProfile?.condominio_id || null,
                morador_id: novaFatura.morador_id?.trim() || null,
            }
            const { error } = await supabase.from('faturas').insert(payload)
            if (error) throw error
            toast('Fatura cadastrada com sucesso!', 'success')
            setShowNovaFatura(false)
            setNovaFatura({ descricao: '', vencimento: '', valor: '', morador_id: '' })
            fetchFaturas()
        } catch (err) {
            toast(`Erro ao cadastrar: ${err.message || 'Tente novamente.'}`, 'error')
        } finally {
            setSalvandoFatura(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        // ensure correct timezone visually if needed, but simple toLocale is ok here
        // usually we split YYYY-MM-DD to avoid timezone shifts
        const [year, month, day] = dateStr.split('T')[0].split('-')
        return `${day}/${month}/${year}`
    }

    const formatCurrency = (value) => {
        return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    // Resumo stats
    const pendentes = faturasDisplay.filter(f => f.status === 'Pendente' || f.status === 'Vencido')
    const totalPendente = pendentes.reduce((acc, curr) => acc + Number(curr.valor), 0)
    const proximoVencimento = [...pendentes].sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))[0]

    const ultimoPago = faturasDisplay.filter(f => f.status === 'Pago').sort((a, b) => new Date(b.data_pagamento || b.vencimento) - new Date(a.data_pagamento || a.vencimento))[0]

    const pendentesTodos = isAdmin ? faturasDisplay.filter(f => f.status === 'Pendente' || f.status === 'Vencido') : []
    const nomeMorador = (moradorId) => usuariosCondo.find(u => u.id === moradorId)?.nome || '—'

    const exportarExcel = () => {
        try {
            const dados = faturasDisplay.map(f => ({
                Descrição: f.descricao,
                Vencimento: formatDate(f.vencimento),
                Valor: formatCurrency(f.valor),
                Status: f.status,
                Morador: nomeMorador(f.morador_id),
            }))
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), 'Faturas')
            XLSX.writeFile(wb, `faturas-${new Date().toISOString().slice(0, 10)}.xlsx`)
            toast('Planilha exportada!', 'success')
        } catch (e) {
            toast('Erro ao exportar: ' + (e?.message || 'Tente novamente.'), 'error')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-end">
                <button onClick={exportarExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20">
                    <Download size={16} /> Exportar Excel
                </button>
            </div>
            {/* Menu Síndico/Admin: Confirmar pagamentos de todos os moradores */}
            {isAdmin && pendentesTodos.length > 0 && (
                <section className="bg-surface rounded-3xl border border-card-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-card-border/50 flex items-center gap-2">
                        <Users className="text-primary" size={20} />
                        <h2 className="text-slate-900 font-bold text-lg">Confirmar pagamentos do condomínio</h2>
                    </div>
                    <p className="px-6 py-2 text-slate-500 text-sm">Taxas pendentes de todos os moradores. Clique em confirmar quando o pagamento for recebido.</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-card-border/50">
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Morador</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border/30">
                                {pendentesTodos.map((item, i) => (
                                    <tr key={item.id || i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{nomeMorador(item.morador_id)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{item.descricao}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{formatDate(item.vencimento)}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900">{formatCurrency(item.valor)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleConfirmarPagamento(item)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/20 text-xs font-bold uppercase transition-all"
                                                title="Confirmar pagamento"
                                            >
                                                <CheckCircle2 size={16} /> Confirmar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Financial Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-primary p-6 rounded-3xl shadow-2xl shadow-primary/20 relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-slate-900/70 text-xs font-bold uppercase tracking-wider mb-2">Total em Aberto</p>
                    <h3 className="text-slate-900 text-3xl font-black mb-6">{formatCurrency(totalPendente)}</h3>
                    {proximoVencimento ? (
                        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-xl border border-white/20">
                            <CalendarDays size={14} className="text-slate-900 shrink-0" />
                            {editingVencimentoId === proximoVencimento.id ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={editingVencimentoVal || (proximoVencimento.vencimento && proximoVencimento.vencimento.toString().split('T')[0]) || ''}
                                        onChange={(e) => setEditingVencimentoVal(e.target.value)}
                                        onBlur={() => {
                                            if (editingVencimentoVal) handleSalvarVencimento(proximoVencimento.id, editingVencimentoVal)
                                            setEditingVencimentoId(null)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editingVencimentoVal) {
                                                handleSalvarVencimento(proximoVencimento.id, editingVencimentoVal)
                                                setEditingVencimentoId(null)
                                            }
                                            if (e.key === 'Escape') setEditingVencimentoId(null)
                                        }}
                                        className="bg-white/30 border border-white/40 rounded-lg px-2 py-1 text-slate-900 text-[20px] font-bold min-w-[120px]"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingVencimentoId(proximoVencimento.id)
                                        setEditingVencimentoVal(proximoVencimento.vencimento?.toString().split('T')[0] || '')
                                    }}
                                    className="text-left text-slate-900 text-[20px] font-bold hover:underline"
                                    title="Clique para editar a data de vencimento"
                                >
                                    Vence em: {formatDate(proximoVencimento.vencimento)}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-xl border border-white/20">
                            <span className="text-slate-900 text-[20px] font-bold">Tudo em dia!</span>
                        </div>
                    )}
                </div>

                <div className="bg-surface p-6 rounded-3xl border border-card-border hover:border-primary/30 transition-all group flex flex-col justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Último Pagamento</p>
                        <div className="flex items-end gap-3 mb-2">
                            <h3 className="text-slate-900 text-3xl font-black">{ultimoPago ? formatCurrency(ultimoPago.valor) : 'R$ 0,00'}</h3>
                            <span className="text-green-500 text-xs font-bold flex items-center mb-1 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                                OK
                            </span>
                        </div>
                    </div>
                    {ultimoPago && (
                        <p className="text-slate-500 text-[20px] font-semibold italic">Liquidação: {formatDate(ultimoPago.data_pagamento || ultimoPago.vencimento)}</p>
                    )}
                </div>

                <div className="bg-surface p-6 rounded-3xl border border-card-border hover:border-primary/30 transition-all md:col-span-2 lg:col-span-1">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Ações Financeiras</p>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleAction('Gerando Visualização...', 'visualizar_boleto')}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-background border border-card-border hover:border-primary transition-all group"
                        >
                            <Eye className="text-primary group-hover:scale-110 transition-transform" size={24} />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Visualizar</span>
                        </button>
                        <button
                            onClick={() => handleAction('Gerando Boleto PDF...', 'boleto')}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-background border border-card-border hover:border-primary transition-all group"
                        >
                            <Download className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Baixar PDF</span>
                        </button>
                        <button
                            onClick={() => handleAction('Gerando para impressão...', 'imprimir')}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-background border border-card-border hover:border-primary transition-all group"
                        >
                            <Printer className="text-primary group-hover:scale-110 transition-transform" size={24} />
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Imprimir</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* History Table */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <History className="text-primary" size={20} />
                        <h2 className="text-slate-900 font-bold text-lg">Histórico de Cobrança</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button
                                onClick={() => setShowNovaFatura(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                            >
                                <Plus size={16} /> Nova Fatura
                            </button>
                        )}
                        <button
                            onClick={() => setShowFiltros(true)}
                            className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                        >
                            Filtros
                        </button>
                    </div>
                </div>

                <div className="bg-surface rounded-3xl border border-card-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-card-border/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="animate-spin text-primary" size={24} />
                                            </div>
                                        </td>
                                    </tr>
                                ) : faturasDisplay.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            <p className="text-sm font-medium">Nenhuma fatura cadastrada.</p>
                                            {isAdmin ? (
                                                <p className="text-xs mt-1">Clique em <strong>Nova Fatura</strong> acima para cadastrar.</p>
                                            ) : (
                                                <p className="text-xs mt-1">O síndico pode cadastrar faturas ou use o painel do Supabase.</p>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    faturasDisplay.map((item, i) => {
                                        const statusStyle = getStatusStyle(item.status)
                                        return (
                                            <tr key={item.id || i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-5 text-sm font-semibold text-slate-900">{item.descricao}</td>
                                                <td className="px-6 py-5 text-sm text-slate-600 font-mono">{formatDate(item.vencimento)}</td>
                                                <td className="px-6 py-5 text-sm font-black text-slate-900">{formatCurrency(item.valor)}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`${statusStyle.color} ${statusStyle.bg} text-[10px] font-black px-2.5 py-1 rounded-full border border-current/20 uppercase`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {(item.status === 'Pendente' || item.status === 'Vencido') && (
                                                            <button
                                                                onClick={() => handleConfirmarPagamento(item)}
                                                                className="px-3 py-1.5 text-xs font-bold hover:bg-green-500/10 text-slate-600 hover:text-green-600 rounded-xl transition-all"
                                                                title="Confirmar pagamento"
                                                            >
                                                                Confirmar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleAction('Baixando Boleto de ' + (item.descricao || 'Fatura'), 'boleto', item)}
                                                            className="p-2 hover:bg-primary/10 text-slate-600 hover:text-primary rounded-xl transition-all"
                                                            title="Baixar Boleto"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Modal Filtros */}
            {showFiltros && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-900 font-bold text-lg">Filtrar Faturas</h3>
                            <button onClick={() => setShowFiltros(false)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Status</label>
                                <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900">
                                    <option value="Todos">Todos</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Pendente">Pendente</option>
                                    <option value="Vencido">Vencido</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">De</label>
                                    <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Até</label>
                                    <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900" />
                                </div>
                            </div>
                            <button onClick={() => { setFiltroStatus('Todos'); setFiltroDataInicio(''); setFiltroDataFim(''); setShowFiltros(false); }} className="w-full py-3 rounded-2xl border border-card-border text-slate-600 text-sm font-bold hover:bg-white/5">
                                Limpar filtros
                            </button>
                            <button onClick={() => setShowFiltros(false)} className="w-full py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase">
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nova Fatura */}
            {showNovaFatura && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-900 font-bold text-lg">Nova Fatura</h3>
                            <button onClick={() => setShowNovaFatura(false)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Descrição</label>
                                <input
                                    type="text"
                                    value={novaFatura.descricao}
                                    onChange={(e) => setNovaFatura({ ...novaFatura, descricao: e.target.value })}
                                    placeholder="Ex: Taxa Condominial Ref. Abril"
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Vencimento</label>
                                <input
                                    type="date"
                                    value={novaFatura.vencimento}
                                    onChange={(e) => setNovaFatura({ ...novaFatura, vencimento: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Valor (R$)</label>
                                <input
                                    type="text"
                                    value={novaFatura.valor}
                                    onChange={(e) => setNovaFatura({ ...novaFatura, valor: e.target.value })}
                                    placeholder="540,00"
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900"
                                />
                            </div>
                            {usuariosCondo.length > 0 && (
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Morador (opcional)</label>
                                    <select
                                        value={novaFatura.morador_id}
                                        onChange={(e) => setNovaFatura({ ...novaFatura, morador_id: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900"
                                    >
                                        <option value="">Todos / Geral</option>
                                        {usuariosCondo.map(u => (
                                            <option key={u.id} value={u.id}>{u.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowNovaFatura(false)} className="flex-1 py-3 rounded-2xl border border-card-border text-slate-600 text-sm font-bold hover:bg-white/5">Cancelar</button>
                                <button onClick={handleSalvarFatura} disabled={salvandoFatura} className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase disabled:opacity-50">
                                    {salvandoFatura ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Cadastrar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay de Processamento */}
            {processing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-xs rounded-[32px] border border-card-border p-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl">
                        {!downloadSuccess ? (
                            <>
                                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-bold">{processingLabel}</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Aguarde um instante...</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-slate-900 font-bold">Documento Pronto!</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Download iniciado com sucesso</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

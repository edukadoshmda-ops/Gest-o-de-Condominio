import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    BarChart3,
    Package,
    Calendar,
    AlertTriangle,
    TrendingUp,
    Loader2,
    Download,
    PieChart
} from 'lucide-react'
import * as XLSX from 'xlsx'

export const Relatorios = ({ session, userProfile }) => {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        reservasMes: 0,
        encomendasPendentes: 0,
        encomendasMes: 0,
        avisosRecentes: 0,
        faturasVencidas: 0,
        faturasPagas: 0,
    })
    const [reservasPorArea, setReservasPorArea] = useState([])
    const [encomendasPorMes, setEncomendasPorMes] = useState([])

    useEffect(() => {
        if (userProfile?.condominio_id) fetchRelatorios()
    }, [userProfile?.condominio_id])

    const fetchRelatorios = async () => {
        setLoading(true)
        try {
            const condo = userProfile.condominio_id
            const inicioMes = new Date()
            inicioMes.setDate(1)
            inicioMes.setHours(0, 0, 0, 0)
            const fimMes = new Date(inicioMes)
            fimMes.setMonth(fimMes.getMonth() + 1)

            const [rRes, eRes, aRes, fRes] = await Promise.all([
                supabase.from('reservas').select('id, area_nome, data').eq('condominio_id', condo).gte('data', inicioMes.toISOString().slice(0, 10)).lt('data', fimMes.toISOString().slice(0, 10)),
                supabase.from('encomendas').select('id, status, created_at').eq('condominio_id', condo),
                supabase.from('avisos').select('id').eq('condominio_id', condo).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
                supabase.from('faturas').select('id, status').eq('condominio_id', condo),
            ])

            const reservas = rRes.data || []
            const encomendas = eRes.data || []
            const avisos = aRes.data || []
            const faturas = fRes.data || []

            const porArea = {}
            reservas.forEach(r => { porArea[r.area_nome || 'Outros'] = (porArea[r.area_nome || 'Outros'] || 0) + 1 })
            setReservasPorArea(Object.entries(porArea).map(([name, count]) => ({ name, count })))

            const pendentes = encomendas.filter(e => e.status === 'Pendente').length
            const esteMes = encomendas.filter(e => new Date(e.created_at) >= inicioMes).length
            const vencidas = faturas.filter(f => f.status === 'Vencido').length
            const pagas = faturas.filter(f => f.status === 'Pago').length

            setStats({
                reservasMes: reservas.length,
                encomendasPendentes: pendentes,
                encomendasMes: esteMes,
                avisosRecentes: avisos.length,
                faturasVencidas: vencidas,
                faturasPagas: pagas,
            })

            const meses = {}
            encomendas.forEach(e => {
                const m = new Date(e.created_at).toISOString().slice(0, 7)
                meses[m] = (meses[m] || 0) + 1
            })
            setEncomendasPorMes(Object.entries(meses).sort().slice(-6).map(([mes, count]) => ({ mes, count })))
        } catch (e) {
            console.error('Erro relatórios:', e)
        } finally {
            setLoading(false)
        }
    }

    const exportarExcel = async () => {
        try {
            const condo = userProfile?.condominio_id
            const { data: reservas } = await supabase.from('reservas').select('*').eq('condominio_id', condo).order('data', { ascending: false })
            const { data: faturas } = await supabase.from('faturas').select('*').eq('condominio_id', condo).order('vencimento', { ascending: false })

            const wb = XLSX.utils.book_new()
            if (reservas?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reservas), 'Reservas')
            if (faturas?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(faturas), 'Faturas')
            XLSX.writeFile(wb, `relatorios-${new Date().toISOString().slice(0, 10)}.xlsx`)
        } catch (e) {
            console.error('Erro exportar:', e)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    const cards = [
        { label: 'Reservas este mês', value: stats.reservasMes, icon: Calendar, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Encomendas pendentes', value: stats.encomendasPendentes, icon: Package, color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Encomendas este mês', value: stats.encomendasMes, icon: Package, color: 'bg-green-500/10 text-green-600' },
        { label: 'Avisos (7 dias)', value: stats.avisosRecentes, icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600' },
        { label: 'Faturas vencidas', value: stats.faturasVencidas, icon: AlertTriangle, color: 'bg-red-500/10 text-red-600' },
        { label: 'Faturas pagas', value: stats.faturasPagas, icon: TrendingUp, color: 'bg-green-500/10 text-green-600' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Relatórios</h1>
                    <p className="text-slate-500 text-sm mt-1">Visão geral do condomínio</p>
                </div>
                <button
                    onClick={exportarExcel}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary/90"
                >
                    <Download size={16} /> Exportar Excel
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c) => (
                    <div key={c.label} className="bg-surface rounded-2xl border border-card-border p-6">
                        <div className={`size-12 rounded-xl ${c.color} flex items-center justify-center mb-4`}>
                            <c.icon size={24} />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{c.value}</p>
                        <p className="text-slate-500 text-xs font-bold uppercase">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface rounded-2xl border border-card-border p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><PieChart size={20} className="text-primary" /> Reservas por área</h3>
                    {reservasPorArea.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhuma reserva no mês</p>
                    ) : (
                        <div className="space-y-2">
                            {reservasPorArea.map((r) => (
                                <div key={r.name} className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{r.name}</span>
                                    <span className="text-sm font-bold text-primary">{r.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-surface rounded-2xl border border-card-border p-6">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-primary" /> Encomendas por mês</h3>
                    {encomendasPorMes.length === 0 ? (
                        <p className="text-slate-500 text-sm">Nenhum dado</p>
                    ) : (
                        <div className="space-y-2">
                            {encomendasPorMes.map((e) => (
                                <div key={e.mes} className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{e.mes}</span>
                                    <span className="text-sm font-bold text-primary">{e.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

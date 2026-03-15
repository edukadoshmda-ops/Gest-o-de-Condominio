import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import * as XLSX from 'xlsx'
import {
    PartyPopper,
    Dumbbell,
    Droplets,
    Car,
    Clock,
    ChevronRight,
    Info,
    CalendarDays,
    X,
    Loader2,
    Trash2,
    Download
} from 'lucide-react'

const AreaCard = ({ icon: Icon, title, status, color, onClick }) => (
    <div onClick={onClick} className="bg-surface rounded-3xl border border-card-border p-6 hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-3 ${color} text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg ring-1 ring-white/10`}>
            {status}
        </div>
        <div className={`theme-icon-box size-14 rounded-2xl bg-slate-100 border border-card-border flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors`}>
            <Icon className="text-primary group-hover:scale-110 transition-transform" size={28} />
        </div>
        <h3 className="text-slate-900 text-lg font-bold mb-2">{title}</h3>
        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">Consulte horários disponíveis e regras de uso desta área.</p>
        <button className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest group/btn">
            Reservar Agora <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
    </div>
)

export const Reservas = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [reservas, setReservas] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedArea, setSelectedArea] = useState(null)
    const [saving, setSaving] = useState(false)
    const [cancelingId, setCancelingId] = useState(null)
    const [activeView, setActiveView] = useState('espacos') // espacos | minhas

    const [formData, setFormData] = useState({
        data: '',
        horario: '10:00 - 18:00'
    })

    const areas = [
        { id: '1', icon: PartyPopper, title: "Salão de Festas", status: "Disponível", color: "bg-green-500" },
        { id: '2', icon: Droplets, title: "Piscina Adulto", status: "Disponível", color: "bg-green-500" },
        { id: '3', icon: Car, title: "Lavagem de Carro", status: "Disponível", color: "bg-green-500" },
        { id: '4', icon: Dumbbell, title: "Academia Fitness", status: "Livre", color: "bg-blue-500" },
        { id: '5', icon: CalendarDays, title: "Churrasqueira 01", status: "Ocupado", color: "bg-red-500" },
        { id: '6', icon: Info, title: "Espaço Gourmet", status: "Disponível", color: "bg-green-500" }
    ]

    useEffect(() => {
        if (userProfile?.condominio_id) {
            fetchReservas()
        } else {
            setLoading(false)
        }
    }, [userProfile?.condominio_id])

    const fetchReservas = async () => {
        if (!userProfile?.condominio_id) return

        setLoading(true)
        try {
            let query = supabase
                .from('reservas')
                .select('*')
                .eq('condominio_id', userProfile.condominio_id)
                .order('data', { ascending: true })

            // Se for morador comum, exibe apenas as dele na aba "Minhas Reservas"
            // Se quiser que todos vejam as de todos (tipo um mural de ocupação), remova o filtro abaixo
            if (userProfile.tipo === 'morador') {
                query = query.eq('morador_id', session?.user?.id)
            }

            const { data, error } = await query

            if (error) throw error
            setReservas(data || [])
        } catch (error) {
            console.error('Erro ao buscar reservas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (area) => {
        setSelectedArea(area)
        setShowModal(true)
    }

    const handleCancelarReserva = async (reserva) => {
        if (!confirm('Deseja realmente cancelar esta reserva?')) return
        setCancelingId(reserva.id)
        try {
            const { error } = await supabase.from('reservas').delete().eq('id', reserva.id)
            if (error) throw error
            setReservas(prev => prev.filter(r => r.id !== reserva.id))
            toast('Reserva cancelada com sucesso.', 'success')
        } catch (e) {
            console.error(e)
            toast(e?.message || 'Erro ao cancelar reserva.', 'error')
        } finally {
            setCancelingId(null)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.data || !selectedArea) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('reservas')
                .insert([
                    {
                        area_nome: selectedArea.title,
                        data: formData.data,
                        horario: formData.horario,
                        status: 'Confirmada',
                        morador_id: session?.user?.id,
                        condominio_id: userProfile?.condominio_id
                    }
                ])

            if (error) throw error

            setShowModal(false)
            setFormData({ data: '', horario: '10:00 - 18:00' })
            fetchReservas()
            setActiveView('minhas') // Muda para a aba de "Minhas Reservas" após criar
        } catch (error) {
            console.error('Erro ao salvar reserva:', error)
            toast(`Falha ao criar reserva: ${error.message || 'Verifique sua conexão.'}`, 'error')
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-')
        return { day, month: getMonthName(month) }
    }

    const exportarExcel = () => {
        try {
            const dados = reservas.map(r => ({ Área: r.area_nome, Data: r.data, Horário: r.horario, Status: r.status }))
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), 'Reservas')
            XLSX.writeFile(wb, `reservas-${new Date().toISOString().slice(0, 10)}.xlsx`)
            toast('Planilha exportada!', 'success')
        } catch (e) {
            toast('Erro ao exportar: ' + (e?.message || 'Tente novamente.'), 'error')
        }
    }

    const getMonthName = (monthNum) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return months[parseInt(monthNum, 10) - 1]
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div>
                    <h2 className="text-slate-900 text-2xl font-black tracking-tight mb-2">Áreas Comuns</h2>
                    <p className="text-slate-500 text-sm font-medium">Selecione o espaço que deseja reservar.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportarExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20">
                        <Download size={16} /> Exportar Excel
                    </button>
                <div className="flex bg-surface p-1 rounded-2xl border border-card-border w-fit">
                    <button
                        onClick={() => setActiveView('espacos')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeView === 'espacos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Espaços
                    </button>
                    <button
                        onClick={() => setActiveView('minhas')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${activeView === 'minhas' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Minhas Reservas
                        {reservas.length > 0 && (
                            <span className="bg-white/20 text-slate-900 px-1.5 py-0.5 rounded-lg text-[8px]">{reservas.length}</span>
                        )}
                    </button>
                </div>
                </div>
            </div>

            {activeView === 'espacos' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map((area) => (
                        <AreaCard
                            key={area.id}
                            icon={area.icon}
                            title={area.title}
                            status={area.status}
                            color={area.color}
                            onClick={() => handleOpenModal(area)}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <Loader2 className="animate-spin text-primary mb-4" size={32} />
                            <p className="text-sm font-medium">Carregando reservas...</p>
                        </div>
                    ) : reservas.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 bg-surface border border-card-border border-dashed rounded-3xl">
                            <CalendarDays size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Você ainda não possui nenhuma reserva.</p>
                            <button onClick={() => setActiveView('espacos')} className="mt-4 text-primary text-xs font-bold uppercase tracking-widest">Fazer uma reserva</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservas.map((reserva) => {
                                const { day, month } = formatDate(reserva.data)
                                return (
                                    <div key={reserva.id} className="bg-surface rounded-3xl border border-card-border p-6 flex flex-col items-center text-center group hover:border-primary/40 transition-all relative">
                                        <button
                                            onClick={() => handleCancelarReserva(reserva)}
                                            disabled={cancelingId === reserva.id}
                                            title="Cancelar reserva"
                                            className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                        >
                                            {cancelingId === reserva.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                        </button>
                                        <div className="text-center bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 mb-6">
                                            <p className="text-primary text-4xl font-black">{day}</p>
                                            <p className="text-primary text-xs font-black uppercase tracking-widest">{month}</p>
                                        </div>
                                        <h3 className="text-slate-900 font-bold text-lg mb-2">{reserva.area_nome}</h3>
                                        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-6 bg-background py-2 px-4 rounded-xl w-full border border-card-border">
                                            <Clock size={12} className="text-primary" /> {reserva.horario}
                                        </div>
                                        <span className="text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">{reserva.status}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Reserva */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white hover:bg-white/5 transition-all">
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <div className={`size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4`}>
                                {selectedArea && <selectedArea.icon className="text-primary" size={32} />}
                            </div>
                            <h3 className="text-slate-900 text-2xl font-black tracking-tight mb-1">Reservar Área</h3>
                            <p className="text-primary text-sm font-bold">{selectedArea?.title}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data da Reserva</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.data}
                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Horário Disponível</label>
                                <select
                                    value={formData.horario}
                                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none appearance-none transition-all"
                                >
                                    <option value="10:00 - 18:00">10:00 - 18:00 (Período Diurno)</option>
                                    <option value="18:00 - 23:00">18:00 - 23:00 (Período Noturno)</option>
                                    <option value="08:00 - 12:00">08:00 - 12:00 (Manhã)</option>
                                </select>
                            </div>

                            <button type="submit" disabled={saving} className="w-full pt-4">
                                <div className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Reserva'}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

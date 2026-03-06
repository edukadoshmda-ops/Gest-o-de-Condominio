import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, MessageSquare, Calendar, Wrench } from 'lucide-react'

export const Busca = ({ searchTerm, session, userProfile, setActiveTab }) => {
    const [resultados, setResultados] = useState({ mural: [], reservas: [], chamados: [] })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!searchTerm?.trim()) {
            setResultados({ mural: [], reservas: [], chamados: [] })
            return
        }
        const term = searchTerm.trim().toLowerCase()
        setLoading(true)

        const fetchAll = async () => {
            try {
                const cid = userProfile?.condominio_id

                let muralQ = supabase.from('mural').select('id, conteudo, autor, created_at').order('created_at', { ascending: false }).limit(50)
                if (cid) muralQ = muralQ.eq('condominio_id', cid)
                const { data: muralData } = await muralQ

                let reservasQ = supabase.from('reservas').select('id, area_nome, data, horario, status').order('data', { ascending: false }).limit(50)
                if (cid) reservasQ = reservasQ.eq('condominio_id', cid)
                const { data: reservasData } = await reservasQ

                let chamadosQ = supabase.from('chamados').select('id, titulo, descricao, categoria, status, morador_id').order('created_at', { ascending: false }).limit(50)
                if (cid) chamadosQ = chamadosQ.eq('condominio_id', cid)
                const { data: chamadosRaw } = await chamadosQ

                let chamadosList = chamadosRaw || []
                if (userProfile?.tipo === 'morador') chamadosList = chamadosList.filter(c => c.morador_id === session?.user?.id)

                setResultados({
                    mural: (muralData || []).filter(p => (p.conteudo || '').toLowerCase().includes(term) || (p.autor || '').toLowerCase().includes(term)),
                    reservas: (reservasData || []).filter(r => (r.area_nome || '').toLowerCase().includes(term)),
                    chamados: chamadosList.filter(c => (c.titulo || '').toLowerCase().includes(term) || (c.descricao || '').toLowerCase().includes(term) || (c.categoria || '').toLowerCase().includes(term))
                })
            } catch (err) {
                console.error('Erro na busca:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchAll()
    }, [searchTerm, userProfile?.condominio_id, userProfile?.tipo, session?.user?.id])

    const total = resultados.mural.length + resultados.reservas.length + resultados.chamados.length

    if (!searchTerm?.trim()) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-center">Digite um termo na busca para encontrar publicações, reservas e chamados.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Resultados da busca</h2>
                <p className="text-slate-500 text-sm">Buscando por &quot;{searchTerm}&quot;</p>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">Buscando...</div>
            ) : total === 0 ? (
                <div className="py-20 text-center text-slate-500 font-bold">Nenhum resultado encontrado.</div>
            ) : (
                <div className="space-y-8">
                    {resultados.mural.length > 0 && (
                        <section>
                            <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                                <MessageSquare size={20} className="text-primary" /> Mural ({resultados.mural.length})
                            </h3>
                            <div className="space-y-3">
                                {resultados.mural.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveTab?.('mural')}
                                        className="w-full text-left p-4 rounded-2xl border border-card-border bg-surface hover:border-primary/40 transition-all"
                                    >
                                        <p className="text-slate-900 font-semibold line-clamp-2">{p.conteudo}</p>
                                        <p className="text-slate-500 text-xs mt-1">{p.autor} • {new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {resultados.reservas.length > 0 && (
                        <section>
                            <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                                <Calendar size={20} className="text-primary" /> Reservas ({resultados.reservas.length})
                            </h3>
                            <div className="space-y-3">
                                {resultados.reservas.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setActiveTab?.('reservas')}
                                        className="w-full text-left p-4 rounded-2xl border border-card-border bg-surface hover:border-primary/40 transition-all"
                                    >
                                        <p className="text-slate-900 font-semibold">{r.area_nome}</p>
                                        <p className="text-slate-500 text-xs mt-1">{r.data} • {r.horario} • {r.status}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {resultados.chamados.length > 0 && (
                        <section>
                            <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                                <Wrench size={20} className="text-primary" /> Chamados ({resultados.chamados.length})
                            </h3>
                            <div className="space-y-3">
                                {resultados.chamados.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveTab?.('chamados')}
                                        className="w-full text-left p-4 rounded-2xl border border-card-border bg-surface hover:border-primary/40 transition-all"
                                    >
                                        <p className="text-slate-900 font-semibold">{c.titulo}</p>
                                        <p className="text-slate-500 text-xs mt-1">{c.categoria} • {c.status}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

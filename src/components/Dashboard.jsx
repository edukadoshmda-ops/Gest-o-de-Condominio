import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PostCard } from './Mural'
import { useToast } from '../lib/toast'
import {
    Plus,
    Droplets,
    PartyPopper,
    Trash2,
    Dumbbell,
    Mail,
    MoreVertical,
    ThumbsUp,
    MessageSquare,
    ChevronRight,
    Package,
    CheckCircle2,
    X,
    Loader2,
    Calendar,
    FileText
} from 'lucide-react'

const ActionButton = ({ icon: Icon, label, color = 'text-slate-600', bg = 'bg-surface', border = 'border-card-border', onClick }) => (
    <div className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer" onClick={onClick}>
        <div className={`size-16 rounded-2xl border ${border} ${bg} flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(236,91,19,0.15)] transition-all duration-300`}>
            <Icon className={`${color} group-hover:scale-110 transition-transform`} size={24} />
        </div>
        <span className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase tracking-wider group-hover:text-slate-700 transition-colors">{label}</span>
    </div>
)

export const Dashboard = ({ session, userProfile, setActiveTab }) => {
    const { toast } = useToast()
    const [posts, setPosts] = useState([])
    const [aviso, setAviso] = useState(null)
    const [enquete, setEnquete] = useState(null)
    const [encomenda, setEncomenda] = useState(null)
    const [loading, setLoading] = useState(true)
    const [voting, setVoting] = useState(false)
    const [selectedOption, setSelectedOption] = useState(null)
    const [hasVoted, setHasVoted] = useState(false)
    const [showNoticeModal, setShowNoticeModal] = useState(false)
    const [selectedNotice, setSelectedNotice] = useState(null)
    const [updatingDelivery, setUpdatingDelivery] = useState(false)
    const [showTrashModal, setShowTrashModal] = useState(false)
    const [showAguaModal, setShowAguaModal] = useState(false)
    const [trashSchedule, setTrashSchedule] = useState(localStorage.getItem('trash_schedule') || 'Segunda, Quarta e Sexta às 08:00')
    const [tempTrashSchedule, setTempTrashSchedule] = useState('')
    const [showNovoAvisoModal, setShowNovoAvisoModal] = useState(false)
    const [showNovaEnqueteModal, setShowNovaEnqueteModal] = useState(false)
    const [novoAviso, setNovoAviso] = useState({ titulo: '', descricao: '', tag: 'OFICIAL' })
    const [novaEnquete, setNovaEnquete] = useState({ titulo: '', opcoes: ['', '', ''] })
    const [savingAviso, setSavingAviso] = useState(false)
    const [savingEnquete, setSavingEnquete] = useState(false)
    const [indicadoresSindico, setIndicadoresSindico] = useState({ reservas: 0, encomendasPendentes: 0, faturasVencidas: 0, avisos: 0 })

    const isSindico = userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master'

    useEffect(() => {
        if (userProfile) {
            fetchAllData()
        }
    }, [userProfile, session])

    useEffect(() => {
        if (enquete?.id) {
            const voted = localStorage.getItem(`voted_poll_${enquete.id}`)
            if (voted === 'true') setHasVoted(true)
        }
    }, [enquete?.id])

    useEffect(() => {
        if (enquete?.id && session?.user?.id) {
            supabase.from('enquete_votos').select('id').eq('enquete_id', enquete.id).eq('user_id', session.user.id).maybeSingle()
                .then(({ data }) => { if (data) setHasVoted(true) })
        }
    }, [enquete?.id, session?.user?.id])

    const handleSaveTrash = () => {
        localStorage.setItem('trash_schedule', tempTrashSchedule)
        setTrashSchedule(tempTrashSchedule)
        setShowTrashModal(false)
    }

    const fetchIndicadoresSindico = async () => {
        if (!isSindico || !userProfile?.condominio_id) return
        try {
            const condo = userProfile.condominio_id
            const inicioMes = new Date()
            inicioMes.setDate(1)
            inicioMes.setHours(0, 0, 0, 0)
            const [r, e, f, a] = await Promise.all([
                supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('condominio_id', condo).gte('data', inicioMes.toISOString().slice(0, 10)),
                supabase.from('encomendas').select('*', { count: 'exact', head: true }).eq('condominio_id', condo).eq('status', 'Pendente'),
                supabase.from('faturas').select('*', { count: 'exact', head: true }).eq('condominio_id', condo).eq('status', 'Vencido'),
                supabase.from('avisos').select('*', { count: 'exact', head: true }).eq('condominio_id', condo).gte('created_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString()),
            ])
            setIndicadoresSindico({
                reservas: r.count ?? 0,
                encomendasPendentes: e.count ?? 0,
                faturasVencidas: f.count ?? 0,
                avisos: a.count ?? 0,
            })
        } catch (e) { console.error(e) }
    }

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchPosts(),
                fetchAviso(),
                fetchEnquete(),
                fetchEncomenda(),
                fetchIndicadoresSindico()
            ])
        } finally {
            setLoading(false)
        }
    }

    const fetchPosts = async () => {
        try {
            let query = supabase.from('mural').select('*').order('created_at', { ascending: false }).limit(3)
            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }
            const { data, error } = await query
            if (!error) setPosts(data || [])
        } catch (error) { console.error('Erro mural:', error) }
    }

    const fetchAviso = async () => {
        try {
            let query = supabase.from('avisos').select('*').order('created_at', { ascending: false }).limit(1)
            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }
            const { data, error } = await query
            if (!error && data && data.length > 0) setAviso(data[0])
            else setAviso(null)
        } catch (error) { console.error('Erro avisos:', error) }
    }

    const fetchEnquete = async () => {
        try {
            let query = supabase.from('enquetes').select('*').eq('ativa', true).order('created_at', { ascending: false }).limit(1)
            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }
            const { data, error } = await query
            // Se as opções forem string JSON, fazer parse. Assumindo JSONB ou array no Supabase.
            if (!error && data && data.length > 0) setEnquete(data[0])
        } catch (error) { console.error('Erro enquetes:', error) }
    }

    const fetchEncomenda = async () => {
        try {
            let query = supabase.from('encomendas').select('*').eq('status', 'Pendente').order('created_at', { ascending: false }).limit(1)
            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }
            const { data, error } = await query
            if (!error && data && data.length > 0) setEncomenda(data[0])
            else setEncomenda(null)
        } catch (error) { console.error('Erro encomendas:', error) }
    }

    const handleVote = async () => {
        if (selectedOption === null || hasVoted || voting) return

        setVoting(true)
        try {
            const currentEnquete = enquete || enqueteDisplay
            const opcoesAtual = currentEnquete.opcoes || []
            const novasOpcoes = opcoesAtual.map((opt, i) => {
                const votes = typeof opt.votes === 'number' ? opt.votes : (opt.value ?? 0)
                if (i === selectedOption) {
                    return { ...opt, label: opt.label, votes: votes + 1 }
                }
                return { ...opt, label: opt.label, votes }
            })

            if (enquete?.id && session?.user?.id) {
                const { error: errVoto } = await supabase.from('enquete_votos').insert({
                    enquete_id: enquete.id,
                    user_id: session.user.id,
                    opcao_index: selectedOption
                })
                if (errVoto) throw errVoto

                const { error } = await supabase
                    .from('enquetes')
                    .update({ opcoes: novasOpcoes })
                    .eq('id', enquete.id)
                if (error) throw error
                setEnquete({ ...enquete, opcoes: novasOpcoes })
            }
            setHasVoted(true)
            localStorage.setItem(`voted_poll_${enquete?.id || 'default'}`, 'true')
            toast('Voto registrado!', 'success')
        } catch (error) {
            console.error('Erro ao votar:', error)
            if (error?.code === '23505') setHasVoted(true)
            else toast('Erro ao registrar voto.', 'error')
        } finally {
            setVoting(false)
        }
    }

    const handleMarkAsReceived = async () => {
        if (!encomenda || updatingDelivery) return

        setUpdatingDelivery(true)
        try {
            const { error } = await supabase
                .from('encomendas')
                .update({ status: 'Entregue' })
                .eq('id', encomenda.id)

            if (error) throw error
            setEncomenda(null)
            toast('Encomenda marcada como recebida!', 'success')
        } catch (error) {
            console.error('Erro ao atualizar encomenda:', error)
            toast('Erro ao atualizar status.', 'error')
        } finally {
            setUpdatingDelivery(false)
        }
    }

    const handleLikePost = async (postId, count) => {
        try {
            const { error } = await supabase.from('mural').update({ curtidas: count }).eq('id', postId)
            if (!error) {
                setPosts(posts.map(p => p.id === postId ? { ...p, curtidas: count } : p))
            }
        } catch (error) { console.error('Error liking:', error) }
    }

    const handleDeletePost = async (postId) => {
        try {
            const { error } = await supabase.from('mural').delete().eq('id', postId)
            if (!error) {
                setPosts(posts.filter(p => p.id !== postId))
            }
        } catch (error) { console.error('Error deleting:', error) }
    }

    const handleOpenNotice = (avisoData) => {
        setSelectedNotice(avisoData)
        setShowNoticeModal(true)
    }

    const handleCriarAviso = async () => {
        if (!novoAviso.titulo.trim() || !novoAviso.descricao.trim() || !userProfile?.condominio_id) {
            toast('Preencha título e descrição.', 'error')
            return
        }
        setSavingAviso(true)
        try {
            const { error } = await supabase.from('avisos').insert({
                condominio_id: userProfile.condominio_id,
                titulo: novoAviso.titulo.trim(),
                descricao: novoAviso.descricao.trim(),
                tag: novoAviso.tag || 'OFICIAL',
            })
            if (error) throw error
            toast('Aviso publicado!', 'success')
            setShowNovoAvisoModal(false)
            setNovoAviso({ titulo: '', descricao: '', tag: 'OFICIAL' })
            fetchAviso()
        } catch (e) {
            console.error(e)
            toast(e?.message || 'Erro ao publicar aviso.', 'error')
        } finally {
            setSavingAviso(false)
        }
    }

    const handleCriarEnquete = async () => {
        const labels = novaEnquete.opcoes.filter(s => String(s).trim())
        if (!novaEnquete.titulo.trim() || labels.length < 2) {
            toast('Preencha o título e pelo menos 2 opções.', 'error')
            return
        }
        if (!userProfile?.condominio_id) {
            toast('Condomínio não identificado.', 'error')
            return
        }
        setSavingEnquete(true)
        try {
            const opcoes = labels.map(label => ({ label: label.trim(), votes: 0 }))
            const { error } = await supabase.from('enquetes').insert({
                condominio_id: userProfile.condominio_id,
                titulo: novaEnquete.titulo.trim(),
                opcoes,
                ativa: true,
            })
            if (error) throw error
            toast('Enquete criada!', 'success')
            setShowNovaEnqueteModal(false)
            setNovaEnquete({ titulo: '', opcoes: ['', '', ''] })
            fetchEnquete()
        } catch (e) {
            console.error(e)
            toast(e?.message || 'Erro ao criar enquete.', 'error')
        } finally {
            setSavingEnquete(false)
        }
    }

    const formatTimeAgo = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'Agora mesmo'
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} min`
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} horas`
        return `Há ${Math.floor(diffInSeconds / 86400)} dias`
    }

    const avisoDisplay = aviso || (isSindico ? null : {
        tag: 'OFICIAL',
        titulo: 'Nenhum aviso no momento',
        descricao: 'Avisos do síndico aparecerão aqui.',
        created_at: new Date().toISOString()
    })

    const enqueteDisplay = enquete || (isSindico ? null : {
        titulo: 'Nenhuma enquete ativa',
        opcoes: []
    })

    const coresOpcoes = ['bg-primary', 'bg-primary/85', 'bg-primary/70', 'bg-primary/55', 'bg-primary/45']
    const opcoesComPct = (opcoes = []) => {
        const total = opcoes.reduce((s, o) => s + (o.votes ?? o.value ?? 0), 0)
        return opcoes.map((o, i) => ({
            ...o,
            value: total ? Math.round(((o.votes ?? o.value ?? 0) / total) * 100) : 0,
            color: o.color || coresOpcoes[i % coresOpcoes.length]
        }))
    }

    const encomendaDisplay = encomenda

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {isSindico && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div onClick={() => setActiveTab('reservas')} className="bg-surface rounded-2xl border border-card-border p-4 cursor-pointer hover:border-primary/40 transition-all">
                        <Calendar size={24} className="text-primary mb-2" />
                        <p className="text-2xl font-black text-slate-900">{indicadoresSindico.reservas}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Reservas (mês)</p>
                    </div>
                    <div onClick={() => setActiveTab('encomendas')} className="bg-surface rounded-2xl border border-card-border p-4 cursor-pointer hover:border-primary/40 transition-all">
                        <Package size={24} className="text-amber-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{indicadoresSindico.encomendasPendentes}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Encomendas pendentes</p>
                    </div>
                    <div onClick={() => setActiveTab('financeiro')} className="bg-surface rounded-2xl border border-card-border p-4 cursor-pointer hover:border-primary/40 transition-all">
                        <FileText size={24} className="text-red-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{indicadoresSindico.faturasVencidas}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Faturas vencidas</p>
                    </div>
                    <div onClick={() => setActiveTab('mural')} className="bg-surface rounded-2xl border border-card-border p-4 cursor-pointer hover:border-primary/40 transition-all">
                        <Mail size={24} className="text-orange-500 mb-2" />
                        <p className="text-2xl font-black text-slate-900">{indicadoresSindico.avisos}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase">Avisos (7 dias)</p>
                    </div>
                </div>
            )}
            {/* Quick Actions */}
            <section className="overflow-x-auto no-scrollbar flex gap-5 pb-2 -mx-2 px-2">
                <ActionButton icon={Plus} label="Novo" border="border-dashed border-slate-600" onClick={() => setActiveTab('mural')} title="Nova Ação" />
                <ActionButton icon={Package} label="Pacotes" color="text-amber-400" bg="bg-amber-400/10" onClick={() => setActiveTab('encomendas')} />
                <ActionButton icon={Droplets} label="Água" color="text-blue-400" bg="bg-blue-400/10" onClick={() => setShowAguaModal(true)} />
                <ActionButton icon={PartyPopper} label="Salão" color="text-purple-400" bg="bg-purple-400/10" onClick={() => setActiveTab('reservas')} />
                <ActionButton icon={Trash2} label="Lixo" color="text-green-400" bg="bg-green-400/10" onClick={() => { setTempTrashSchedule(trashSchedule); setShowTrashModal(true); }} />
                <ActionButton icon={Dumbbell} label="Academia" color="text-primary" bg="bg-primary/10" onClick={() => setActiveTab('reservas')} />
                <ActionButton icon={Mail} label="Avisos" color="text-yellow-400" bg="bg-yellow-400/10" onClick={() => setActiveTab('mural')} />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Notices/Social */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Featured Notice - Aviso do Síndico */}
                    {avisoDisplay ? (
                        <div className="group bg-surface rounded-3xl border border-card-border overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48 shadow-2xl hover:border-primary/30 transition-all duration-500">
                            <div className="w-full sm:w-48 bg-slate-100/50 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-card-border py-8 sm:py-0 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative">
                                    <Droplets className="text-primary/80 group-hover:scale-110 transition-transform duration-500" size={56} />
                                </div>
                            </div>
                            <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                                <div>
                                    <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Aviso do Síndico</span>
                                    <h3 className="text-slate-900 text-xl font-bold mb-2 group-hover:text-primary transition-colors">{avisoDisplay.titulo}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        {avisoDisplay.descricao}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-4 border-t border-card-border/50 pt-4">
                                    <span className="text-slate-500 text-xs font-medium italic">{aviso ? formatTimeAgo(avisoDisplay.created_at) : '—'}</span>
                                    <div className="flex items-center gap-2">
                                        {isSindico && aviso && (
                                            <button onClick={() => { setShowNovoAvisoModal(true) }} className="text-slate-500 text-xs font-bold hover:text-primary">NOVO AVISO</button>
                                        )}
                                        <button
                                            onClick={() => handleOpenNotice(avisoDisplay)}
                                            className="text-primary text-xs font-black flex items-center gap-1 group/btn"
                                        >
                                            VER DETALHES <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isSindico ? (
                        <div className="bg-surface rounded-3xl border border-dashed border-card-border p-8 flex flex-col items-center justify-center min-h-[12rem]">
                            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Aviso do Síndico</span>
                            <p className="text-slate-600 text-sm text-center mb-4">Nenhum aviso publicado. Publique o primeiro aviso oficial.</p>
                            <button onClick={() => setShowNovoAvisoModal(true)} className="py-3 px-6 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                NOVO AVISO
                            </button>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-3xl border border-card-border p-6">
                            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block">Aviso do Síndico</span>
                            <p className="text-slate-600 text-sm">Nenhum aviso no momento.</p>
                        </div>
                    )}

                    {/* Social Feed */}
                    <div className="space-y-5">
                        <div className="flex items-end justify-between px-1">
                            <h2 className="text-slate-900 text-lg font-bold tracking-tight">Mural da Comunidade</h2>
                            <button
                                onClick={() => setActiveTab('mural')}
                                className="text-slate-500 text-xs hover:text-slate-900 font-semibold flex items-center gap-1 group"
                            >
                                Ver tudo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8 bg-surface rounded-3xl border border-card-border">
                                <Loader2 className="animate-spin text-primary" size={24} />
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 bg-surface border border-card-border border-dashed rounded-3xl">
                                <p>Nenhuma publicação recente no mural.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        postId={post.id}
                                        author={post.autor || 'Usuário'}
                                        time={formatTimeAgo(post.created_at)}
                                        content={post.conteudo}
                                        likes={post.curtidas || 0}
                                        comments={post.comentarios || 0}
                                        images={post.imagens}
                                        onLike={handleLikePost}
                                        onDelete={handleDeletePost}
                                        canDelete={userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'sindico' || post.autor === (userProfile?.nome || session?.user?.email)}
                                        onComment={() => toast('Comentários serão exibidos aqui em breve.', 'info')}
                                        onShare={() => toast('Link copiado para a área de transferência!', 'success')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Mini Widgets */}
                <div className="space-y-8">
                    <div className="bg-surface rounded-3xl border border-card-border p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-3xl"></div>
                        <div className="flex items-center justify-between mb-6 relative">
                            <h3 className="text-slate-900 font-bold text-sm tracking-widest uppercase">Enquete Ativa</h3>
                            {enquete && <span className="bg-primary text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-primary/20">NOVO</span>}
                            {isSindico && (
                                <button onClick={() => setShowNovaEnqueteModal(true)} className="text-primary text-[10px] font-black uppercase tracking-wider hover:underline">
                                    {enquete ? 'NOVA ENQUETE' : 'CRIAR ENQUETE'}
                                </button>
                            )}
                        </div>
                        {enqueteDisplay ? (
                            <>
                                <p className="text-slate-900 text-sm font-bold mb-6 leading-snug">{enqueteDisplay.titulo}</p>
                                <div className="space-y-5 relative">
                                    {opcoesComPct(enqueteDisplay.opcoes || []).map((opt, i) => (
                                        <div
                                            key={i}
                                            className={`group/opt cursor-pointer p-2 -m-2 rounded-xl transition-all ${selectedOption === i ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                                            onClick={() => !hasVoted && setSelectedOption(i)}
                                        >
                                            <div className="flex justify-between text-[11px] mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`size-3 rounded-full border-2 transition-all ${selectedOption === i ? 'border-primary bg-primary' : 'border-slate-300 bg-slate-100'}`}></div>
                                                    <span className={`${selectedOption === i ? 'text-primary' : 'text-slate-600'} group-hover/opt:text-slate-900 transition-colors font-semibold uppercase`}>
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                <span className="text-slate-900 font-bold">{opt.value}%</span>
                                            </div>
                                            <div className={`h-1.5 w-full bg-background rounded-full overflow-hidden border ${selectedOption === i ? 'border-primary/30' : 'border-card-border'}`}>
                                                <div
                                                    className={`${opt.color || 'bg-primary'} h-full transition-all duration-1000 ease-out`}
                                                    style={{ width: `${opt.value}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    disabled={selectedOption === null || voting || hasVoted}
                                    onClick={handleVote}
                                    className={`w-full mt-8 py-3.5 rounded-2xl text-[10px] font-black transition-all uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 ${hasVoted
                                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-none cursor-default'
                                        : 'bg-primary text-white hover:bg-white hover:text-primary shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    {voting ? (
                                        <Loader2 className="animate-spin" size={14} />
                                    ) : hasVoted ? (
                                        <>
                                            <CheckCircle2 size={14} /> Voto Computado
                                        </>
                                    ) : (
                                        'VOTAR AGORA'
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="py-4">
                                <p className="text-slate-600 text-sm mb-4">Nenhuma enquete ativa no momento.</p>
                                {isSindico && (
                                    <button onClick={() => setShowNovaEnqueteModal(true)} className="w-full py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        CRIAR ENQUETE
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Delivery Alert */}
                    <div className="bg-surface rounded-3xl border border-card-border p-6 md:p-8 flex items-center gap-5 hover:border-primary/30 transition-all group relative overflow-hidden">
                        <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Package className="text-primary" size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-slate-900 font-bold text-base">Encomenda!</h3>
                                <span className="text-[10px] text-slate-500 font-bold font-mono">
                                    {encomendaDisplay ? new Date(encomendaDisplay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                            </div>
                            <p className="text-slate-600 text-xs font-medium leading-tight">
                                {encomendaDisplay ? `Chegou um volume para você na ${encomendaDisplay.local}.` : 'Nenhuma encomenda pendente no momento.'}
                            </p>
                            {encomendaDisplay && (
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="bg-background px-2 py-0.5 rounded-lg border border-card-border text-[9px] font-mono font-black text-slate-600">{encomendaDisplay.codigo}</span>
                                    <button
                                        disabled={updatingDelivery}
                                        onClick={handleMarkAsReceived}
                                        className="text-[9px] font-black text-primary hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                        {updatingDelivery ? <Loader2 className="animate-spin" size={10} /> : <CheckCircle2 size={12} />} RECEBI!
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notice Modal */}
            {showNoticeModal && selectedNotice && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-2xl rounded-[40px] border border-card-border p-8 md:p-12 animate-in zoom-in-95 duration-300 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowNoticeModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white transition-all">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">{selectedNotice.tag || 'OFICIAL'}</span>
                            <span className="text-slate-500 text-xs font-bold">{selectedNotice.created_at ? formatTimeAgo(selectedNotice.created_at) : '—'}</span>
                        </div>
                        <h2 className="text-slate-900 text-3xl font-black mb-6 tracking-tight leading-tight">{selectedNotice.titulo}</h2>
                        <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap mb-8">
                            {selectedNotice.descricao}
                        </div>
                        <button
                            onClick={() => setShowNoticeModal(false)}
                            className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                            FECHAR AVISO
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Novo Aviso (síndico) */}
            {showNovoAvisoModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-lg rounded-[40px] border border-card-border p-8 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                        <button onClick={() => setShowNovoAvisoModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        <h2 className="text-slate-900 text-xl font-black mb-6">Novo Aviso do Síndico</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Título</label>
                                <input
                                    value={novoAviso.titulo}
                                    onChange={e => setNovoAviso(a => ({ ...a, titulo: e.target.value }))}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 font-medium"
                                    placeholder="Ex: Manutenção de reservatórios"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Descrição</label>
                                <textarea
                                    value={novoAviso.descricao}
                                    onChange={e => setNovoAviso(a => ({ ...a, descricao: e.target.value }))}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 font-medium min-h-[120px]"
                                    placeholder="Texto completo do aviso..."
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Tag (opcional)</label>
                                <input
                                    value={novoAviso.tag}
                                    onChange={e => setNovoAviso(a => ({ ...a, tag: e.target.value }))}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 font-medium"
                                    placeholder="OFICIAL"
                                />
                            </div>
                        </div>
                        <button
                            disabled={savingAviso}
                            onClick={handleCriarAviso}
                            className="w-full mt-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {savingAviso ? <Loader2 className="animate-spin" size={16} /> : 'PUBLICAR AVISO'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Nova Enquete (síndico) */}
            {showNovaEnqueteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-lg rounded-[40px] border border-card-border p-8 animate-in zoom-in-95 duration-300 relative shadow-2xl overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowNovaEnqueteModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        <h2 className="text-slate-900 text-xl font-black mb-6">Nova Enquete</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-600 text-xs font-bold uppercase mb-1">Pergunta / Título</label>
                                <input
                                    value={novaEnquete.titulo}
                                    onChange={e => setNovaEnquete(n => ({ ...n, titulo: e.target.value }))}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 font-medium"
                                    placeholder="Ex: Revitalização da fachada: qual cor?"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-xs font-bold uppercase mb-2">Opções (mín. 2)</label>
                                {novaEnquete.opcoes.map((op, i) => (
                                    <input
                                        key={i}
                                        value={op}
                                        onChange={e => {
                                            const arr = [...novaEnquete.opcoes]
                                            arr[i] = e.target.value
                                            setNovaEnquete(n => ({ ...n, opcoes: arr }))
                                        }}
                                        className="w-full bg-background border border-card-border rounded-xl px-4 py-2.5 text-slate-900 font-medium mb-2"
                                        placeholder={`Opção ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <button
                            disabled={savingEnquete}
                            onClick={handleCriarEnquete}
                            className="w-full mt-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {savingEnquete ? <Loader2 className="animate-spin" size={16} /> : 'CRIAR ENQUETE'}
                        </button>
                    </div>
                </div>
            )}

            {/* Água - Consumo Modal */}
            {showAguaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 animate-in zoom-in-95 duration-300 shadow-2xl relative">
                        <button onClick={() => setShowAguaModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-16 rounded-2xl bg-blue-400/10 flex items-center justify-center border border-blue-400/20">
                                <Droplets className="text-blue-500" size={32} />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-bold text-lg">Consumo de Água</h3>
                                <p className="text-slate-500 text-xs">Medição do hidrômetro do condomínio</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-background rounded-2xl p-6 border border-card-border">
                                <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Fevereiro 2026</p>
                                <p className="text-slate-900 text-3xl font-black">12 m³</p>
                                <p className="text-slate-500 text-xs mt-1">Consumo médio por unidade</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background rounded-xl p-4 border border-card-border">
                                    <p className="text-slate-500 text-[10px] font-bold">Meta</p>
                                    <p className="text-slate-900 font-bold">15 m³</p>
                                </div>
                                <div className="bg-background rounded-xl p-4 border border-card-border">
                                    <p className="text-slate-500 text-[10px] font-bold">Economia</p>
                                    <p className="text-green-500 font-bold">20%</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowAguaModal(false)} className="w-full mt-6 py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase">Fechar</button>
                    </div>
                </div>
            )}


            {/* Trash Schedule Modal */}
            {showTrashModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-[40px] border border-card-border p-8 md:p-10 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                        <button onClick={() => setShowTrashModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white transition-all">
                            <X size={20} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="size-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <Trash2 className="text-green-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Coleta de Lixo</h2>
                            <p className="text-slate-600 text-sm font-medium">Horários e dias da coleta no condomínio.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-background/50 p-6 rounded-3xl border border-card-border">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Escala Atual</label>
                                <textarea
                                    value={tempTrashSchedule}
                                    onChange={(e) => setTempTrashSchedule(e.target.value)}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[100px]"
                                    placeholder="Ex: Segunda, Quarta e Sexta às 08:00"
                                />
                            </div>

                            <button
                                onClick={handleSaveTrash}
                                className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                            >
                                SALVAR ALTERAÇÕES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}



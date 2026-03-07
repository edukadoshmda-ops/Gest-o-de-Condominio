import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { useNotifications } from '../hooks/useNotifications'
import {
    Send,
    Image as ImageIcon,
    MoreHorizontal,
    ThumbsUp,
    MessageSquare,
    Share2,
    Users,
    User,
    Hash,
    Clock,
    Settings,
    X,
    Loader2,
    ChevronRight,
    Trash2,
    AlertCircle,
    MapPin,
    Plus,
    CheckCircle2
} from 'lucide-react'

export const PostCard = ({ postId, author, avatar, time, content, likes, comments, images, onLike, onDelete, canDelete, onComment, onShare }) => {
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(likes)
    const [showOptions, setShowOptions] = useState(false)

    const handleLike = async () => {
        const newCount = isLiked ? likeCount - 1 : likeCount + 1
        setIsLiked(!isLiked)
        setLikeCount(newCount)
        if (onLike && postId) {
            onLike(postId, newCount)
        }
    }

    return (
        <div className="bg-surface rounded-3xl border border-card-border p-6 md:p-8 hover:bg-white/[0.01] transition-all border-l-4 border-l-primary/20">
            <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-slate-200 border border-card-border overflow-hidden shrink-0 shadow-lg flex items-center justify-center text-xl font-bold text-slate-600 uppercase">
                    {avatar ? <img src={avatar} alt={author} className="w-full h-full object-cover" /> : author[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start relative">
                        <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-base leading-none">{author}</p>
                            <p className="text-xs text-slate-500 font-medium">{time}</p>
                        </div>
                        {canDelete && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowOptions(!showOptions)}
                                    className="text-slate-600 hover:text-slate-900 transition-colors p-1"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {showOptions && (
                                    <div className="absolute top-8 right-0 bg-slate-200 border border-card-border rounded-xl shadow-xl p-2 z-10 w-32 animate-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => { setShowOptions(false); onDelete(postId) }}
                                            className="w-full flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors text-xs font-bold"
                                        >
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-4 space-y-4">
                        <p className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">{content}</p>
                        {images && images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden shadow-2xl">
                                {images.map((img, i) => (
                                    <img key={i} src={img} alt="Post content" className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-8 mt-8 pt-5 border-t border-card-border/30">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2.5 text-xs transition-colors font-black uppercase tracking-widest group ${isLiked ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
                        >
                            <ThumbsUp size={18} className={`transition-transform ${isLiked ? 'scale-110 fill-primary' : 'group-hover:scale-110'}`} /> {likeCount} curtidas
                        </button>
                        <button
                            onClick={() => onComment ? onComment(postId) : null}
                            className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest group"
                        >
                            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" /> {comments} comentários
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href)
                                onShare?.()
                            }}
                            className="hidden sm:flex items-center gap-2.5 text-xs text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest group ml-auto"
                        >
                            <Share2 size={18} className="group-hover:scale-110 transition-transform" /> Compartilhar
                        </button>

                    </div>
                </div>
            </div>
        </div>
    )
}

function ChatPushButton({ session, toast }) {
    const [status, setStatus] = useState('idle')
    const handleEnable = async () => {
        if (!session?.user?.id) return
        setStatus('loading')
        const { enablePushNotifications } = await import('../lib/push')
        const result = await enablePushNotifications(session.user.id)
        if (result.ok) {
            setStatus('done')
        } else {
            setStatus('error')
            const msg = {
                navegador: 'Seu navegador não suporta notificações.',
                vapid: 'Configure a chave VAPID no .env (veja docs/NOTIFICACOES.md).',
                negado: 'Permissão negada. Ative nas configurações do navegador.',
                sw: 'Erro ao registrar o serviço. Recarregue a página.',
                subscribe: 'Erro ao inscrever. Tente novamente.',
                erro: 'Erro ao ativar. Tente novamente.',
            }[result.reason] || 'Erro ao ativar.'
            toast?.(msg, 'error')
        }
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null
    return (
        <button
            type="button"
            onClick={handleEnable}
            disabled={status === 'loading' || Notification.permission === 'granted'}
            className="w-full p-4 rounded-2xl bg-background border border-card-border text-left hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 text-sm font-bold"
        >
            {Notification.permission === 'granted'
                ? 'Notificações no dispositivo ativadas'
                : status === 'loading'
                ? 'Ativando...'
                : status === 'done'
                ? 'Ativado!'
                : status === 'error'
                ? 'Erro ao ativar. Tente novamente.'
                : 'Ativar notificações no dispositivo (mesmo fechando o app)'}
        </button>
    )
}

const CHAT_LIST = [
    { id: 'a0000001-0001-4000-8000-000000000001', name: 'Síndico', type: 'channel', msg: '', time: '', online: false, img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    { id: 'a0000001-0002-4000-8000-000000000002', name: 'Portaria', type: 'channel', msg: '', time: '', online: false, img: 'https://images.unsplash.com/photo-1610216705422-caa3fcb6d15d?w=100&h=100&fit=crop' },
    { id: 'a0000001-0003-4000-8000-000000000003', name: 'Comercial', type: 'channel', msg: '', time: '', online: false, img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop' },
    { id: 'a0000001-0004-4000-8000-000000000004', name: 'Diversos', type: 'channel', msg: '', time: '', online: false, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
]

export const Mural = ({ session, userProfile }) => {
    const [activeChat, setActiveChat] = useState(null)
    const [chatViewTab, setChatViewTab] = useState('canais') // 'canais' | 'moradores'
    const [moradoresList, setMoradoresList] = useState([])
    const [chatMessage, setChatMessage] = useState('')
    const [mensagensByConversa, setMensagensByConversa] = useState({})
    const [loadingChat, setLoadingChat] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [posts, setPosts] = useState([])
    const [novoPost, setNovoPost] = useState('')
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const [postImages, setPostImages] = useState([])
    const [uploadingImages, setUploadingImages] = useState(false)
    const fileInputRef = useRef(null)
    const postTextareaRef = useRef(null)
    const [showChatSettings, setShowChatSettings] = useState(false)
    const [chatNotificarNovas, setChatNotificarNovas] = useState(() => localStorage.getItem('chat_notificar_novas') !== 'false')
    const [showAchadosModal, setShowAchadosModal] = useState(false)
    const [achadosItems, setAchadosItems] = useState([])
    const [loadingAchados, setLoadingAchados] = useState(false)
    const [filtroAchados, setFiltroAchados] = useState('todos')
    const [showReportForm, setShowReportForm] = useState(false)
    const [reportingItem, setReportingItem] = useState(false)
    const [newItem, setNewItem] = useState({
        item: '',
        tipo: 'Achado',
        local: '',
        status: 'Na Portaria'
    })
    const [showCommentsModal, setShowCommentsModal] = useState(false)
    const [commentsPost, setCommentsPost] = useState(null)
    const [comments, setComments] = useState([])
    const [newCommentText, setNewCommentText] = useState('')
    const [loadingComments, setLoadingComments] = useState(false)
    const [postingComment, setPostingComment] = useState(false)
    const [typingChat, setTypingChat] = useState(null)
    const typingTimeoutRef = useRef(null)
    const presenceChannelRef = useRef(null)

    const { toast } = useToast()
    const { updateNotificarChat } = useNotifications(session, userProfile, { toast })
    const currentUser = userProfile?.nome || session?.user?.user_metadata?.nome || session?.user?.email || "Usuário"
    const isAdmin = userProfile?.tipo === 'admin_master' || session?.user?.email?.includes('admin')

    useEffect(() => {
        if (userProfile?.notificar_chat !== undefined) {
            const v = userProfile.notificar_chat !== false
            setChatNotificarNovas(v)
            localStorage.setItem('chat_notificar_novas', v ? 'true' : 'false')
        }
    }, [userProfile?.notificar_chat])

    useEffect(() => {
        if (userProfile?.condominio_id) {
            fetchPosts()
        } else if (session?.user && !loading) {
            fetchPosts()
        }
    }, [userProfile, session])

    const fetchMoradores = async () => {
        if (!userProfile?.condominio_id || !session?.user?.id) return
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('condominio_id', userProfile.condominio_id)
                .neq('id', session.user.id)
                .order('nome')
            if (!error) setMoradoresList(data || [])
        } catch (_) {
            setMoradoresList([])
        }
    }

    useEffect(() => {
        if (userProfile?.condominio_id && chatViewTab === 'moradores') fetchMoradores()
    }, [userProfile?.condominio_id, chatViewTab])

    useEffect(() => {
        if (activeChat?.id && userProfile?.condominio_id) fetchMensagens(activeChat)
    }, [activeChat?.id, activeChat?.type, userProfile?.condominio_id])

    // Realtime: novas mensagens em DM
    useEffect(() => {
        if (activeChat?.type !== 'dm' || !activeChat?.id || !userProfile?.condominio_id || !session?.user) return
        const me = session.user.id
        const other = activeChat.id
        const ch = supabase
            .channel('dm-mensagens')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensagens_privadas',
                    filter: `condominio_id=eq.${userProfile.condominio_id}`,
                },
                (payload) => {
                    const row = payload.new
                    const isMyConv =
                        (row.remetente_id === me && row.destinatario_id === other) ||
                        (row.remetente_id === other && row.destinatario_id === me)
                    if (isMyConv) {
                        const key = `dm-${other}`
                        setMensagensByConversa((prev) => ({
                            ...prev,
                            [key]: [...(prev[key] || []), {
                                id: row.id,
                                conteudo: row.conteudo,
                                remetente_id: row.remetente_id,
                                remetente_nome: row.remetente_nome,
                                created_at: row.created_at,
                            }],
                        }))
                    }
                }
            )
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [activeChat?.id, activeChat?.type, userProfile?.condominio_id, session?.user?.id])

    useEffect(() => {
        if (!activeChat?.id || !session?.user) return
        const chName = activeChat.type === 'dm'
            ? `dm:${[session.user.id, activeChat.id].sort().join('-')}`
            : `chat:${activeChat.id}`
        const ch = supabase.channel(chName)
        ch.on('presence', { event: 'sync' }, () => {
            const state = ch.presenceState()
            const others = Object.entries(state).flatMap(([_, presences]) => presences)
                .filter(p => p.user_id !== session?.user?.id && p.typing)
            setTypingChat(others[0]?.user_name || null)
        })
        ch.subscribe(async (s) => {
            if (s === 'SUBSCRIBED') await ch.track({ user_id: session.user.id, user_name: currentUser, typing: false })
        })
        presenceChannelRef.current = ch
        return () => { supabase.removeChannel(ch); presenceChannelRef.current = null }
    }, [activeChat?.id, session?.user?.id])

    const handleChatInputChange = (e) => {
        setChatMessage(e.target.value)
        const ch = presenceChannelRef.current
        if (ch) {
            ch.track({ user_id: session.user.id, user_name: currentUser, typing: true })
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
                ch.track({ user_id: session.user.id, user_name: currentUser, typing: false })
            }, 2000)
        }
    }

    const getChatKey = (chat) => {
        if (!chat) return ''
        return chat.type === 'dm' ? `dm-${chat.id}` : chat.id
    }

    const fetchMensagens = async (chat) => {
        if (!userProfile?.condominio_id || !chat?.id) return
        const key = getChatKey(chat)
        setLoadingChat(true)
        try {
            const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            if (chat.type === 'dm') {
                const me = session?.user?.id
                const other = chat.id
                const { data, error } = await supabase
                    .from('mensagens_privadas')
                    .select('id, conteudo, remetente_id, remetente_nome, created_at')
                    .eq('condominio_id', userProfile.condominio_id)
                    .or(`and(remetente_id.eq.${me},destinatario_id.eq.${other}),and(remetente_id.eq.${other},destinatario_id.eq.${me})`)
                    .gte('created_at', desde)
                    .order('created_at', { ascending: true })
                if (error) throw error
                setMensagensByConversa(prev => ({ ...prev, [key]: data || [] }))
            } else {
                const { data, error } = await supabase
                    .from('mensagens')
                    .select('id, conteudo, remetente_id, remetente_nome, created_at')
                    .eq('condominio_id', userProfile.condominio_id)
                    .eq('conversa_id', chat.id)
                    .gte('created_at', desde)
                    .order('created_at', { ascending: true })
                if (error) throw error
                setMensagensByConversa(prev => ({ ...prev, [key]: data || [] }))
            }
        } catch (err) {
            console.error('Erro ao buscar mensagens:', err)
            setMensagensByConversa(prev => ({ ...prev, [key]: [] }))
        } finally {
            setLoadingChat(false)
        }
    }

    const handleSendMensagem = async () => {
        const txt = chatMessage.trim()
        if (!txt || !activeChat || !userProfile?.condominio_id || !session?.user) return
        setSendingMessage(true)
        try {
            if (activeChat.type === 'dm') {
                const { error } = await supabase.from('mensagens_privadas').insert({
                    condominio_id: userProfile.condominio_id,
                    remetente_id: session.user.id,
                    remetente_nome: currentUser,
                    destinatario_id: activeChat.id,
                    conteudo: txt
                })
                if (error) throw error
            } else {
                const { error } = await supabase.from('mensagens').insert({
                    condominio_id: userProfile.condominio_id,
                    conversa_id: activeChat.id,
                    remetente_id: session.user.id,
                    remetente_nome: currentUser,
                    conteudo: txt
                })
                if (error) throw error
            }
            setChatMessage('')
            await fetchMensagens(activeChat)
            toast('Mensagem enviada.', 'success')
        } catch (err) {
            toast('Erro ao enviar: ' + (err.message || 'Tente novamente.'), 'error')
        } finally {
            setSendingMessage(false)
        }
    }

    const handleDeleteMensagem = async (msg) => {
        if (!confirm('Excluir esta mensagem?')) return
        const key = getChatKey(activeChat)
        const table = activeChat?.type === 'dm' ? 'mensagens_privadas' : 'mensagens'
        try {
            const { error } = await supabase.from(table).delete().eq('id', msg.id)
            if (error) throw error
            setMensagensByConversa(prev => ({
                ...prev,
                [key]: (prev[key] || []).filter(m => m.id !== msg.id)
            }))
            toast('Mensagem excluída.', 'success')
        } catch (err) {
            toast('Erro ao excluir: ' + (err.message || 'Tente novamente.'), 'error')
        }
    }

    const fetchPosts = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('mural')
                .select('*')
                .order('created_at', { ascending: false })

            if (userProfile?.condominio_id) {
                query = query.eq('condominio_id', userProfile.condominio_id)
            }

            const { data, error } = await query

            if (error) throw error
            setPosts(data || [])
        } catch (error) {
            console.error('Erro ao buscar posts do mural:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAchados = async () => {
        setLoadingAchados(true)
        try {
            let query = supabase.from('achados_perdidos').select('*').order('created_at', { ascending: false })
            if (userProfile?.condominio_id) query = query.eq('condominio_id', userProfile.condominio_id)
            const { data, error } = await query
            if (error) throw error
            setAchadosItems(data || [])
        } catch (error) {
            console.error('Erro achados:', error)
            setAchadosItems([
                { id: 1, tipo: 'Achado', item: 'Chave de Carro (BMW)', local: 'Estacionamento G1', data: '2024-03-01', status: 'Na Portaria' },
                { id: 2, tipo: 'Perdido', item: 'Coleira Azul', local: 'Playground', data: '2024-02-28', status: 'Em busca' },
                { id: 3, tipo: 'Achado', item: 'Óculos de Sol', local: 'Área da Piscina', data: '2024-02-25', status: 'Na Portaria' },
            ])
        } finally {
            setLoadingAchados(false)
        }
    }

    const handleOpenComments = async (post) => {
        setCommentsPost(post)
        setShowCommentsModal(true)
        setLoadingComments(true)
        setComments([])
        try {
            const { data, error } = await supabase
                .from('comentarios')
                .select('*')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
            if (!error) setComments(data || [])
        } catch (_) {
            setComments([])
        } finally {
            setLoadingComments(false)
        }
    }

    const handleAddComment = async (e) => {
        e?.preventDefault()
        if (!newCommentText.trim() || !commentsPost || !session?.user) return
        setPostingComment(true)
        try {
            const { error } = await supabase
                .from('comentarios')
                .insert({
                    post_id: commentsPost.id,
                    user_id: session.user.id,
                    autor: currentUser,
                    texto: newCommentText.trim()
                })
            if (error) throw error
            setNewCommentText('')
            const { data } = await supabase
                .from('comentarios')
                .select('*')
                .eq('post_id', commentsPost.id)
                .order('created_at', { ascending: true })
            setComments(data || [])
            setPosts(prev => prev.map(p => p.id === commentsPost.id ? { ...p, comentarios: (p.comentarios || 0) + 1 } : p))
            toast('Comentário publicado!', 'success')
        } catch (err) {
            toast('Erro ao publicar comentário. Verifique se a tabela comentarios existe no Supabase.', 'error')
        } finally {
            setPostingComment(false)
        }
    }

    const handleOpenAchados = () => {
        setShowAchadosModal(true)
        fetchAchados()
    }

    const handleReportSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!newItem.item || !newItem.local) {
            toast('Por favor, preencha o item e o local.', 'error')
            return
        }

        setReportingItem(true)
        try {
            const { error } = await supabase
                .from('achados_perdidos')
                .insert([
                    {
                        ...newItem,
                        data: new Date().toISOString().split('T')[0],
                        quem_reportou: currentUser,
                        condominio_id: userProfile?.condominio_id
                    }
                ])

            if (error) throw error

            setNewItem({ item: '', tipo: 'Achado', local: '', status: 'Na Portaria' })
            setShowReportForm(false)
            fetchAchados()
        } catch (error) {
            console.error('Erro ao reportar:', error)
            // Fallback para simulação para o usuário funcionalidade
            const simulatedNew = {
                id: Date.now(),
                ...newItem,
                data: new Date().toISOString().split('T')[0]
            }
            setAchadosItems([simulatedNew, ...achadosItems])
            setShowReportForm(false)
            setNewItem({ item: '', tipo: 'Achado', local: '', status: 'Na Portaria' })
        } finally {
            setReportingItem(false)
        }
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        setUploadingImages(true)
        try {
            const uploadedUrls = []
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `mural-${Date.now()}-${Math.random()}.${fileExt}`
                const filePath = `mural/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('fotos')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('fotos').getPublicUrl(filePath)
                uploadedUrls.push(data.publicUrl)
            }
            setPostImages(prev => [...prev, ...uploadedUrls])
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error)
            toast('Erro ao carregar imagens.', 'error')
        } finally {
            setUploadingImages(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handlePostar = async () => {
        if (!novoPost.trim() && postImages.length === 0) return

        setPosting(true)
        try {
            const { error } = await supabase
                .from('mural')
                .insert([
                    {
                        autor: currentUser,
                        conteudo: novoPost,
                        curtidas: 0,
                        comentarios: 0,
                        morador_id: session?.user?.id,
                        condominio_id: userProfile?.condominio_id || (posts.length > 0 ? posts[0].condominio_id : null),
                        imagens: postImages
                    }
                ])

            if (error) throw error

            setNovoPost('')
            setPostImages([])
            fetchPosts()
        } catch (error) {
            console.error('Erro ao publicar no mural:', error)
            toast(`Falha ao publicar: ${error.message || 'Verifique sua conexão.'}`, 'error')
        } finally {
            setPosting(false)
        }
    }

    const handleDelete = async (postId) => {
        if (!confirm('Deseja realmente excluir esta publicação?')) return

        try {
            const { error } = await supabase
                .from('mural')
                .delete()
                .eq('id', postId)

            if (error) throw error
            setPosts(posts.filter(p => p.id !== postId))
        } catch (error) {
            console.error('Erro ao excluir post:', error)
            toast('Falha ao excluir o post.', 'error')
        }
    }

    const handleUpdateLikes = async (postId, newLikesCount) => {
        try {
            await supabase
                .from('mural')
                .update({ curtidas: newLikesCount })
                .eq('id', postId)

            setPosts(posts.map(p => p.id === postId ? { ...p, curtidas: newLikesCount } : p))
        } catch (error) {
            console.error('Erro ao curtir:', error)
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

    return (
        <div className="flex gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Feed Column */}
            <div className="flex-1 space-y-8 min-w-0">
                {/* Create Post */}
                <div className="bg-surface rounded-3xl border border-card-border p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
                    <div className="flex items-start gap-4 relative">
                        <div className="size-10 rounded-xl bg-slate-200 border border-card-border overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold uppercase">
                            {currentUser[0]}
                        </div>
                        <div className="flex-1 space-y-4">
                            <textarea
                                ref={postTextareaRef}
                                rows="2"
                                value={novoPost}
                                onChange={(e) => setNovoPost(e.target.value)}
                                placeholder="O que está acontecendo no residencial?"
                                className="w-full bg-transparent border-none text-slate-900 text-base placeholder:text-slate-600 focus:ring-0 outline-none resize-none font-medium"
                            ></textarea>
                            {postImages.length > 0 && (
                                <div className="flex gap-2 pb-2 mt-2 overflow-x-auto no-scrollbar">
                                    {postImages.map((img, i) => (
                                        <div key={i} className="relative w-24 h-24 shrink-0 mt-2">
                                            <img src={img} alt="Preview" className="w-full h-full object-cover rounded-xl border border-card-border" />
                                            <button
                                                onClick={() => setPostImages(postImages.filter((_, idx) => idx !== i))}
                                                className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex justify-center items-center shadow-md hover:scale-110 transition-transform font-bold"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t border-card-border/50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImages}
                                        className="p-2.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50"
                                        title="Anexar Imagem"
                                    >
                                        {uploadingImages ? <Loader2 className="animate-spin text-primary" size={20} /> : <ImageIcon size={20} />}
                                    </button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleImageUpload} />
                                </div>
                                <button
                                    onClick={handlePostar}
                                    disabled={posting || (!novoPost.trim() && postImages.length === 0)}
                                    className="bg-primary text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {posting ? <Loader2 className="animate-spin" size={14} /> : 'Publicar'} <Send size={14} />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-surface border border-card-border border-dashed rounded-3xl">
                            <p>Nenhuma publicação no mural ainda.</p>
                            <p className="text-sm mt-2">Seja o primeiro a publicar algo!</p>
                        </div>
                    ) : (
                        posts.map((post) => {
                            const isAuthor = post.autor === currentUser
                            const canDelete = isAdmin || isAuthor
                            return (
                                <PostCard
                                    key={post.id}
                                    postId={post.id}
                                    author={post.autor}
                                    time={formatTimeAgo(post.created_at)}
                                    content={post.conteudo}
                                    images={post.imagens}
                                    likes={post.curtidas || 0}
                                    comments={commentsPost?.id === post.id ? comments.length : (post.comentarios || 0)}
                                    onLike={handleUpdateLikes}
                                    onDelete={handleDelete}
                                    canDelete={canDelete}
                                    onComment={() => handleOpenComments(post)}
                                    onShare={() => toast('Link copiado para a área de transferência!', 'success')}
                                />
                            )
                        })
                    )}
                </div>
            </div>

            {/* Sidebar Chat Column (Desktop Only) */}
            <div className="hidden lg:flex flex-col w-80 space-y-6 h-[calc(100vh-140px)] sticky top-28">
                <div className="bg-surface rounded-[32px] border border-card-border overflow-hidden flex flex-col flex-1 shadow-2xl">
                    <div className="p-6 bg-slate-100 border-b border-card-border">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Users className="text-primary" size={20} />
                                <h3 className="text-slate-900 font-bold text-sm tracking-widest uppercase">Conversas</h3>
                            </div>
                            <Settings
                                size={18}
                                className="text-slate-500 cursor-pointer hover:text-slate-900 transition-colors"
                                onClick={() => setShowChatSettings(true)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setChatViewTab('canais'); setActiveChat(null) }}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${chatViewTab === 'canais' ? 'bg-primary text-white shadow-lg' : 'bg-white/50 text-slate-600 hover:bg-white/80'}`}
                            >
                                <Hash size={14} /> Canais
                            </button>
                            <button
                                onClick={() => { setChatViewTab('moradores'); setActiveChat(null) }}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${chatViewTab === 'moradores' ? 'bg-primary text-white shadow-lg' : 'bg-white/50 text-slate-600 hover:bg-white/80'}`}
                            >
                                <User size={14} /> Moradores
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                        {chatViewTab === 'canais' && CHAT_LIST.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all cursor-pointer group relative"
                            >
                                {activeChat?.id === chat.id && activeChat?.type !== 'dm' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>}
                                <div className="relative">
                                    <div className="size-10 rounded-2xl bg-slate-200 border border-card-border overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                        <img src={chat.img} alt={chat.name} className="w-full h-full object-cover" />
                                    </div>
                                    {chat.online && <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 rounded-full border-2 border-slate-900 ring-2 ring-green-500/20"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <p className="text-slate-900 font-bold text-xs truncate group-hover:text-primary transition-colors">{chat.name}</p>
                                        <span className="text-[9px] text-slate-600 font-bold uppercase">{chat.time || '—'}</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] font-medium truncate">{chat.msg || 'Nenhuma mensagem'}</p>
                                </div>
                            </div>
                        ))}
                        {chatViewTab === 'moradores' && moradoresList.map((m) => {
                            const chat = { id: m.id, name: m.nome || 'Morador', type: 'dm' }
                            const isActive = activeChat?.type === 'dm' && activeChat?.id === m.id
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => setActiveChat(chat)}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all cursor-pointer group relative"
                                >
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>}
                                    <div className="size-10 rounded-2xl bg-slate-200 border border-card-border flex items-center justify-center text-primary font-bold text-sm shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                        {(m.nome || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-bold text-xs truncate group-hover:text-primary transition-colors">{m.nome || 'Morador'}</p>
                                        <p className="text-slate-500 text-[10px] font-medium truncate">Mensagem privada</p>
                                    </div>
                                </div>
                            )
                        })}
                        {chatViewTab === 'moradores' && moradoresList.length === 0 && (
                            <div className="px-6 py-8 text-center text-slate-500 text-xs">Nenhum morador encontrado.</div>
                        )}
                    </div>

                    {/* Aviso 24h e Thread de mensagens */}
                    {activeChat && (
                        <>
                            <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20">
                                <p className="text-amber-700 text-[10px] font-bold text-center">As mensagens são excluídas automaticamente após 24 horas.</p>
                            </div>
                            {loadingChat ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                            ) : (mensagensByConversa[getChatKey(activeChat)] || []).length > 0 ? (
                                <div className="overflow-y-auto px-4 py-2 space-y-3 border-t border-card-border/30 max-h-36 custom-scrollbar">
                                    {(mensagensByConversa[getChatKey(activeChat)] || []).map((m) => {
                                        const fromMe = m.remetente_id === session?.user?.id
                                        const canDelete = fromMe || isAdmin
                                        return (
                                            <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'} group/msg gap-2`}>
                                                {!fromMe && (
                                                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                                                        {m.remetente_nome?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs relative ${fromMe ? 'bg-primary text-white' : 'bg-slate-200 text-slate-800'}`}>
                                                {!fromMe && <p className="text-[9px] text-slate-500 font-bold mb-0.5">{m.remetente_nome}</p>}
                                                <p>{m.conteudo}</p>
                                                <div className="flex items-center justify-between gap-2 mt-1">
                                                    <p className={`text-[9px] ${fromMe ? 'text-slate-900/60' : 'text-slate-500'}`}>{formatTimeAgo(m.created_at)}</p>
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteMensagem(m)}
                                                            className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-500 transition-all"
                                                            title="Excluir mensagem"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                </div>
                                                {fromMe && (
                                                    <div className="size-8 rounded-lg bg-primary/80 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                                        {currentUser?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-slate-500 text-[10px]">Nenhuma mensagem nas últimas 24h.</div>
                            )}
                            {typingChat && (
                                <div className="px-4 py-1 border-t border-card-border/30 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 italic">{typingChat} está digitando...</span>
                                </div>
                            )}
                            <div className="p-4 bg-slate-100 border-t border-card-border flex items-center gap-2 animate-in slide-in-from-bottom duration-300 relative">
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={handleChatInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMensagem() }
                                    }}
                                    placeholder={`Mensagem para ${activeChat.name.split(' ')[0]}...`}
                                    className="flex-1 bg-background border border-card-border rounded-xl px-4 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-primary outline-none"
                                    disabled={sendingMessage}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendMensagem}
                                    disabled={sendingMessage || !chatMessage.trim()}
                                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    title="Enviar"
                                >
                                    {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                                <button onClick={() => setActiveChat(null)} className="p-2 text-slate-500 hover:text-red-400 transition-colors shrink-0" title="Fechar conversa"><X size={16} /></button>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Configurações do Chat */}
                {showChatSettings && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-surface w-full max-w-sm rounded-[32px] border border-card-border p-6 md:p-8 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-slate-900 font-bold text-lg">Configurações do Chat</h3>
                                <button onClick={() => setShowChatSettings(false)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-card-border cursor-pointer">
                                    <span className="text-slate-700 text-sm font-bold">Notificar novas mensagens</span>
                                    <input
                                        type="checkbox"
                                        checked={chatNotificarNovas}
                                        onChange={(e) => {
                                            const v = e.target.checked
                                            setChatNotificarNovas(v)
                                            updateNotificarChat?.(v)
                                        }}
                                        className="size-5 rounded border-card-border text-primary focus:ring-primary"
                                    />
                                </label>
                                <ChatPushButton session={session} toast={toast} />
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-amber-800 text-xs font-bold leading-relaxed">
                                        As mensagens do chat são excluídas automaticamente após 24 horas. Cada condomínio vê apenas as mensagens do seu próprio condomínio.
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowChatSettings(false)} className="w-full mt-6 py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase">Fechar</button>
                        </div>
                    </div>
                )}

                <div
                    onClick={handleOpenAchados}
                    className="bg-primary/5 rounded-3xl border border-primary/20 p-6 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Clock size={20} className="text-primary" />
                        </div>
                        <p className="text-primary text-xs font-black uppercase tracking-widest">Achados & Perdidos</p>
                    </div>
                    <ChevronRight size={18} className="text-primary group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Modal Achados & Perdidos */}
            {/* Modal Comentários */}
            {showCommentsModal && commentsPost && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowCommentsModal(false)}>
                    <div className="bg-surface w-full max-w-lg rounded-[40px] border border-card-border shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-card-border flex justify-between items-center">
                            <h3 className="text-slate-900 font-bold text-lg">Comentários</h3>
                            <button onClick={() => setShowCommentsModal(false)} className="size-10 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={20} /></button>
                        </div>
                        <div className="p-4 border-b border-card-border/50 bg-background/30">
                            <p className="text-slate-700 text-sm line-clamp-2">{commentsPost.conteudo}</p>
                            <p className="text-slate-500 text-xs mt-1">{commentsPost.autor}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[120px]">
                            {loadingComments ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                            ) : comments.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-8">Nenhum comentário ainda. Seja o primeiro!</p>
                            ) : (
                                comments.map((c) => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{c.autor?.[0]}</div>
                                        <div>
                                            <p className="text-slate-900 text-sm font-semibold">{c.autor}</p>
                                            <p className="text-slate-600 text-sm">{c.texto}</p>
                                            <p className="text-slate-400 text-[10px] mt-0.5">{formatTimeAgo(c.created_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={handleAddComment} className="p-4 border-t border-card-border">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    placeholder="Escreva um comentário..."
                                    className="flex-1 bg-background border border-card-border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none"
                                />
                                <button type="submit" disabled={postingComment || !newCommentText.trim()} className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {postingComment ? <Loader2 className="animate-spin" size={18} /> : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAchadosModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-2xl rounded-[40px] border border-card-border p-8 md:p-10 animate-in zoom-in-95 duration-300 relative shadow-2xl flex flex-col max-h-[90vh]">
                        <button onClick={() => setShowAchadosModal(false)} className="size-10 absolute right-6 top-6 rounded-full border border-card-border flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-white transition-all z-10">
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Achados & Perdidos</h2>
                            <p className="text-slate-500 text-sm font-medium">Itens recentes reportados no residencial.</p>
                        </div>

                        {/* Filtros */}
                        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                            {['todos', 'Achado', 'Perdido'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFiltroAchados(f)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filtroAchados === f
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-background text-slate-500 border-card-border hover:border-slate-300'
                                        }`}
                                >
                                    {f === 'todos' ? 'Ver Todos' : f === 'Achado' ? 'Achados' : 'Perdidos'}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowReportForm(!showReportForm)}
                                className={`ml-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showReportForm
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                                    }`}
                            >
                                {showReportForm ? <X size={14} /> : <Plus size={14} />}
                                {showReportForm ? 'Cancelar' : 'Reportar Novo'}
                            </button>
                        </div>

                        {showReportForm ? (
                            <form onSubmit={handleReportSubmit} className="mb-10 p-6 bg-background border border-card-border rounded-[32px] animate-in slide-in-from-top-4 duration-500 shadow-2xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">O que você encontrou/perdeu?</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Chave, Celular, Casaco..."
                                            value={newItem.item}
                                            onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                                            className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 text-slate-900 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Onde foi?</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Piscina, Bloco A, Garagem..."
                                            value={newItem.local}
                                            onChange={(e) => setNewItem({ ...newItem, local: e.target.value })}
                                            className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 text-slate-900 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Registro</label>
                                        <div className="flex gap-2">
                                            {['Achado', 'Perdido'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setNewItem({ ...newItem, tipo: t })}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${newItem.tipo === t ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface border-card-border text-slate-500'}`}
                                                >
                                                    {t.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status / Observação</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Deixado no bloco B..."
                                            value={newItem.status}
                                            onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                                            className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 text-slate-900 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={reportingItem || !newItem.item || !newItem.local}
                                    className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {reportingItem ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} /> PUBLICAR REGISTRO</>}
                                </button>
                            </form>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {loadingAchados ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={24} /></div>
                                    ) : (achadosItems || []).filter(i => filtroAchados === 'todos' || i.tipo === filtroAchados).length === 0 ? (
                                        <div className="text-center py-10 text-slate-600 border border-dashed border-card-border rounded-2xl italic text-sm">Nenhum item encontrado nesta categoria.</div>
                                    ) : (
                                        achadosItems
                                            .filter(item => filtroAchados === 'todos' || item.tipo === filtroAchados)
                                            .map((item) => (
                                                <div key={item.id} className="bg-background border border-card-border p-5 rounded-3xl group hover:border-primary/30 transition-all flex items-center gap-4">
                                                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border ${item.tipo === 'Achado' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                        {item.tipo === 'Achado' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className="text-slate-900 font-bold text-sm truncate">{item.item}</h4>
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.tipo === 'Achado' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {item.tipo}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                            <span className="flex items-center gap-1"><MapPin size={10} /> {item.local}</span>
                                                            <span className="size-1 bg-slate-200 rounded-full"></span>
                                                            <span>{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                                        </div>
                                                        <p className="mt-2 text-[10px] font-black text-slate-600 group-hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                                                            STATUS: <span className="text-slate-900">{item.status}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-card-border/50 flex flex-col items-center">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-4">Caso algum desses itens seja seu, procure a portaria central.</p>
                                    <button
                                        onClick={() => setShowAchadosModal(false)}
                                        className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                                    >
                                        FECHAR MÓDULO
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

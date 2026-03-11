import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { User, Building, Mail, LogOut, CheckCircle2, Loader2, Save, Camera, Trash2 } from 'lucide-react'

export const Perfil = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef(null)

    // We store profile info in the user_metadata object provided by Supabase Auth
    const [metadata, setMetadata] = useState({
        nome: '',
        unidade: '',
        telefone: '',
        foto_url: ''
    })

    useEffect(() => {
        if (userProfile) {
            setMetadata({
                nome: userProfile.nome || '',
                unidade: userProfile.unidade || '',
                telefone: userProfile.telefone || '',
                foto_url: userProfile.foto_url || ''
            })
        } else if (session?.user?.user_metadata) {
            setMetadata({
                nome: session.user.user_metadata.nome || '',
                unidade: session.user.user_metadata.unidade || '',
                telefone: session.user.user_metadata.telefone || '',
                foto_url: session.user.user_metadata.foto_url || ''
            })
        }
    }, [session, userProfile])

    const persistFotoUrl = async (fotoUrl) => {
        await supabase.auth.updateUser({ data: { ...metadata, foto_url: fotoUrl } })
        await supabase.from('usuarios').update({ foto_url: fotoUrl || null }).eq('id', session.user.id)
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingAvatar(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `avatar-${session.user.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('fotos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('fotos').getPublicUrl(filePath)
            const url = data.publicUrl

            setMetadata(prev => ({ ...prev, foto_url: url }))
            await persistFotoUrl(url)
            toast('Foto atualizada.', 'success')
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error)
            toast('Erro ao carregar a foto de perfil.', 'error')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleRemoverFoto = async () => {
        if (!metadata.foto_url) return
        if (!confirm('Remover foto de perfil?')) return
        setUploadingAvatar(true)
        try {
            setMetadata(prev => ({ ...prev, foto_url: '' }))
            await persistFotoUrl('')
            toast('Foto removida.', 'success')
        } catch (error) {
            toast('Erro ao remover foto.', 'error')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setSaving(true)
        setSuccess(false)

        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    nome: metadata.nome,
                    unidade: metadata.unidade,
                    telefone: metadata.telefone,
                    foto_url: metadata.foto_url
                }
            })

            if (authError) throw authError

            const { error: profileError } = await supabase
                .from('usuarios')
                .update({
                    nome: metadata.nome,
                    unidade: metadata.unidade,
                    telefone: metadata.telefone,
                    foto_url: metadata.foto_url
                })
                .eq('id', session.user.id)

            if (profileError) throw profileError

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error)
            toast('Falha ao atualizar dados.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    const initial = metadata.nome ? metadata.nome[0].toUpperCase() : session?.user?.email[0].toUpperCase()
    const isAdmin = session?.user?.email?.includes('admin') || session?.user?.user_metadata?.role === 'admin'

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Left Side: Avatar Card */}
                <div className="w-full md:w-1/3 bg-surface rounded-3xl border border-card-border p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative mb-6">
                        <div
                            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                            className={`theme-icon-box size-32 rounded-[40px] bg-slate-200 border-4 border-card-border flex items-center justify-center relative z-10 transition-all duration-500 shadow-xl shadow-black/50 overflow-hidden ${!uploadingAvatar && 'cursor-pointer hover:border-primary/50 group'}`}
                        >
                            {uploadingAvatar ? (
                                <Loader2 className="animate-spin text-primary" size={32} />
                            ) : metadata.foto_url ? (
                                <>
                                    <img src={metadata.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={32} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl font-black text-slate-600">{initial}</span>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={32} />
                                    </div>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                        {metadata.foto_url && !uploadingAvatar && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoverFoto(); }}
                                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-red-500 text-white border-2 border-surface flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                                title="Remover foto"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>

                    <h2 className="text-xl font-black text-slate-900 px-2 truncate w-full">{metadata.nome || 'Usuário'}</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        {isAdmin ? 'Síndico / Admin' : 'Condômino'}
                    </p>

                    <button
                        onClick={handleLogout}
                        className="mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-2/3 bg-surface rounded-3xl border border-card-border p-8 relative">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Meus Dados</h3>

                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail (Não editável)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                <input
                                    type="email"
                                    disabled
                                    value={session?.user?.email || ''}
                                    className="w-full bg-background border border-card-border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-500 focus:outline-none opacity-70 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={metadata.nome}
                                    onChange={(e) => setMetadata({ ...metadata, nome: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Ex: Carlos Silva"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unidade / Apto</label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        value={metadata.unidade}
                                        onChange={(e) => setMetadata({ ...metadata, unidade: e.target.value })}
                                        className="w-full bg-background border border-card-border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Torre B - 102"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Telefone</label>
                                <input
                                    type="text"
                                    value={metadata.telefone}
                                    onChange={(e) => setMetadata({ ...metadata, telefone: e.target.value })}
                                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="(11) 90000-0000"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-card-border/50 mt-6 flex items-center justify-between">
                            {success ? (
                                <span className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest">
                                    <CheckCircle2 size={16} /> Salvo com sucesso!
                                </span>
                            ) : <div></div>}

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Salvar Alterações</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

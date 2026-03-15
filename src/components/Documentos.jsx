import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    FileText,
    ScrollText,
    Plus,
    Trash2,
    Download,
    Upload,
    Loader2,
    X
} from 'lucide-react'

const fixUrl = (url) => {
    if (!url || !url.trim()) return null
    const u = url.trim()
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    return 'https://' + u
}

const DocCard = ({ doc, canEdit, onDelete }) => {
    const url = fixUrl(doc.url)
    const downloadFilename = doc.arquivo_nome || `${doc.titulo.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`
    const handleDownload = async () => {
        if (!url) return
        try {
            const res = await fetch(url, { mode: 'cors' })
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = downloadFilename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(blobUrl)
        } catch {
            window.open(url, '_blank')
        }
    }
    const handleOpen = () => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
    }
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-card-border hover:border-primary/20 transition-all group">
            <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {doc.tipo === 'ata' ? (
                        <FileText className="text-primary" size={24} />
                    ) : (
                        <ScrollText className="text-primary" size={24} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{doc.titulo}</p>
                    {doc.descricao && <p className="text-slate-500 text-xs truncate">{doc.descricao}</p>}
                    {!url && <p className="text-slate-400 text-xs mt-0.5">Sem arquivo</p>}
                </div>
                {url && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition"
                            title="Baixar no dispositivo"
                        >
                            <Download size={16} /> Baixar
                        </button>
                        <button
                            onClick={handleOpen}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
                            title="Abrir em nova aba"
                        >
                            Abrir
                        </button>
                    </div>
                )}
            </div>
            {canEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(doc.id) }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition ml-2 shrink-0"
                    title="Remover"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
    )
}

export const Documentos = ({ session, userProfile }) => {
    const { toast } = useToast()
    const [documentos, setDocumentos] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ tipo: 'ata', titulo: '', url: '', descricao: '' })
    const [arquivo, setArquivo] = useState(null)
    const [uploading, setUploading] = useState(false)

    const canEdit = userProfile?.tipo === 'sindico' || userProfile?.tipo === 'admin_master' || userProfile?.tipo === 'superadmin'

    useEffect(() => {
        if (userProfile?.condominio_id) {
            fetchDocs()
        } else {
            setDocumentos([])
            setLoading(false)
        }
    }, [userProfile?.condominio_id])

    const fetchDocs = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('condominio_id', userProfile.condominio_id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setDocumentos(data || [])
        } catch (e) {
            toast('Erro ao carregar documentos.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!form.titulo?.trim()) return
        if (!arquivo && !form.url?.trim()) {
            toast('Envie um arquivo ou informe um link.', 'error')
            return
        }
        if (!userProfile?.condominio_id) {
            toast('Perfil não vinculado a condomínio.', 'error')
            return
        }
        setSaving(true)
        try {
            let urlFinal = form.url?.trim() || null
            let arquivoNome = null

            if (arquivo) {
                setUploading(true)
                const ext = arquivo.name.split('.').pop()
                const fileName = `${userProfile.condominio_id}/${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                const { error: uploadError } = await supabase.storage
                    .from('fotos')
                    .upload(`documentos/${fileName}`, arquivo, { upsert: false })
                if (uploadError) throw uploadError
                const { data } = supabase.storage.from('fotos').getPublicUrl(`documentos/${fileName}`)
                urlFinal = data.publicUrl
                arquivoNome = arquivo.name
                setUploading(false)
            }

            const { error } = await supabase.from('documentos').insert({
                condominio_id: userProfile.condominio_id,
                tipo: form.tipo,
                titulo: form.titulo.trim(),
                url: urlFinal,
                arquivo_nome: arquivoNome,
                descricao: form.descricao?.trim() || null
            })
            if (error) throw error
            setForm({ tipo: 'ata', titulo: '', url: '', descricao: '' })
            setArquivo(null)
            setShowModal(false)
            fetchDocs()
            toast('Documento adicionado.')
        } catch (e) {
            toast(e.message || 'Erro ao adicionar documento.', 'error')
            if (e.message?.includes('Bucket') || e.message?.includes('storage')) {
                toast('Erro no upload. Use link externo ou verifique o bucket "fotos".', 'error')
            }
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Remover este documento?')) return
        try {
            const { error } = await supabase.from('documentos').delete().eq('id', id)
            if (error) throw error
            fetchDocs()
            toast('Documento removido.')
        } catch (e) {
            toast('Erro ao remover.', 'error')
        }
    }

    const atas = documentos.filter(d => d.tipo === 'ata')
    const regulamentos = documentos.filter(d => d.tipo === 'regulamento')

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-300">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-sm font-medium">Carregando...</p>
            </div>
        )
    }

    if (!userProfile?.condominio_id) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-black text-slate-900">Atas e Regulamentos</h1>
                <div className="bg-surface rounded-3xl border border-dashed border-card-border p-8 text-center">
                    <p className="text-slate-600 text-sm">
                        Nenhum condomínio foi vinculado ao seu perfil no momento.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-black text-slate-900">Atas e Regulamentos</h1>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition"
                    >
                        <Plus size={20} /> Adicionar documento
                    </button>
                )}
            </div>

            <section>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                    <FileText className="text-primary" size={22} /> Atas
                </h2>
                <div className="space-y-3">
                    {atas.length === 0 ? (
                        <p className="text-slate-500 text-sm py-6 text-center bg-surface/50 rounded-2xl border border-dashed border-card-border">
                            Nenhuma ata cadastrada. {canEdit && 'Clique em "Adicionar documento" para incluir.'}
                        </p>
                    ) : (
                        atas.map(doc => <DocCard key={doc.id} doc={doc} canEdit={canEdit} onDelete={handleDelete} />)
                    )}
                </div>
            </section>

            <section>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
                    <ScrollText className="text-primary" size={22} /> Regulamentos
                </h2>
                <div className="space-y-3">
                    {regulamentos.length === 0 ? (
                        <p className="text-slate-500 text-sm py-6 text-center bg-surface/50 rounded-2xl border border-dashed border-card-border">
                            Nenhum regulamento cadastrado. {canEdit && 'Clique em "Adicionar documento" para incluir.'}
                        </p>
                    ) : (
                        regulamentos.map(doc => <DocCard key={doc.id} doc={doc} canEdit={canEdit} onDelete={handleDelete} />)
                    )}
                </div>
            </section>

            {showModal && canEdit && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-900">Adicionar documento</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo</label>
                                <select
                                    value={form.tipo}
                                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                                >
                                    <option value="ata">Ata</option>
                                    <option value="regulamento">Regulamento</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.titulo}
                                    onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                    placeholder="Ex: Ata da Assembleia 01/2025"
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Enviar arquivo (PDF, Word)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.odt"
                                    onChange={e => setArquivo(e.target.files?.[0] || null)}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                                />
                                {arquivo && <p className="text-xs text-slate-500 mt-1">{arquivo.name}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ou link externo (opcional)</label>
                                <input
                                    type="url"
                                    value={form.url}
                                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descrição (opcional)</label>
                                <input
                                    type="text"
                                    value={form.descricao}
                                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                                    placeholder="Breve descrição"
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="w-full py-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {(saving || uploading) ? <Loader2 className="animate-spin" size={20} /> : <><Upload size={20} /> Adicionar</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

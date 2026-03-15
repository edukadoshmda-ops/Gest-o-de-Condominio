import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import { KeyRound, Mail, Loader2, Building2, ArrowLeft, Sparkles } from 'lucide-react'

export const Login = ({ onSession, onBack, initialRegistering = false, initialData = null }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState(null)
    const [nome, setNome] = useState('')
    const [nomeCondominio, setNomeCondominio] = useState('')
    const [codigoCondominio, setCodigoCondominio] = useState('')
    const [tipoSelecionado, setTipoSelecionado] = useState('morador')

    useEffect(() => {
        if (!initialData) return
        setNome(initialData.nome || '')
        setEmail(initialData.email || '')
        setNomeCondominio(initialData.nomeCondominio || '')
        setCodigoCondominio(initialData.codigoCondominio || '')
        setTipoSelecionado(initialData.tipo || 'sindico')
        setIsRegistering(initialRegistering)
    }, [initialData, initialRegistering])

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isRegistering) {
                const codigoInformado = codigoCondominio.trim().toUpperCase()
                const nomeInformado = nomeCondominio.trim()

                // 1. Buscar condomínio priorizando o código de acesso
                let condoQuery = supabase
                    .from('condominios')
                    .select('id')

                if (codigoInformado) {
                    condoQuery = condoQuery.eq('codigo_acesso', codigoInformado)
                } else {
                    condoQuery = condoQuery.ilike('nome', nomeInformado)
                }

                const { data: condoData, error: condoError } = await condoQuery.maybeSingle()

                if (condoError || !condoData) {
                    throw new Error("Condomínio não encontrado. Verifique o código ou o nome com o síndico ou na portaria.")
                }

                // 2. Criar conta no Auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nome: nome,
                            tipo: tipoSelecionado,
                            condominio_id: condoData.id
                        }
                    }
                })

                if (authError) {
                    if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('taken')) {
                        throw new Error("Este e-mail já está cadastrado. Tente entrar em vez de criar conta.")
                    }
                    throw authError
                }

                // Se o user veio nulo (Supabase fake success for existing emails)
                if (!authData?.user) {
                    throw new Error("Este e-mail já está cadastrado. Tente entrar em vez de criar conta.")
                }

                if (authData?.user) {
                    // 3. Criar ou atualizar perfil na tabela 'usuarios' usando upsert para evitar erro de duplicidade
                    const { error: profileError } = await supabase
                        .from('usuarios')
                        .upsert({
                            id: authData.user.id,
                            condominio_id: condoData.id,
                            nome: nome,
                            tipo: tipoSelecionado,
                            ativo: true
                        }, { onConflict: 'id' })

                    if (profileError) throw profileError
                }

                toast("Cadastro realizado! Você já pode entrar.", "success")
                setIsRegistering(false)
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                if (data?.user) {
                    // Perfil em usuarios é carregado pelo App.jsx (fetchUserProfile)
                }
            }
        } catch (err) {
            const msg = err.message || ''
            if (msg.toLowerCase().includes('invalid login credentials')) {
                setError('E-mail ou senha incorretos. Confira os dados ou use "Enviar recuperação de senha" no painel do Supabase (Authentication → Users).')
            } else {
                setError(msg || 'Erro na autenticação. Verifique os dados.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-2.5 relative overflow-hidden">
            {/* Background elements - azul suave */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-[22.5rem] bg-white p-5 md:p-5.5 rounded-[26px] border border-slate-200 shadow-2xl relative z-10">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="absolute top-4 left-4 flex items-center gap-1 text-slate-500 hover:text-slate-900 text-[12px] font-medium"
                    >
                        <ArrowLeft size={14} /> Voltar
                    </button>
                )}
                <div className="flex flex-col items-center text-center mb-3">
                    <img src="/logo.png" alt="Gestor360 Logo" className="h-[92px] mb-0.5 object-contain" />
                    <h1 className="text-[1.7rem] font-black text-slate-900 tracking-tight leading-none mb-0.5">
                        {isRegistering ? 'Criar Conta' : 'Gestão de Condominios'}
                    </h1>
                    <p className="text-slate-600 text-[12px] font-medium leading-none">
                        {isRegistering ? 'Cadastre-se para acessar o condomínio.' : 'Entre com suas credenciais para continuar.'}
                    </p>
                </div>

                {initialData?.trialEndsAt && isRegistering && (
                    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-left">
                        <div className="flex items-start gap-2.5">
                            <div className="size-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                                <Sparkles size={14} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sky-700 text-[10px] font-black uppercase tracking-[0.2em]">Teste grátis ativado</p>
                                <p className="text-slate-900 text-[12px] font-bold">Seu período de 30 dias já começou.</p>
                                <p className="text-slate-600 text-[11px]">
                                    Conclua o cadastro do síndico para acessar o condomínio. Validade do teste até {initialData.trialEndsAt}.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-2.5 rounded-xl text-center mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-2.5">
                    {isRegistering && (
                        <>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Condomínio</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={nomeCondominio}
                                        onChange={(e) => setNomeCondominio(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ex: Residencial Solar"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-500 font-medium ml-1">Digite o nome exato do seu condomínio. Em caso de dúvida, consulte o síndico.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Código de Acesso Único</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={codigoCondominio}
                                        onChange={(e) => setCodigoCondominio(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 uppercase"
                                        placeholder="Ex: ABC123"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-500 font-medium ml-1">Informe aqui o código de acesso único para localizar o condomínio mais rápido.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Qual o seu Perfil?</label>
                                <div className="relative">
                                    <select
                                        value={tipoSelecionado}
                                        onChange={(e) => setTipoSelecionado(e.target.value)}
                                        disabled={!!initialData?.trialEndsAt}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="morador">Morador</option>
                                        <option value="porteiro">Funcionário (Portaria/Limpeza)</option>
                                        <option value="sindico">Síndico (Gestor)</option>
                                    </select>
                                </div>
                                {initialData?.trialEndsAt && (
                                    <p className="text-[9px] text-slate-500 font-medium ml-1">No teste grátis, o primeiro cadastro é criado como síndico responsável.</p>
                                )}
                            </div>
                        </>
                    )}

                            <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-[12px] text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full pt-2 group"
                    >
                        <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:shadow-sky-600/40 group-hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin" size={15} /> : (isRegistering ? 'Criar Cadastro' : 'Acessar Plataforma')}
                        </div>
                    </button>
                </form>

                <div className="mt-5 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-slate-500 text-[11px] font-bold hover:text-slate-900 transition-colors"
                    >
                        {isRegistering ? 'Já tem uma conta? Entrar.' : 'Não tem conta? Cadastre-se agora.'}
                    </button>
                </div>
            </div>
        </div>
    )
}

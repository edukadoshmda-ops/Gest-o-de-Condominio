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
    const [tipoSelecionado, setTipoSelecionado] = useState('morador')

    useEffect(() => {
        if (!initialData) return
        setNome(initialData.nome || '')
        setEmail(initialData.email || '')
        setNomeCondominio(initialData.nomeCondominio || '')
        setTipoSelecionado(initialData.tipo || 'sindico')
        setIsRegistering(initialRegistering)
    }, [initialData, initialRegistering])

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isRegistering) {
                // 1. Buscar condomínio pelo nome
                const { data: condoData, error: condoError } = await supabase
                    .from('condominios')
                    .select('id')
                    .ilike('nome', nomeCondominio.trim())
                    .maybeSingle()

                if (condoError || !condoData) {
                    throw new Error("Condomínio não encontrado. Verifique o nome com o síndico ou na portaria.")
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
                    // 3. Criar perfil na tabela 'usuarios'
                    const { error: profileError } = await supabase
                        .from('usuarios')
                        .insert({
                            id: authData.user.id,
                            condominio_id: condoData.id,
                            nome: nome,
                            tipo: tipoSelecionado,
                            ativo: true
                        })

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
                    // Após logar, verifica se o usuário já tem registro na tabela 'usuarios'
                    const { data: userProfile, error: profileCheckError } = await supabase
                        .from('usuarios')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle()

                    // Se não tiver perfil, o App.jsx tentará criar ao carregar. Não criamos aqui para evitar
                    // vincular a condomínio errado (codigoAcesso/nome vazios no login).
                }
            }
        } catch (err) {
            setError(err.message || "Erro na autenticação. Verifique os dados.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements - azul suave */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-2xl relative z-10">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium"
                    >
                        <ArrowLeft size={18} /> Voltar
                    </button>
                )}
                <div className="flex flex-col items-center text-center mb-10">
                    <img src="/logo.png" alt="Gestor360 Logo" className="h-[131px] mb-4 object-contain" />
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                        {isRegistering ? 'Criar Conta' : 'Gestão de Condominios'}
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">
                        {isRegistering ? 'Cadastre-se para acessar o condomínio.' : 'Entre com suas credenciais para continuar.'}
                    </p>
                </div>

                {initialData?.trialEndsAt && isRegistering && (
                    <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left">
                        <div className="flex items-start gap-3">
                            <div className="size-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                                <Sparkles size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sky-700 text-[10px] font-black uppercase tracking-[0.2em]">Teste grátis ativado</p>
                                <p className="text-slate-900 text-sm font-bold">Seu período de 30 dias já começou.</p>
                                <p className="text-slate-600 text-xs">
                                    Conclua o cadastro do síndico para acessar o condomínio. Validade do teste até {initialData.trialEndsAt}.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-xl text-center mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isRegistering && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ex: João da Silva"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Condomínio</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={nomeCondominio}
                                        onChange={(e) => setNomeCondominio(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ex: Residencial Solar"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-500 font-medium ml-1">Digite o nome exato do seu condomínio. Em caso de dúvida, consulte o síndico.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Qual o seu Perfil?</label>
                                <div className="relative">
                                    <select
                                        value={tipoSelecionado}
                                        onChange={(e) => setTipoSelecionado(e.target.value)}
                                        disabled={!!initialData?.trialEndsAt}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all appearance-none cursor-pointer"
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full pt-4 group"
                    >
                        <div className="w-full flex items-center justify-center gap-2 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:shadow-sky-600/40 group-hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? 'Criar Cadastro' : 'Acessar Plataforma')}
                        </div>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-slate-500 text-xs font-bold hover:text-slate-900 transition-colors"
                    >
                        {isRegistering ? 'Já tem uma conta? Entrar.' : 'Não tem conta? Cadastre-se agora.'}
                    </button>
                </div>
            </div>
        </div>
    )
}

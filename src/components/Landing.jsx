import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/toast'
import {
    LayoutDashboard,
    MessageSquare,
    Package,
    Calendar,
    DollarSign,
    ClipboardList,
    Users,
    Settings,
    Bell,
    ChevronRight,
    LogIn,
    CheckCircle2,
    Download,
    Play,
    Sparkles,
    X,
    Phone,
    Mail,
    User,
    Building2,
    Loader2
} from 'lucide-react'
import { BlogCondominio } from './BlogCondominio'

const formatDate = (date) => {
    const [year, month, day] = String(date).split('-')
    return `${day}/${month}/${year}`
}

const TrialCta = ({ onClick, compact = false }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 text-slate-900 font-black shadow-xl shadow-amber-400/25 hover:scale-[1.02] transition ${compact ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-sm md:text-base'}`}
    >
        <Sparkles size={18} />
        Teste Gratis por 30 Dias
    </button>
)

export const Landing = ({ onEnter, onStartTrial, onWatchTrailer }) => {
    const { toast } = useToast()
    const [openFaq, setOpenFaq] = useState(null)
    const [activeRole, setActiveRole] = useState('sindico')
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstall, setShowInstall] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [showTrialModal, setShowTrialModal] = useState(false)
    const [trialLoading, setTrialLoading] = useState(false)
    const [trialForm, setTrialForm] = useState({
        nomeSindico: '',
        telefone: '',
        email: '',
        nomeCondominio: ''
    })

    useEffect(() => {
        const checkInstalled = () => {
            const standalone = window.matchMedia('(display-mode: standalone)').matches
            const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches
            const iosStandalone = !!navigator.standalone
            if (standalone || fullscreen || iosStandalone) setIsInstalled(true)
        }
        checkInstalled()
    }, [])

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowInstall(true)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') setShowInstall(false)
        setDeferredPrompt(null)
    }

    const updateTrialForm = (field, value) => {
        setTrialForm(prev => ({ ...prev, [field]: value }))
    }

    const handleStartTrialLead = async (e) => {
        e.preventDefault()
        setTrialLoading(true)

        try {
            const payload = {
                p_nome_sindico: trialForm.nomeSindico.trim(),
                p_telefone: trialForm.telefone.trim(),
                p_email: trialForm.email.trim().toLowerCase(),
                p_nome_condominio: trialForm.nomeCondominio.trim()
            }

            const { data, error } = await supabase.rpc('start_trial_lead', payload)
            if (error) throw error

            const result = Array.isArray(data) ? data[0] : data
            if (!result?.nome_condominio) {
                throw new Error('Nao foi possivel iniciar o teste gratis.')
            }

            toast('Teste gratis ativado com sucesso! Agora finalize o cadastro do sindico.', 'success')
            setShowTrialModal(false)
            setTrialForm({ nomeSindico: '', telefone: '', email: '', nomeCondominio: '' })
            onStartTrial?.({
                nome: trialForm.nomeSindico.trim(),
                email: trialForm.email.trim().toLowerCase(),
                nomeCondominio: result.nome_condominio,
                tipo: 'sindico',
                trialEndsAt: formatDate(result.trial_ends_at)
            })
        } catch (error) {
            toast(error.message || 'Erro ao iniciar teste gratis.', 'error')
        } finally {
            setTrialLoading(false)
        }
    }

    const features = [
        { icon: LayoutDashboard, title: 'Dashboard', desc: 'Visão geral: avisos, enquetes, indicadores e ações rápidas.' },
        { icon: MessageSquare, title: 'Mural e Chat', desc: 'Feed de publicações, comentários e chat com canais (Síndico, Portaria, Comercial, Diversos) e mensagens privadas.' },
        { icon: Package, title: 'Encomendas', desc: 'Controle de volumes na portaria por unidade e bloco.' },
        { icon: Calendar, title: 'Reservas', desc: 'Reserve salão, churrasqueira e demais áreas comuns.' },
        { icon: DollarSign, title: 'Financeiro', desc: 'Faturas, boletos e confirmação de pagamentos.' },
        { icon: ClipboardList, title: 'Chamados', desc: 'Ocorrências e solicitações com acompanhamento de status.' },
        { icon: Users, title: 'Visitantes', desc: 'Cadastro e liberação de visitantes.' },
        { icon: Settings, title: 'Patrimônio', desc: 'Controle de itens e manutenções.' },
        { icon: Bell, title: 'Notificações', desc: 'Centro de avisos e push no dispositivo.' },
    ]

    const steps = [
        { n: '01', title: 'Acesso à Plataforma', desc: 'Acesse via navegador ou adicione como PWA na tela inicial do celular.' },
        { n: '02', title: 'Área Inicial', desc: 'Na vitrine, clique em Entrar no canto superior para iniciar.' },
        { n: '03', title: 'Autenticação', desc: 'Use seu e-mail e senha cadastrados no condomínio.' },
        { n: '04', title: 'Sem cadastro?', desc: 'Peça ao síndico ou à administração para realizar sua matrícula.' },
    ]

    const roles = [
        { id: 'sindico', name: 'Síndico', desc: 'Acesso total ao condomínio: finanças, usuários, avisos, relatórios.' },
        { id: 'porteiro', name: 'Porteiro', desc: 'Encomendas, visitantes, chamados e avisos.' },
        { id: 'morador', name: 'Morador', desc: 'Mural, chat, encomendas, reservas, financeiro pessoal.' },
    ]

    const faqs = [
        { q: 'Por que usar um app para o condomínio?', a: 'Para centralizar comunicação, encomendas, reservas e pagamentos em um só lugar. Acaba com papéis e planilhas dispersas.' },
        { q: 'Quem tem acesso aos dados financeiros?', a: 'Somente síndicos e administradores com permissão. Os dados de cada condomínio ficam isolados e seguros.' },
        { q: 'Funciona no celular?', a: 'Sim! O app é PWA. Acesse pelo navegador e adicione à tela inicial como aplicativo nativo.' },
        { q: 'As mensagens do chat são privadas?', a: 'Os canais são compartilhados pelo condomínio. As mensagens privadas (DM) ficam apenas entre você e o morador escolhido.' },
    ]

    const tips = [
        { title: 'Foto de perfil', desc: 'Clique na sua foto no menu para trocar o avatar.' },
        { title: 'Tema visual', desc: 'Use o seletor de temas para personalizar as cores da interface.' },
        { title: 'Menu recolhido', desc: 'Clique na seta ao lado do menu para recolher ou expandir a barra lateral.' },
        { title: 'Esqueci a senha', desc: 'Na tela de login, use a opção de redefinição de senha.' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 h-24 md:h-28 flex items-center justify-center gap-12">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Gestor360" className="h-20 md:h-24 w-auto object-contain" />
                        <span className="font-bold text-2xl md:text-3xl text-slate-900">Gestor360</span>
                    </div>
                    <button
                        onClick={onEnter}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition shadow-lg shadow-sky-600/25"
                    >
                        <LogIn size={18} /> Entrar
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-sky-600/5 to-transparent">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sky-600 font-bold text-sm uppercase tracking-widest mb-4">Gestão de Condomínio</p>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-6 leading-tight">
                        O hub definitivo para simplificar a administração do seu condomínio
                    </h1>
                    <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                        Tudo o que você precisa em um único app: mural, chat, encomendas, reservas, financeiro e muito mais.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-sky-600 text-white font-black text-base shadow-xl shadow-sky-600/30 hover:scale-105 hover:bg-sky-700 transition"
                        >
                            Acessar o App <ChevronRight size={20} />
                        </a>
                        <button
                            onClick={onWatchTrailer}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-white text-sky-600 border-2 border-sky-600 font-black text-base hover:bg-sky-50 transition"
                        >
                            <Play size={20} className="fill-sky-600" /> Ver Apresentação
                        </button>
                    </div>
                    <div className="mt-6">
                        <TrialCta onClick={() => setShowTrialModal(true)} />
                    </div>
                </div>
            </section>

            {/* Veja o app em ação */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-black text-slate-900 mb-4">Veja o app em ação</h2>
                    <p className="text-slate-600 mb-8">Acesse o Gestor360 e descubra como ele simplifica o dia a dia do condomínio.</p>
                    <div className="bg-slate-100 rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center min-h-[240px] group">
                        <img src="/logo.png" alt="Gestor360" className="h-20 md:h-24 mb-4 object-contain group-hover:scale-110 transition-transform duration-500" />
                        <p className="text-slate-500 font-medium mb-8">Mural, Chat, Encomendas, Reservas, Financeiro e muito mais</p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition"
                            >
                                Acessar Agora <ChevronRight size={18} />
                            </a>
                            <button
                                onClick={onWatchTrailer}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                            >
                                <Play size={18} className="fill-slate-700" /> Iniciar Tour
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simplicidade */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-4">Simplicidade em cada acesso</h2>
                    <p className="text-slate-600 text-center mb-16 max-w-2xl mx-auto">Acesse relatórios, encomendas e comunicações em quatro passos simples, de qualquer dispositivo.</p>
                    <div className="grid md:grid-cols-4 gap-8">
                        {steps.map((s) => (
                            <div key={s.n} className="bg-white rounded-3xl p-8 border border-sky-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition">
                                <span className="text-4xl font-black text-sky-600 mb-4 block">{s.n}</span>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-slate-600 text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Menu/Perfis */}
            <section className="py-20 px-4 bg-slate-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-4">Perfis e Permissões</h2>
                    <p className="text-slate-600 text-center mb-12">Sistema de acesso seguro. Cada usuário vê apenas o que precisa.</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {roles.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setActiveRole(r.id)}
                                className={`px-6 py-3 rounded-full font-bold text-sm transition ${activeRole === r.id ? 'bg-sky-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-600/30'}`}
                            >
                                {r.name}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm">
                        <p className="text-slate-600 text-lg italic">"{roles.find(r => r.id === activeRole)?.desc}"</p>
                    </div>
                </div>
            </section>

            {/* Funcionalidades */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-4">Funcionalidades Principais</h2>
                    <p className="text-slate-600 text-center mb-16">Tudo para gerenciar seu condomínio de forma prática.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 flex gap-4 hover:shadow-lg hover:border-sky-600/20 transition">
                                <div className="size-12 rounded-xl bg-sky-600/10 flex items-center justify-center shrink-0">
                                    <f.icon className="text-sky-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                                    <p className="text-slate-600 text-sm">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Blog do Síndico */}
            <section className="py-20 px-4 bg-slate-50">
                <BlogCondominio embedded />
                <div className="max-w-6xl mx-auto pt-10 text-center">
                    <TrialCta onClick={() => setShowTrialModal(true)} />
                </div>
            </section>

            {/* Planos e Assinatura */}
            <section className="py-24 px-4 bg-white overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16 px-4">
                        <span className="text-sky-600 font-bold text-xs uppercase tracking-[0.3em] mb-3 block">Valor Justo e Transparente</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Plano Profissional Completo</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg md:text-xl font-medium">
                            A tecnologia definitiva para o seu condomínio. <span className="text-sky-600 font-bold">Todas as vantagens incluídas</span> em um único valor previsível.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto px-4">
                        <div className="group bg-slate-900 rounded-[40px] p-8 md:p-14 border border-slate-800 shadow-2xl shadow-sky-900/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 bg-sky-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-bl-3xl">Melhor Escolha</div>

                            <div className="flex flex-col lg:flex-row gap-12">
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-4 h-4 rounded-full bg-sky-400 animate-pulse"></div>
                                        <span className="text-white font-black text-2xl uppercase tracking-tighter">Gestor360 PRO ÚNICO</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-8 text-white">
                                        <span className="text-7xl font-black leading-none tracking-tighter">R$399</span>
                                        <span className="text-sky-400 font-bold text-2xl">/mês</span>
                                    </div>
                                    <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
                                        Toda a potência do Gestor360 liberada. <span className="text-white font-bold block mt-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center md:text-left">Uma única conta, todas as vantagens.</span>
                                    </p>
                                    <a
                                        href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center py-6 rounded-2xl bg-sky-600 text-white font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-sky-600/40 hover:scale-[1.03] hover:bg-sky-500 transition-all"
                                    >
                                        Assinar Agora <ChevronRight size={18} className="ml-2" />
                                    </a>
                                </div>

                                <div className="flex-1 bg-white/[0.04] rounded-[48px] p-8 md:p-12 border border-white/10 relative">
                                    <h4 className="text-sky-400 font-black text-[10px] uppercase tracking-[0.3em] mb-8 pr-4">O que está incluído no Plano:</h4>
                                    <ul className="grid grid-cols-1 gap-5">
                                        {[
                                            'Ideal para pequenos, médios e grandes condomínios',
                                            'Mural e Chat completo',
                                            'Controle de Encomendas Automático',
                                            'Gestão profissional de excelência',
                                            'Todos os recursos do Pro incluídos',
                                            'Reservas de Áreas Comuns',
                                            'Gestão Financeira Completa',
                                            'Usuários ilimitados ativos',
                                            'Suporte Prioritário 24/7',
                                            'Onboarding e Treinamento'
                                        ].map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-4 text-slate-300 text-sm font-semibold leading-snug hover:text-white transition-colors cursor-default">
                                                <CheckCircle2 size={20} className="text-sky-400 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 bg-sky-50 rounded-[40px] border border-sky-100 gap-8">
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-slate-900">Inovação no Custo-Benefício</h3>
                            <p className="text-slate-600 text-sm md:text-base">
                                No Gestor360, <span className="text-sky-700 font-black">o valor da assinatura pode ser dividido por cada morador</span>, tornando-se praticamente imperceptível na taxa de condomínio.
                            </p>
                        </div>
                        <div className="flex flex-col gap-4 w-full md:w-auto shrink-0">
                            <div className="bg-white p-5 rounded-3xl border border-sky-200">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Suporte Prioritário</p>
                                <div className="space-y-1">
                                    <p className="text-slate-900 font-bold text-sm">edukadoshmda@gmail.com</p>
                                    <p className="text-sky-600 font-black text-sm">WhatsApp (91) 99383-7093</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dicas */}
            <section className="py-20 px-4 bg-slate-100">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-12">Dicas de Uso</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {tips.map((t, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 flex gap-4">
                                <CheckCircle2 className="text-sky-600 shrink-0 mt-0.5" size={22} />
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1">{t.title}</h4>
                                    <p className="text-slate-600 text-sm">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-12">Dúvidas Frequentes</h2>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full px-6 py-4 text-left flex justify-between items-center font-bold text-slate-900 hover:bg-slate-50 transition"
                                >
                                    {f.q}
                                    <ChevronRight size={20} className={`transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-4 text-slate-600 text-sm border-t border-slate-100 pt-3">
                                        {f.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 px-4 bg-sky-600">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-white mb-4">Pronto para simplificar sua gestão?</h2>
                    <p className="text-white/90 mb-8">Acesse o Gestor360 e descubra como é fácil administrar o condomínio.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onEnter}
                            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl border-2 border-white text-white font-black text-base hover:bg-white/10 transition"
                        >
                            Acessar Log-in <LogIn size={20} />
                        </button>
                        <a
                            href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-sky-600 font-black text-base hover:scale-105 transition shadow-xl"
                        >
                            Assinar Agora <DollarSign size={20} />
                        </a>
                    </div>
                    <div className="mt-6">
                        <TrialCta onClick={() => setShowTrialModal(true)} />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 bg-slate-900 text-slate-400 text-center text-sm">
                <p>Gestor360 — Gestão de Condomínio © {new Date().getFullYear()}</p>
            </footer>

            {/* Instalador PWA flutuante - canto inferior direito */}
            {!isInstalled && (
                <div className="fixed bottom-4 right-4 z-50 w-56 rounded-2xl bg-white shadow-xl border border-sky-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src="/logo.png" alt="Gestor360" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">Gestor360</span>
                    </div>
                    {showInstall && deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition"
                        >
                            <Download size={18} /> Instalar App
                        </button>
                    ) : (
                        <p className="text-slate-500 text-xs">Adicione à tela inicial pelo menu do navegador.</p>
                    )}
                </div>
            )}

            {showTrialModal && (
                <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-[32px] bg-white border border-slate-200 shadow-2xl p-6 md:p-8 relative">
                        <button
                            type="button"
                            onClick={() => setShowTrialModal(false)}
                            className="absolute top-5 right-5 size-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition"
                        >
                            <X size={18} />
                        </button>

                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                <Sparkles size={14} />
                                Teste Gratis por 30 Dias
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                                Cadastre seu condominio e comece agora
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Preencha os dados do sindico responsavel. O lead sera salvo e o periodo de teste comeca imediatamente apos este cadastro.
                            </p>
                        </div>

                        <form onSubmit={handleStartTrialLead} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Sindico</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={trialForm.nomeSindico}
                                        onChange={(e) => updateTrialForm('nomeSindico', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        placeholder="Ex: Maria Oliveira"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="tel"
                                            required
                                            value={trialForm.telefone}
                                            onChange={(e) => updateTrialForm('telefone', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            placeholder="(91) 99999-9999"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={trialForm.email}
                                            onChange={(e) => updateTrialForm('email', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                            placeholder="sindico@condominio.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome do Condominio</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={trialForm.nomeCondominio}
                                        onChange={(e) => updateTrialForm('nomeCondominio', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                        placeholder="Ex: Residencial Solar das Palmeiras"
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                                <p className="text-sky-700 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Importante</p>
                                <p className="text-slate-600 text-sm">
                                    Apos enviar, o lead sera salvo, o condominio sera criado com validade inicial de 30 dias e voce sera levado para concluir o cadastro do login do sindico.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={trialLoading}
                                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-amber-400/25 hover:scale-[1.01] transition disabled:opacity-60"
                            >
                                {trialLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                Iniciar Teste Gratis
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

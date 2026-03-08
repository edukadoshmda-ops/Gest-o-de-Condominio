import React, { useState, useEffect } from 'react'
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
    Play
} from 'lucide-react'

export const Landing = ({ onEnter, onWatchTrailer }) => {
    const [openFaq, setOpenFaq] = useState(null)
    const [activeRole, setActiveRole] = useState('sindico')
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstall, setShowInstall] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

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

            {/* Planos e Assinatura */}
            <section className="py-24 px-4 bg-white overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="max-w-6xl mx-auto relative">
                    <div className="text-center mb-16">
                        <span className="text-sky-600 font-bold text-xs uppercase tracking-[0.3em] mb-3 block">Transparência Total</span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Planos e Assinatura</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                            Escolha o plano ideal para o tamanho do seu condomínio. <br className="hidden md:block" />
                            <span className="font-bold text-sky-600">Teste grátis por 7 dias!</span>
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                        {/* Plano Pro */}
                        <div className="group bg-white rounded-[40px] p-10 border border-slate-200 hover:border-sky-500/30 transition-all duration-500 flex flex-col hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-slate-900 font-black text-xl uppercase tracking-tighter">Plano Pro</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 leading-none">R$199</span>
                                    <span className="text-slate-500 font-bold">/mês</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-3 font-medium">Ideal para pequenos condomínios até 50 moradores.</p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Até 50 usuários
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Mural e Chat completo
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Controle de Encomendas
                                </li>
                            </ul>

                            <a
                                href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-black text-xs text-center uppercase tracking-widest hover:bg-sky-50 hover:border-sky-200 transition-all"
                            >
                                Começar Teste
                            </a>
                        </div>

                        {/* Plano Business */}
                        <div className="group bg-slate-900 rounded-[40px] p-10 border border-slate-800 shadow-2xl shadow-sky-900/20 scale-105 z-10 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl">Mais Popular</div>
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-4 rounded-full bg-sky-400"></div>
                                    <span className="text-white font-black text-xl uppercase tracking-tighter">Business</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white leading-none">R$299</span>
                                    <span className="text-sky-400/80 font-bold">/mês</span>
                                </div>
                                <p className="text-slate-400 text-sm mt-3 font-medium">O padrão ouro para gestão eficiente de médio porte.</p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-400" /> Até 100 usuários
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-400" /> Todos os recursos do Pro
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-400" /> Reservas de Áreas Comuns
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-400" /> Gestão Financeira Completa
                                </li>
                            </ul>

                            <a
                                href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-5 rounded-2xl bg-sky-600 text-white font-black text-xs text-center uppercase tracking-widest shadow-xl shadow-sky-600/40 hover:scale-105 transition-all"
                            >
                                Escolher Plano
                            </a>
                        </div>

                        {/* Plano Enterprise */}
                        <div className="group bg-white rounded-[40px] p-10 border border-slate-200 hover:border-red-500/30 transition-all duration-500 flex flex-col hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-slate-900 font-black text-xl uppercase tracking-tighter leading-none">Plano Enterprise</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 leading-none">R$399</span>
                                    <span className="text-slate-500 font-bold">/mês</span>
                                </div>
                                <p className="text-slate-500 text-sm mt-3 font-medium">Alta escala para grandes complexos residenciais.</p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Até 500 usuários
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Suporte Prioritário 24/7
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium">
                                    <CheckCircle2 size={18} className="text-sky-600" /> Onboarding e Treinamento
                                </li>
                            </ul>

                            <a
                                href="https://pay.hotmart.com/K104799418K?bid=1772928858405"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-5 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 font-black text-xs text-center uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                            >
                                Falar com Consultor
                            </a>
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
        </div>
    )
}

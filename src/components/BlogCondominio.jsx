import React from 'react'
import {
    BookOpen,
    ExternalLink,
    PlayCircle,
    Sparkles,
    MessageSquare,
    Users,
    Package,
    CreditCard,
    Calendar,
    Wrench,
    BarChart3,
    Box,
    Bell,
    FileText,
    Settings,
    User,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react'

const appFeatures = [
    { id: 'inicio', title: 'Dashboard', description: 'Visão geral do condomínio, atalhos e indicadores importantes.', icon: Sparkles },
    { id: 'mural', title: 'Mural', description: 'Avisos, enquetes, comunicados e interação da comunidade.', icon: MessageSquare },
    { id: 'visitantes', title: 'Visitantes', description: 'Controle de entrada, histórico e autorização de acesso.', icon: Users },
    { id: 'encomendas', title: 'Encomendas', description: 'Registro de entregas e notificações para moradores.', icon: Package },
    { id: 'financeiro', title: 'Financeiro', description: 'Faturas, receitas, despesas e acompanhamento do caixa.', icon: CreditCard },
    { id: 'reservas', title: 'Reservas', description: 'Agendamento de áreas comuns com organização e regras.', icon: Calendar },
    { id: 'chamados', title: 'Chamados', description: 'Registro de ocorrências, manutenção e acompanhamento.', icon: Wrench },
    { id: 'relatorios', title: 'Relatórios', description: 'Leitura estratégica dos dados para decisões mais rápidas.', icon: BarChart3 },
    { id: 'patrimonio', title: 'Patrimônio', description: 'Controle de bens, garantias, depreciação e histórico.', icon: Box },
    { id: 'notificacoes', title: 'Notificações', description: 'Central de alertas e avisos relevantes do condomínio.', icon: Bell },
    { id: 'documentos', title: 'Atas e Regulamentos', description: 'Documentos essenciais para a rotina administrativa.', icon: FileText },
    { id: 'usuarios', title: 'Gestão de Perfis', description: 'Permissões e organização de acesso por perfil.', icon: ShieldAlert },
    { id: 'config', title: 'Configurações', description: 'Preferências do sistema e notificações do usuário.', icon: Settings },
    { id: 'perfil', title: 'Meu Perfil', description: 'Dados pessoais e informações da conta do usuário.', icon: User }
]

const topics = [
    {
        title: 'Liderança e papel estratégico do síndico',
        category: 'Gestão',
        summary: 'O síndico moderno precisa liderar pessoas, organizar processos e tomar decisões com transparência.',
        tips: [
            'Defina prioridades mensais e acompanhe pendências em um painel simples.',
            'Comunique decisões com clareza para reduzir ruídos com moradores.',
            'Use dados do condomínio para justificar ações e investimentos.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/evolucao-papel-sindico-colunistas-artigos-e-opinioes',
        videoUrl: 'https://www.youtube.com/results?search_query=lideranca+do+sindico+condominio'
    },
    {
        title: 'Rotinas administrativas sem caos',
        category: 'Organização',
        summary: 'Uma rotina organizada evita retrabalho, perda de prazo e problemas com contratos, assembleias e documentos.',
        tips: [
            'Mantenha um calendário com vencimentos, manutenções e reuniões.',
            'Centralize documentos e atas em um único local.',
            'Padronize processos recorrentes para a equipe e para a administradora.'
        ],
        articleUrl: 'https://ethoscondominios.com.br/rotinas-administrativas-do-sindico-guia-pratico-para-organizar-a-gestao/',
        videoUrl: 'https://www.youtube.com/results?search_query=rotina+administrativa+sindico+condominio'
    },
    {
        title: 'Comunicação com moradores e transparência',
        category: 'Comunicação',
        summary: 'Condomínios bem informados geram menos conflito e mais participação nas decisões.',
        tips: [
            'Publique avisos objetivos com contexto, prazo e responsável.',
            'Evite mensagens longas quando um resumo visual resolver.',
            'Use canais oficiais para reduzir boatos e desencontro de informação.'
        ],
        articleUrl: 'https://vivaocondominio.com.br/noticias/dia-a-dia/gestao-eficiente-de-condominios-melhores-praticas-para-sindicos-e-administradores/',
        videoUrl: 'https://www.youtube.com/results?search_query=comunicacao+com+moradores+condominio+sindico'
    },
    {
        title: 'Planejamento financeiro e previsibilidade',
        category: 'Financeiro',
        summary: 'Boa gestão financeira protege o condomínio, evita surpresas e melhora a confiança dos condôminos.',
        tips: [
            'Acompanhe despesas fixas, variáveis e inadimplência em base mensal.',
            'Monte orçamento anual com reserva para emergências.',
            'Mostre balancetes e evolução dos custos com clareza.'
        ],
        articleUrl: 'https://www.peggomarket.com.br/blog/gestao-eficiente-de-condominios-melhores-praticas-para-sindicos-e-administradores',
        videoUrl: 'https://www.youtube.com/results?search_query=gestao+financeira+condominio+sindico'
    },
    {
        title: 'Assembleias mais produtivas',
        category: 'Assembleias',
        summary: 'Assembleias bem conduzidas economizam tempo, evitam nulidades e aumentam a qualidade das decisões.',
        tips: [
            'Envie a pauta com antecedência e linguagem fácil.',
            'Leve dados, comparativos e orçamentos para apoiar votação.',
            'Registre tudo corretamente em ata e disponibilize depois.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/como-conduzir-uma-assembleia-administracao-assembleias-de-condominio',
        videoUrl: 'https://www.youtube.com/results?search_query=assembleia+de+condominio+sindico'
    },
    {
        title: 'Inadimplência e cobrança responsável',
        category: 'Cobrança',
        summary: 'Reduzir a inadimplência exige régua de cobrança, consistência e respaldo legal.',
        tips: [
            'Monitore atrasos logo no início e atue antes da dívida crescer.',
            'Padronize comunicações e negociações com histórico registrado.',
            'Nunca perdoe multas sem respaldo da convenção e da assembleia.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/o-que-diz-a-lei-sobre-inadimplencia-em-condominios-administracao-inadimplencia-em-condominios',
        videoUrl: 'https://www.youtube.com/results?search_query=inadimplencia+condominio+sindico'
    },
    {
        title: 'Manutenção preventiva e valorização do patrimônio',
        category: 'Manutenção',
        summary: 'Prevenir custa menos do que corrigir e ainda reduz risco de acidentes e perdas patrimoniais.',
        tips: [
            'Crie um cronograma preventivo por sistema e por área comum.',
            'Guarde notas, laudos e histórico de serviços.',
            'Use o módulo de patrimônio para acompanhar garantias e estado dos bens.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/a-importancia-da-manutencao-preventiva-nos-condominios-colunistas-gabriel-karpat',
        videoUrl: 'https://www.youtube.com/results?search_query=manutencao+preventiva+condominio+sindico'
    },
    {
        title: 'Segurança e controle de acesso',
        category: 'Segurança',
        summary: 'Segurança condominial depende tanto de tecnologia quanto de processo e treinamento.',
        tips: [
            'Revise rotinas da portaria e pontos vulneráveis do prédio.',
            'Treine equipe para abordagem, validação e exceções.',
            'Use o controle de visitantes e encomendas para rastreabilidade.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/os-5-pontos-mais-vulneraveis-na-seguranca-do-condominio-convivencia-guia-sobre-seguranca',
        videoUrl: 'https://www.youtube.com/results?search_query=seguranca+em+condominio+sindico'
    },
    {
        title: 'Contratos, fornecedores e terceirizadas',
        category: 'Fornecedores',
        summary: 'Escolher mal um fornecedor pode gerar problemas financeiros, jurídicos e operacionais.',
        tips: [
            'Compare propostas com escopo e prazo iguais.',
            'Cheque certidões, cláusulas de rescisão e reajuste.',
            'Acompanhe entregas e desempenho com indicadores simples.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/atencao-com-os-contratos-assinados-pelo-sindico-colunistas-fernando-augusto-zito',
        videoUrl: 'https://www.youtube.com/results?search_query=contratos+fornecedores+condominio+sindico'
    },
    {
        title: 'Documentos, regimento e compliance',
        category: 'Documentação',
        summary: 'Convenção, regimento, atas e comunicados precisam estar atualizados, acessíveis e coerentes.',
        tips: [
            'Digitalize documentos importantes e facilite a consulta.',
            'Atualize regimentos quando a realidade do condomínio mudar.',
            'Centralize atas, normas e evidências de decisões.'
        ],
        articleUrl: 'https://www.sindiconet.com.br/informese/convencao-e-regimento-interno-colunistas-inaldo-dantas',
        videoUrl: 'https://www.youtube.com/results?search_query=regimento+interno+condominio+sindico'
    }
]

const FeatureCard = ({ icon: Icon, title, description, onClick }) => {
    const Tag = onClick ? 'button' : 'div'

    return (
        <Tag
            onClick={onClick}
            className={`bg-white rounded-3xl border border-slate-200 p-5 text-left transition-all group ${onClick ? 'hover:border-sky-400/40 hover:shadow-xl cursor-pointer' : ''}`}
        >
            <div className="size-12 rounded-2xl bg-sky-50 border border-slate-200 flex items-center justify-center mb-4">
                <Icon size={22} className="text-sky-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-slate-900 font-black text-sm mb-2">{title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
        </Tag>
    )
}

export const BlogCondominio = ({ setActiveTab, embedded = false }) => {
    return (
        <div className={`mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${embedded ? 'max-w-6xl' : 'max-w-7xl'}`}>
            <section className="bg-white rounded-[32px] border border-slate-200 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-sky-100 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
                <div className="relative space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        <BookOpen size={14} />
                        Blog do Síndico
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-slate-900 text-2xl md:text-3xl font-black tracking-tight leading-tight">
                            Conteúdo prático para usar o app melhor e gerir o condomínio com mais segurança
                        </h2>
                        <p className="text-slate-500 text-sm max-w-3xl leading-relaxed">
                            Este espaço reúne as funções principais do Gestor360, dicas de rotina para síndicos
                            e 10 temas relevantes com links de artigos e vídeos para aprofundar a gestão condominial.
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-slate-900 text-lg md:text-xl font-black tracking-tight">Funções do app</h3>
                    <p className="text-slate-500 text-sm">
                        {setActiveTab ? 'Clique em qualquer função para abrir o módulo dentro do sistema.' : 'Conheça os módulos principais disponíveis para moradores, porteiros e síndicos.'}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {appFeatures.map((feature) => (
                        <FeatureCard
                            key={feature.id}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            onClick={setActiveTab ? () => setActiveTab(feature.id) : undefined}
                        />
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-slate-900 text-lg md:text-xl font-black tracking-tight">10 temas relevantes para síndicos</h3>
                    <p className="text-slate-500 text-sm">Curadoria com leitura rápida, dicas objetivas e links externos para estudo.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {topics.map((topic, index) => (
                        <article key={topic.title} className="bg-white rounded-[28px] border border-slate-200 p-6 md:p-7 space-y-5 hover:border-sky-300 transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
                                        <span>{String(index + 1).padStart(2, '0')}</span>
                                        <span>{topic.category}</span>
                                    </div>
                                    <h4 className="text-slate-900 text-base md:text-lg font-black leading-tight">{topic.title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{topic.summary}</p>
                                </div>
                                <div className="size-12 rounded-2xl bg-sky-50 border border-slate-200 flex items-center justify-center shrink-0">
                                    <BookOpen size={20} className="text-sky-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {topic.tips.map((tip) => (
                                    <div key={tip} className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-sky-600 mt-0.5 shrink-0" />
                                        <p className="text-slate-600 text-sm leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <a
                                    href={topic.articleUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-sky-600 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-all"
                                >
                                    <ExternalLink size={16} />
                                    Ler artigo
                                </a>
                                <a
                                    href={topic.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-wider hover:border-sky-300 transition-all"
                                >
                                    <PlayCircle size={16} className="text-sky-600" />
                                    Ver vídeos
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    )
}
